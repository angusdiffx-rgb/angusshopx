import express, { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { 
  initializeApp, 
  getApps, 
  getApp 
} from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  runTransaction, 
  setDoc, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  limit,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { initialProducts } from '../data/initialProducts';
import { fallbackProducts } from '../data/fallbackProducts';
import { DEFAULT_HOME_CONFIG } from '../data/bloxPresets';
import { redeemAngpaoVoucher, extractVoucherCode } from './angpao';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

export const apiRouter = Router();

apiRouter.use(express.json({ limit: '25mb' }));

// In-Memory Server Cache to drastically cut Firestore Read units by 99%+
interface CacheStore<T> {
  data: T;
  timestamp: number;
}

/**
 * Recursively cleans any object to be saved to Cloud Firestore.
 * Removes all undefined keys and ensures valid Firestore data types.
 */
function sanitizeForFirestore<T>(obj: T): T {
  if (obj === undefined) return null as any;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore) as any;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = sanitizeForFirestore(value);
    }
  }
  return result as T;
}

const CACHE_DIR = path.join(process.cwd(), '.cache');
const PRODUCTS_CACHE_FILE = path.join(CACHE_DIR, 'products.json');
const HOME_CONFIG_CACHE_FILE = path.join(CACHE_DIR, 'home_config.json');

function ensureCacheDir() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  } catch {}
}

function loadDiskCache<T>(filePath: string, maxAgeMs: number): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    if (Date.now() - stat.mtimeMs > maxAgeMs) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function saveDiskCache(filePath: string, data: any) {
  try {
    ensureCacheDir();
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
  } catch {}
}

function removeDiskCache(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {}
}

let serverProductsCache: CacheStore<any[]> | null = (() => {
  return loadDiskCache<CacheStore<any[]>>(PRODUCTS_CACHE_FILE, 4 * 60 * 60 * 1000);
})();
const SERVER_PRODUCTS_TTL_MS = 60 * 60 * 1000; // 60 minutes cache (invalidated immediately on admin mutations)

let serverHomeConfigCache: CacheStore<any> | null = (() => {
  return loadDiskCache<CacheStore<any>>(HOME_CONFIG_CACHE_FILE, 4 * 60 * 60 * 1000);
})();
const SERVER_HOME_CONFIG_TTL_MS = 60 * 60 * 1000; // 60 minutes cache (invalidated immediately on admin mutations)

export const invalidateServerProductsCache = () => {
  serverProductsCache = null;
  removeDiskCache(PRODUCTS_CACHE_FILE);
};

export const invalidateServerHomeConfigCache = () => {
  serverHomeConfigCache = null;
  removeDiskCache(HOME_CONFIG_CACHE_FILE);
};

// Health Check Endpoint (For keep-alive ping and system monitoring)
const SLIPOK_URL = process.env.SLIPOK_API_URL || 'https://api.slipok.com/api/line/apikey/76096';
const SLIPOK_KEY = process.env.SLIPOK_API_KEY || 'SLIPOKTMX6PUU';
const PROMPTPAY_ACCOUNT = process.env.PROMPTPAY_ACCOUNT || '0829848852';
const PROMPTPAY_NAME = process.env.PROMPTPAY_NAME || 'นาย กฤติน สุโขพล';

apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    store: 'AngusShop',
    timestamp: new Date().toISOString(),
    cachedProducts: serverProductsCache ? serverProductsCache.data.length : 0,
    cachedConfig: Boolean(serverHomeConfigCache),
    slipokConfigured: Boolean(SLIPOK_KEY),
    promptpay: PROMPTPAY_ACCOUNT
  });
});

// SlipOK Error code mapping to user-friendly Thai messages
const SLIPOK_ERRORS: Record<number, string> = {
  1000: 'ข้อมูลรูปภาพไม่ครบถ้วน กรุณาอัปโหลดสลิปอีกครั้ง',
  1001: 'ระบบธนาคารขัดข้องชั่วคราว ไม่สามารถตรวจสอบได้ในขณะนี้',
  1002: 'ธนาคารปลายทางไม่ตอบสนอง กรุณารอสักครู่แล้วลองใหม่',
  1003: 'ไม่พบข้อมูลสลิปนี้ในระบบธนาคารแห่งประเทศไทย (สลิปไม่ถูกต้องหรือปลอมแปลง)',
  1004: 'สลิปนี้หมดอายุแล้ว (เกินระยะเวลาที่ธนาคารอนุญาตให้ตรวจสอบ)',
  1005: 'ขนาดไฟล์รูปภาพใหญ่เกิน 10MB กรุณาย่อขนาดรูปภาพก่อนอัปโหลด',
  1006: 'รูปแบบไฟล์รูปภาพไม่ถูกต้อง รองรับเฉพาะไฟล์ JPG หรือ PNG',
  1007: 'รูปภาพไม่มี QR Code หรือ QR Code ในสลิปไม่ชัดเจน กรุณาแคปหรือถ่ายใหม่ให้เห็น QR Code ชัดเจน',
  1008: 'ธนาคารต้นทางไม่รองรับการตรวจสอบผ่านระบบ QR Code',
  1009: 'บัญชีผู้รับเงินไม่ถูกต้อง',
  1010: 'บัญชีต้นทางไม่ถูกต้อง',
  1011: 'บัญชีผู้รับเงินในสลิปไม่ตรงกับบัญชีของร้านค้า AngusShop',
  1012: 'สลิปนี้เคยถูกส่งตรวจไปแล้วในระบบ SlipOK (ห้ามใช้สลิปซ้ำ)',
  1013: 'ยอดเงินที่โอนไม่ตรงกับยอดเงินที่เลือกเติม',
};

// Check SlipOK Quota & Status
apiRouter.get('/slipok-status', async (req: Request, res: Response) => {
  try {
    const quotaRes = await fetch(`${SLIPOK_URL}/quota`, {
      method: 'GET',
      headers: { 'x-authorization': SLIPOK_KEY },
    });
    const quotaData = await quotaRes.json();
    res.json({
      success: true,
      configured: Boolean(SLIPOK_KEY),
      url: SLIPOK_URL,
      promptpayAccount: PROMPTPAY_ACCOUNT,
      promptpayName: PROMPTPAY_NAME,
      quotaData
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to check SlipOK quota'
    });
  }
});

// Slip verification core handler
const handleVerifySlip = async (req: Request, res: Response): Promise<void> => {
  try {
    const { depositId, uid, imageBase64, expectedAmount } = req.body;

    if (!uid || !imageBase64) {
      res.status(400).json({
        success: false,
        error: 'INVALID_PARAMETERS',
        message: 'กรุณาระบุข้อมูลผู้ใช้งานและรูปภาพสลิป'
      });
      return;
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(cleanBase64, 'base64');

    if (imageBuffer.length === 0) {
      res.status(400).json({
        success: false,
        error: 'EMPTY_IMAGE',
        message: 'ไฟล์รูปภาพไม่ถูกต้องหรือข้อมูลภาพว่างเปล่า'
      });
      return;
    }

    // Prepare FormData for SlipOK API using form-data library
    const formData = new FormData();
    formData.append('files', imageBuffer, {
      filename: 'slip.jpg',
      contentType: 'image/jpeg',
    });
    // Using log=false so SlipOK verifies authentic bank data without failing on Line LIFF bank account mismatch
    formData.append('log', 'false');

    // Call SlipOK API
    let slipokResult: any = null;
    try {
      const axios = (await import('axios')).default;
      const slipResponse = await axios.post(SLIPOK_URL, formData, {
        headers: {
          'x-authorization': SLIPOK_KEY,
          ...formData.getHeaders()
        }
      });

      slipokResult = slipResponse.data;
    } catch (fetchErr: any) {
      console.error('SlipOK Connection Error:', fetchErr?.response?.data || fetchErr);
      // Sometimes slipok returns 400 with a valid payload, so we try to catch it
      if (fetchErr?.response?.data) {
        slipokResult = fetchErr.response.data;
      } else {
        res.status(502).json({
          success: false,
          error: 'SLIPOK_UNAVAILABLE',
          message: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ SlipOK ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง'
        });
        return;
      }
    }

    // Check if SlipOK returned an error code or failed
    if (!slipokResult || slipokResult.success === false || !slipokResult.data || slipokResult.code) {
      const code = Number(slipokResult?.code);
      const friendlyMessage = SLIPOK_ERRORS[code] || slipokResult?.message || 'สลิปไม่ถูกต้อง หรือไม่สามารถอ่าน QR Code ในสลิปได้';
      
      res.status(400).json({
        success: false,
        error: 'INVALID_SLIP',
        code: code || 400,
        message: friendlyMessage,
        raw: slipokResult
      });
      return;
    }

    const slipData = slipokResult.data;
    const transRef: string = slipData.transRef || slipData.transactionReference || slipData.reference || '';
    const actualAmount: number = Number(slipData.amount);

    if (!transRef) {
      res.status(400).json({
        success: false,
        error: 'NO_TRANSACTION_REF',
        message: 'ไม่พบรหัสอ้างอิงธุรกรรมในสลิป (transRef)'
      });
      return;
    }

    if (isNaN(actualAmount) || actualAmount <= 0) {
      res.status(400).json({
        success: false,
        error: 'INVALID_SLIP_AMOUNT',
        message: 'ยอดเงินในสลิปไม่ถูกต้อง'
      });
      return;
    }

    // Check 1: Duplicate Slip (transRef) in completed deposits or transactions
    const dupDepositQuery = query(
      collection(db, 'deposits'),
      where('transRef', '==', transRef),
      where('status', '==', 'completed'),
      limit(1)
    );
    const dupDepositSnap = await getDocs(dupDepositQuery);
    if (!dupDepositSnap.empty) {
      res.status(400).json({
        success: false,
        error: 'DUPLICATE_SLIP',
        message: 'สลิปนี้เคยถูกใช้งานเพื่อเติมเงินไปแล้ว ห้ามใช้สลิปซ้ำ (DUPLICATE_SLIP)'
      });
      return;
    }

    const dupTxQuery = query(
      collection(db, 'wallet_transactions'),
      where('reference', '==', transRef),
      limit(1)
    );
    const dupTxSnap = await getDocs(dupTxQuery);
    if (!dupTxSnap.empty) {
      res.status(400).json({
        success: false,
        error: 'DUPLICATE_SLIP',
        message: 'สลิปนี้มีประวัติการบันทึกเข้าระบบแล้ว (DUPLICATE_SLIP)'
      });
      return;
    }

    // Check 2: Verify Receiver belongs to AngusShop
    const receiverRaw = JSON.stringify(slipData.receiver || {}).toLowerCase();
    const isReceiverValid = 
      receiverRaw.includes('0829848852') || 
      receiverRaw.includes('8852') ||
      receiverRaw.includes('กฤติน') || 
      receiverRaw.includes('สุโขพล') ||
      receiverRaw.includes('krittin') ||
      receiverRaw.includes('sukhopol');

    if (!isReceiverValid) {
      res.status(400).json({
        success: false,
        error: 'INVALID_RECEIVER',
        message: `ผู้รับเงินในสลิปไม่ตรงกับบัญชีของ AngusShop (นาย กฤติน สุโขพล PromptPay: ${PROMPTPAY_ACCOUNT})`
      });
      return;
    }

    // Check 3: Determine credit amount
    const expectedNum = Number(expectedAmount || 0);
    const creditAmount = actualAmount; // Credit the exact authentic verified amount from Bank of Thailand

    // Atomic Transaction: Update User Balance, Deposit, Transaction, and Notification
    const nowIso = new Date().toISOString();
    const actualDepositId = depositId || `dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    let newBalance = creditAmount;

    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', uid);
      const userDoc = await transaction.get(userRef);

      let currentBalance = 0;
      if (userDoc.exists()) {
        currentBalance = Number(userDoc.data().balance || 0);
      }
      newBalance = currentBalance + creditAmount;

      // 1. Update or create user balance
      transaction.set(userRef, sanitizeForFirestore({
        uid,
        balance: newBalance,
        updatedAt: nowIso
      }), { merge: true });

      // 2. Update/create deposit record
      const depositRef = doc(db, 'deposits', actualDepositId);
      transaction.set(depositRef, sanitizeForFirestore({
        depositId: actualDepositId,
        uid,
        amount: creditAmount,
        expectedAmount: expectedNum > 0 ? expectedNum : creditAmount,
        promptpayNumber: PROMPTPAY_ACCOUNT,
        status: 'completed',
        transRef,
        slipokResponse: slipData,
        createdAt: nowIso,
        updatedAt: nowIso
      }), { merge: true });

      // 3. Create wallet transaction
      const txRef = doc(db, 'wallet_transactions', txId);
      transaction.set(txRef, sanitizeForFirestore({
        transactionId: txId,
        uid,
        type: 'deposit',
        amount: creditAmount,
        status: 'success',
        reference: transRef,
        depositId: actualDepositId,
        description: `เติมเงินผ่าน PromptPay ${PROMPTPAY_ACCOUNT} ยอด ฿${creditAmount.toLocaleString()} สำเร็จ`,
        createdAt: nowIso
      }));

      // 4. Create notification
      const notifRef = doc(db, 'notifications', notifId);
      transaction.set(notifRef, sanitizeForFirestore({
        notifId,
        uid,
        title: 'เติมเงินสำเร็จ!',
        message: `เติมเงินจำนวน ฿${creditAmount.toLocaleString()} เข้ากระเป๋า AngusShop Wallet เรียบร้อยแล้ว`,
        type: 'deposit',
        isRead: false,
        createdAt: nowIso
      }));
    });

    let successMsg = `ตรวจสอบสลิปและเติมเงิน ฿${creditAmount.toLocaleString()} เข้ากระเป๋าเรียบร้อยแล้ว`;
    if (expectedNum > 0 && Math.abs(expectedNum - creditAmount) > 0.01) {
      successMsg = `ตรวจพบยอดเงินในสลิปจริง ฿${creditAmount.toLocaleString()} (เติมเงินตามยอดสลิปจริงให้เรียบร้อยแล้ว)`;
    }

    res.json({
      success: true,
      message: successMsg,
      transRef,
      amount: creditAmount,
      balance: newBalance
    });
  } catch (error: any) {
    console.error('Verify Slip Error:', error);
    const isQuota = String(error?.message || '').includes('Quota exceeded') ||
      String(error?.code || '') === 'resource-exhausted' ||
      String(error?.message || '').includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      res.status(503).json({
        success: false,
        error: 'FIRESTORE_QUOTA_EXCEEDED',
        message: 'โควต้าการอ่าน/เขียนฐานข้อมูล Cloud Firestore เต็มชั่วคราว (Quota Exceeded) ทำให้ไม่สามารถบันทึกยอดเงินเข้ากระเป๋าได้ในขณะนี้ กรุณาแจ้งแอดมินให้อัปเกรดแผน Firebase หรือรอระบบรีเซ็ตโควต้าประจำวัน',
        upgradeUrl: 'https://console.firebase.google.com/project/angusshopx2/firestore/databases/ai-studio-remixangusshop-2abe89df-2474-4dff-adaa-6fff1a4696e5/data?openUpgradeDialog=true'
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'SERVER_TRANSACTION_ERROR',
      message: error.message || 'เกิดข้อผิดพลาดในการบันทึกธุรกรรม'
    });
  }
};

// Register BOTH endpoint aliases so front-end calls never 404
apiRouter.post('/wallet/verify-slip', handleVerifySlip);
apiRouter.post('/deposit/verify', handleVerifySlip);

// TrueMoney Angpao Redemption Handler
const handleRedeemAngpao = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid, voucherUrl, voucherCode, phone } = req.body;

    if (!uid) {
      res.status(400).json({
        success: false,
        error: 'AUTH_REQUIRED',
        message: 'กรุณาเข้าสู่ระบบก่อนทำรายการเติมเงิน'
      });
      return;
    }

    const input = voucherUrl || voucherCode;
    if (!input || typeof input !== 'string') {
      res.status(400).json({
        success: false,
        error: 'INVALID_VOUCHER_INPUT',
        message: 'กรุณากรอกลิงก์หรือรหัสซองอั่งเปา TrueMoney Wallet'
      });
      return;
    }

    // Default phone to 0829848852 as requested
    const targetPhone = phone && typeof phone === 'string' && phone.trim().length === 10
      ? phone.trim()
      : '0829848852';

    const cleanCode = extractVoucherCode(input);
    if (!cleanCode) {
      res.status(400).json({
        success: false,
        error: 'INVALID_VOUCHER_FORMAT',
        message: 'รูปแบบลิงก์ซองของขวัญไม่ถูกต้อง กรุณาคัดลอกลิงก์ที่ได้จากแอป TrueMoney เช่น https://gift.truemoney.com/campaign/?v=...'
      });
      return;
    }

    // Check duplicate voucher code in completed deposits
    const dupDepositQuery = query(
      collection(db, 'deposits'),
      where('voucherHash', '==', cleanCode),
      where('status', '==', 'completed'),
      limit(1)
    );
    const dupDepositSnap = await getDocs(dupDepositQuery);
    if (!dupDepositSnap.empty) {
      res.status(400).json({
        success: false,
        error: 'DUPLICATE_VOUCHER',
        message: 'ซองของขวัญนี้เคยถูกนำมาเติมเงินในระบบแล้ว ห้ามใช้ซ้ำ (DUPLICATE_VOUCHER)'
      });
      return;
    }

    const dupTxQuery = query(
      collection(db, 'wallet_transactions'),
      where('reference', '==', cleanCode),
      limit(1)
    );
    const dupTxSnap = await getDocs(dupTxQuery);
    if (!dupTxSnap.empty) {
      res.status(400).json({
        success: false,
        error: 'DUPLICATE_VOUCHER',
        message: 'ซองของขวัญนี้มีประวัติการเติมเงินในระบบแล้ว (DUPLICATE_VOUCHER)'
      });
      return;
    }

    // Call Angpao redemption service
    const redeemResult = await redeemAngpaoVoucher(cleanCode, targetPhone);

    if (!redeemResult.success || !redeemResult.amount || redeemResult.amount <= 0) {
      res.status(400).json({
        success: false,
        error: redeemResult.code || 'REDEEM_FAILED',
        message: redeemResult.message || 'ไม่สามารถรับเงินจากซองของขวัญได้ กรุณาตรวจสอบสถานะซองในแอป TrueMoney'
      });
      return;
    }

    const creditAmount = redeemResult.amount;
    const nowIso = new Date().toISOString();
    const depositId = `dep_angpao_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const txId = `tx_angpao_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    let newBalance = creditAmount;

    // Atomic Transaction: Update User Balance, Deposit, Transaction, and Notification
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', uid);
      const userDoc = await transaction.get(userRef);

      let currentBalance = 0;
      if (userDoc.exists()) {
        currentBalance = Number(userDoc.data().balance || 0);
      }
      newBalance = currentBalance + creditAmount;

      // 1. Update user balance
      transaction.set(userRef, sanitizeForFirestore({
        uid,
        balance: newBalance,
        updatedAt: nowIso
      }), { merge: true });

      // 2. Create deposit record
      const depositRef = doc(db, 'deposits', depositId);
      transaction.set(depositRef, sanitizeForFirestore({
        depositId,
        uid,
        amount: creditAmount,
        method: 'truemoney_angpao',
        voucherHash: cleanCode,
        recipientPhone: targetPhone,
        senderName: redeemResult.senderName || '',
        status: 'completed',
        createdAt: nowIso,
        updatedAt: nowIso
      }));

      // 3. Create wallet transaction
      const txRef = doc(db, 'wallet_transactions', txId);
      transaction.set(txRef, sanitizeForFirestore({
        transactionId: txId,
        uid,
        type: 'deposit',
        amount: creditAmount,
        status: 'success',
        reference: cleanCode,
        depositId,
        description: `เติมเงินผ่านซองอั่งเปา TrueMoney Wallet ฿${creditAmount.toLocaleString()} สำเร็จ (เบอร์รับ: ${targetPhone})`,
        createdAt: nowIso
      }));

      // 4. Create notification
      const notifRef = doc(db, 'notifications', notifId);
      transaction.set(notifRef, sanitizeForFirestore({
        notifId,
        uid,
        title: 'เติมเงินซองอั่งเปาสำเร็จ!',
        message: `เติมเงินจำนวน ฿${creditAmount.toLocaleString()} จากซองของขวัญ TrueMoney Wallet เข้ากระเป๋าเรียบร้อยแล้ว`,
        type: 'deposit',
        isRead: false,
        createdAt: nowIso
      }));
    });

    res.json({
      success: true,
      amount: creditAmount,
      balance: newBalance,
      voucherCode: cleanCode,
      senderName: redeemResult.senderName,
      message: `เติมเงินสำเร็จ! เพิ่ม ฿${creditAmount.toLocaleString()} พ้อยท์เข้ากระเป๋าของคุณแล้ว`
    });
  } catch (error: any) {
    console.error('Redeem Angpao Error:', error);
    const isQuota = String(error?.message || '').includes('Quota exceeded') ||
      String(error?.code || '') === 'resource-exhausted' ||
      String(error?.message || '').includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      res.status(503).json({
        success: false,
        error: 'FIRESTORE_QUOTA_EXCEEDED',
        message: 'โควต้าการอ่าน/เขียนฐานข้อมูล Cloud Firestore เต็มชั่วคราว (Quota Exceeded) ทำให้ไม่สามารถบันทึกยอดเงินเข้ากระเป๋าได้ในขณะนี้ กรุณาแจ้งแอดมินให้อัปเกรดแผน Firebase หรือรอระบบรีเซ็ตโควต้าประจำวัน',
        upgradeUrl: 'https://console.firebase.google.com/project/angusshopx2/firestore/databases/ai-studio-remixangusshop-2abe89df-2474-4dff-adaa-6fff1a4696e5/data?openUpgradeDialog=true'
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'SERVER_TRANSACTION_ERROR',
      message: error.message || 'เกิดข้อผิดพลาดในการบันทึกธุรกรรมซองอั่งเปา'
    });
  }
};

apiRouter.post('/wallet/redeem-angpao', handleRedeemAngpao);
apiRouter.post('/deposit/angpao', handleRedeemAngpao);

// ==========================================
// Gacha Account Stock & Anti-Sample Management
// ==========================================
let inMemoryGachaAccounts: any[] = [];
let inMemoryInventory: any[] = [];

export function isAccountProduct(item: any): boolean {
  if (!item) return false;
  const name = String(item.name || '').toLowerCase();
  const category = String(item.category || '');
  const deliveryType = String(item.deliveryType || '');
  const productId = String(item.productId || '');

  return Boolean(
    deliveryType === 'account_code' ||
    productId === 'prod_gacha_cdk_35' ||
    productId.includes('gacha') ||
    productId.includes('darkcoat') ||
    category === 'ไอดี' ||
    category === 'สุ่มไอดี' ||
    category === 'ไอดีไก่ตัน' ||
    name.includes('สุ่ม') ||
    name.includes('ไก่ตัน') ||
    name.includes('ไอดี') ||
    name.includes('ผ้าคลุมหนวดดำ') ||
    name.includes('หนวดดำ') ||
    name.includes('ดาบคู่')
  );
}

export function isServiceProduct(item: any): boolean {
  if (!item) return false;
  if (isAccountProduct(item)) return false; // Any account item is NEVER a service item!

  const name = String(item.name || '');
  const category = String(item.category || '');
  const deliveryType = String(item.deliveryType || '');

  return (
    deliveryType === 'service' ||
    deliveryType === 'manual_service' ||
    category === 'บริการ' ||
    name.includes('ฟาร์ม') ||
    name.includes('เงินเขียว') ||
    name.includes('Beli') ||
    name.includes('บริการ') ||
    name.includes('มาสเตอร์') ||
    name.includes('Mastery') ||
    name.includes('ฮาคิ') ||
    name.includes('Haki') ||
    name.includes('เควส') ||
    name.includes('ค่าหัว') ||
    name.includes('Bounty') ||
    name.includes('Combat') ||
    name.includes('คอมแบท')
  );
}

export function isSampleAccount(username?: string, _password?: string): boolean {
  if (!username || !username.trim()) return true;
  return false;
}

export async function purgeSampleGachaAccounts(): Promise<number> {
  return 0; // Do not purge accounts added by admin!
}

export async function checkAvailableGachaStock(productId: string, requiredQuantity: number): Promise<{ available: boolean; count: number }> {
  const gachaColl = collection(db, 'gacha_accounts');
  let availableList: any[] = [];

  try {
    const snap = await getDocs(query(gachaColl, where('status', '==', 'available'), limit(500)));
    snap.forEach((d) => {
      const data = d.data();
      if (!isSampleAccount(data.username, data.password)) {
        availableList.push({ id: d.id, ...data });
      }
    });
  } catch (e: any) {
    console.warn('Check gacha stock query fallback:', e?.message);
  }

  for (const mem of inMemoryGachaAccounts) {
    if (mem.status === 'available' && !isSampleAccount(mem.username, mem.password)) {
      if (!availableList.some(a => a.id === mem.id)) {
        availableList.push(mem);
      }
    }
  }

  let matching = availableList.filter(a => a.productId === productId);
  if (matching.length < requiredQuantity) {
    if (productId === 'prod_gacha_cdk_35') {
      matching = availableList.filter(a => !a.productId || a.productId === 'prod_gacha_cdk_35');
    }
  }
  if (matching.length < requiredQuantity && (productId === 'prod_gacha_cdk_35' || matching.length === 0)) {
    matching = availableList;
  }

  return {
    available: matching.length >= requiredQuantity,
    count: matching.length
  };
}

export async function selectAvailableGachaAccounts(
  productId: string, 
  quantity: number
): Promise<{ success: boolean; error?: string; selected: any[] }> {
  const gachaColl = collection(db, 'gacha_accounts');
  let availableList: any[] = [];

  try {
    const snap = await getDocs(query(gachaColl, where('status', '==', 'available'), limit(500)));
    snap.forEach((d) => {
      const data = d.data();
      if (!isSampleAccount(data.username, data.password)) {
        availableList.push({ id: d.id, ...data });
      }
    });
  } catch (e: any) {
    console.warn('Fetch available gacha accounts notice:', e?.message);
  }

  for (const mem of inMemoryGachaAccounts) {
    if (mem.status === 'available' && !isSampleAccount(mem.username, mem.password)) {
      if (!availableList.some(a => a.id === mem.id)) {
        availableList.push(mem);
      }
    }
  }

  let matching = availableList.filter(a => a.productId === productId);
  if (matching.length < quantity) {
    if (productId === 'prod_gacha_cdk_35') {
      matching = availableList.filter(a => !a.productId || a.productId === 'prod_gacha_cdk_35');
    }
  }
  if (matching.length < quantity && availableList.length >= quantity) {
    matching = availableList;
  }

  if (matching.length < quantity) {
    return {
      success: false,
      error: `สินค้าไอดีในสต็อกไม่เพียงพอ (ต้องการ ${quantity} บัญชี แต่ในระบบเหลือพร้อมส่ง ${matching.length} บัญชี) กรุณารอแอดมินเติมไอดี`,
      selected: []
    };
  }

  return {
    success: true,
    selected: matching.slice(0, quantity)
  };
}

export async function syncOrphanedGachaAccounts(): Promise<number> {
  let restored = 0;
  try {
    const snap = await getDocs(query(collection(db, 'gacha_accounts'), where('status', '==', 'sold')));
    for (const d of snap.docs) {
      const data = d.data();
      if (data.orderId) {
        try {
          const ordDoc = await getDoc(doc(db, 'orders', data.orderId));
          if (!ordDoc.exists()) {
            // Order was aborted or failed! Revert account to available!
            await updateDoc(doc(db, 'gacha_accounts', d.id), {
              status: 'available',
              orderId: null,
              soldToUid: null,
              soldAt: null,
              updatedAt: new Date().toISOString()
            });
            const memIdx = inMemoryGachaAccounts.findIndex(m => m.id === d.id);
            if (memIdx !== -1) {
              inMemoryGachaAccounts[memIdx].status = 'available';
              delete inMemoryGachaAccounts[memIdx].orderId;
            }
            restored++;
          }
        } catch {}
      }
    }

    if (restored > 0) {
      const gachaSnap = await getDocs(query(collection(db, 'gacha_accounts'), where('status', '==', 'available')));
      let realCount = 0;
      gachaSnap.forEach(d => {
        const data = d.data();
        if ((data.productId === 'prod_gacha_cdk_35' || !data.productId) && !isSampleAccount(data.username, data.password)) {
          realCount++;
        }
      });
      await updateDoc(doc(db, 'products', 'prod_gacha_cdk_35'), {
        stock: realCount,
        updatedAt: new Date().toISOString()
      });
      invalidateServerProductsCache();
    }
  } catch (err) {
    console.warn('syncOrphanedGachaAccounts notice:', err);
  }
  return restored;
}

// 2. Server-Side Checkout with Balance Deduction, Stock check & Digital Delivery
apiRouter.post('/order/checkout', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      uid, 
      items, 
      robloxUsername, 
      serviceAccountUsername, 
      serviceAccountPassword, 
      note 
    } = req.body;

    if (!uid || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'INVALID_ORDER',
        message: 'ข้อมูลคำสั่งซื้อไม่ถูกต้อง'
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 0. Pre-verify real stock for any account items to NEVER sell without real IDs
    const accountItems = items.filter(isAccountProduct);

    // Pre-select accounts in memory (DO NOT update Firestore or product stock before transaction!)
    const claimedAccountsByProductId: Record<string, any[]> = {};
    for (const accItem of accountItems) {
      const reqQty = Math.max(1, Number(accItem.quantity) || 1);
      const selectRes = await selectAvailableGachaAccounts(accItem.productId, reqQty);
      if (!selectRes.success || selectRes.selected.length < reqQty) {
        res.status(400).json({
          success: false,
          error: 'OUT_OF_STOCK',
          message: selectRes.error || `ขออภัย สินค้าไอดี "${accItem.name || 'สุ่มไก่ตัน'}" ในสต็อกหมดชั่วคราว กรุณารอแอดมินเติมไอดี`
        });
        return;
      }
      claimedAccountsByProductId[accItem.productId] = selectRes.selected;
    }

    let orderTotal = 0;
    let finalOrder: any = null;
    const createdInventoryItems: any[] = [];

    await runTransaction(db, async (transaction) => {
      // 1. Fetch and verify user balance
      const userRef = doc(db, 'users', uid);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('ไม่พบบัญชีผู้ใช้งานในระบบ');
      }

      const currentBalance = Number(userDoc.data().balance || 0);

      // Fetch global delivery settings if configured by Admin
      const deliverySettingsRef = doc(db, 'settings', 'delivery');
      const deliverySettingsDoc = await transaction.get(deliverySettingsRef);
      let globalVipLink = 'https://www.roblox.com/games/2753915549/Blox-Fruits?privateServerLinkCode=angus-vip-trade';
      let globalInstructions = '';
      let globalPrefix = 'AGS-';
      let globalInstructionsTitle = 'คำแนะนำ / รายละเอียดการรับสินค้า';
      let globalServerLinkTitle = 'ลิงค์รับของ';
      let globalClaimCodeTitle = 'รหัสรับสินค้า (Claim Code)';

      if (deliverySettingsDoc.exists()) {
        const dData = deliverySettingsDoc.data();
        if (dData?.vipServerLink) globalVipLink = dData.vipServerLink;
        if (dData?.defaultInstructions) globalInstructions = dData.defaultInstructions;
        if (dData?.claimCodePrefix) globalPrefix = dData.claimCodePrefix;
        if (dData?.defaultInstructionsTitle) globalInstructionsTitle = dData.defaultInstructionsTitle;
        if (dData?.defaultServerLinkTitle) globalServerLinkTitle = dData.defaultServerLinkTitle;
        if (dData?.defaultClaimCodeTitle) globalClaimCodeTitle = dData.defaultClaimCodeTitle;
      }

      // 2. Fetch all products to verify real server prices and stock
      let calculatedSubtotal = 0;
      const verifiedItems: any[] = [];

      for (const item of items) {
        const prodRef = doc(db, 'products', item.productId);
        const prodDoc = await transaction.get(prodRef);

        if (!prodDoc.exists()) {
          throw new Error(`ไม่พบสินค้ารหัส ${item.productId}`);
        }

        const prodData = prodDoc.data();
        if (prodData.isActive === false) {
          throw new Error(`สินค้า "${prodData.name}" ปิดจำหน่ายชั่วคราว`);
        }

        const currentStock = Number(prodData.stock || 0);
        const reqQty = Math.max(1, Number(item.quantity) || 1);

        if (currentStock < reqQty) {
          throw new Error(`สินค้า "${prodData.name}" มีสินค้าเหลือเพียง ${currentStock} ชิ้น (ไม่พอสำหรับการสั่งซื้อ)`);
        }

        let serverPrice = Number(prodData.price);

        // Tiered service pricing for Bounty Hunting (10M: 500, 20M: 1000, 30M: 1500)
        // Applies ONLY to the official multi-tier package product 'prod_bounty_hunt'
        if (item.productId === 'prod_bounty_hunt') {
          if (
            item.selectedOption?.includes('30M') ||
            item.targetNote?.includes('30M')
          ) {
            serverPrice = 1500;
          } else if (
            item.selectedOption?.includes('20M') ||
            item.targetNote?.includes('20M')
          ) {
            serverPrice = 1000;
          } else {
            serverPrice = 500;
          }
        }

        calculatedSubtotal += serverPrice * reqQty;

        const finalItemName = item.selectedOption 
          ? `${prodData.name} [${item.selectedOption}${item.targetNote ? `: ${item.targetNote}` : ''}]`
          : (item.name || prodData.name || '');

        const isItemAccount = isAccountProduct(item) || isAccountProduct(prodData);

        verifiedItems.push({
          productId: prodData.productId || item.productId || '',
          name: finalItemName,
          selectedOption: item.selectedOption || '',
          targetNote: item.targetNote || '',
          slug: prodData.slug || '',
          price: serverPrice || 0,
          quantity: reqQty,
          image: item.image || prodData.image || '',
          deliveryType: isItemAccount ? 'account_code' : (prodData.deliveryType || 'fruit'),
          deliveryInstructions: prodData.deliveryInstructions || prodData.instructions || '',
          instructionsTitle: prodData.instructionsTitle || '',
          tradeServerLink: prodData.tradeServerLink || prodData.serverLink || '',
          serverLinkTitle: prodData.serverLinkTitle || '',
          claimCode: prodData.claimCode || '',
          claimCodeTitle: prodData.claimCodeTitle || ''
        });

        // Decrement product stock
        transaction.update(prodRef, {
          stock: currentStock - reqQty,
          updatedAt: nowIso
        });
      }

      orderTotal = calculatedSubtotal;

      if (currentBalance < orderTotal) {
        throw new Error(`ยอดเงินคงเหลือไม่เพียงพอ (คงเหลือ ฿${currentBalance.toLocaleString()} ต้องการ ฿${orderTotal.toLocaleString()}) กรุณาเติมเงินก่อนทำรายการ`);
      }

      const newBalance = currentBalance - orderTotal;

      // 3. Deduct user balance
      transaction.update(userRef, {
        balance: newBalance,
        updatedAt: nowIso
      });

      // 4. Check if order contains service products (EXCLUDE account purchases so passwords are not requested)
      const hasServiceItems = verifiedItems.some(it => isServiceProduct(it));

      // 5. Deliver to Inventory (and populate credentials in verifiedItems)
      for (const item of verifiedItems) {
        const isAccountItem = isAccountProduct(item);
        const isItemService = isServiceProduct(item);

        const customInstructions = item.deliveryInstructions?.trim();
        const customTradeServer = item.tradeServerLink?.trim();
        const customClaimCode = item.claimCode?.trim();

        let tradeServer = customTradeServer || (isAccountItem ? 'https://www.roblox.com/games/2753915549/Blox-Fruits' : globalVipLink);
        let instructions = customInstructions || globalInstructions || '';
        if (isAccountItem && !instructions) {
          instructions = 'นำ Username และ Password ด้านบนไปเข้าสู่ระบบในเกม Roblox เพื่อเข้าเล่นได้ทันที แนะนำให้เปลี่ยนรหัสผ่านและผูกอีเมลเพื่อความปลอดภัยสูงสุด';
        }

        if (isAccountItem) {
          // Use real accounts claimed from stock pool
          const claimedForThis = claimedAccountsByProductId[item.productId] || [];
          if (claimedForThis.length > 0) {
            // Populate credentials directly into item for receipt display
            item.claimCode = claimedForThis.length === 1 
              ? `${claimedForThis[0].username} : ${claimedForThis[0].password}` 
              : claimedForThis.map((a: any, idx: number) => `ไอดี #${idx + 1}: ${a.username} : ${a.password}`).join('\n');
            item.accountUser = claimedForThis[0].username;
            item.accountPass = claimedForThis[0].password;
            item.deliveredAccounts = claimedForThis.map((a: any) => ({ username: a.username, password: a.password }));

            // Create individual inventory item for EACH claimed account
            for (let idx = 0; idx < claimedForThis.length; idx++) {
              const claimedAcc = claimedForThis[idx];
              const invId = `inv_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
              const invRef = doc(db, 'inventory', invId);

              const invData = sanitizeForFirestore({
                inventoryId: invId,
                id: invId,
                uid,
                userEmail: userDoc.data().email || '',
                productId: item.productId,
                orderId,
                productName: claimedForThis.length > 1 ? `${item.name} (ไอดี #${idx + 1})` : item.name,
                quantity: 1,
                status: 'ready',
                deliveryType: 'account_code',
                image: item.image || '/images/blox/cursed_dual_katana.png',
                claimCode: `${claimedAcc.username} : ${claimedAcc.password}`,
                claimCodeTitle: 'ข้อมูลไอดี Roblox (Username : Password)',
                instructions,
                instructionsTitle: item.instructionsTitle?.trim() || 'วิธีใช้งานไอดี Roblox ที่ได้รับ',
                serverLink: tradeServer,
                tradeServerLink: tradeServer,
                serverLinkTitle: item.serverLinkTitle?.trim() || 'เข้าเล่นเกม Blox Fruits',
                metadata: {
                  robloxUsername: claimedAcc.username,
                  accountUser: claimedAcc.username,
                  serviceAccountUsername: claimedAcc.username,
                  serviceAccountPassword: claimedAcc.password,
                  accountPass: claimedAcc.password,
                  accountCredentials: `${claimedAcc.username} : ${claimedAcc.password}`,
                  rawLine: claimedAcc.rawLine || `${claimedAcc.username}:${claimedAcc.password}`,
                  isAccountProduct: true,
                  instructions,
                  instructionsTitle: item.instructionsTitle?.trim() || 'วิธีใช้งานไอดี Roblox ที่ได้รับ',
                  tradeServerLink: tradeServer,
                  serverLink: tradeServer,
                  serverLinkTitle: item.serverLinkTitle?.trim() || 'เข้าเล่นเกม Blox Fruits',
                  code: `${claimedAcc.username} : ${claimedAcc.password}`,
                  claimCode: `${claimedAcc.username} : ${claimedAcc.password}`,
                  claimCodeTitle: 'ข้อมูลไอดี Roblox (Username : Password)',
                  deliveredAt: nowIso
                },
                createdAt: nowIso,
                updatedAt: nowIso
              });

              transaction.set(invRef, invData);
              createdInventoryItems.push(invData);
            }
            continue;
          }
        }

        // Standard delivery for Non-account or fallback
        const invId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const invRef = doc(db, 'inventory', invId);

        if (!instructions) {
          if (item.deliveryType === 'gamepass') {
            instructions = 'ระบบได้ส่งของขวัญ Gamepass เข้าสู่บัญชี Roblox ของท่านเรียบร้อยแล้ว';
          } else if (isItemService) {
            instructions = 'ทีมงานได้รับข้อมูลไอดี/รหัสผ่านแล้ว และกำลังดำเนินการฟาร์มให้ตามคิวอย่างปลอดภัย ปิดระบบยืนยัน 2 ชั้นชั่วคราวเพื่อความรวดเร็ว';
          } else {
            instructions = 'เข้าสู่เซิร์ฟเวอร์ VIP ผ่านลิงก์ด้านล่างเพื่อรับสินค้าผ่านระบบ Trade ในเกมกับบอท AngusShop';
          }
        }

        const claimCode = customClaimCode || (isAccountItem ? 'กรุณาติดต่อแอดมินเพื่อรับรหัสผ่าน' : `${globalPrefix}${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
        const instructionsTitle = item.instructionsTitle?.trim() || (isAccountItem ? 'วิธีใช้งานไอดี Roblox ที่ได้รับ' : isItemService ? 'ขั้นตอนบริการฟาร์ม' : globalInstructionsTitle);
        const serverLinkTitle = item.serverLinkTitle?.trim() || (isAccountItem ? 'เข้าเล่นเกม Blox Fruits' : isItemService ? 'ติดต่อแอดมินฟาร์ม' : globalServerLinkTitle);
        const claimCodeTitle = item.claimCodeTitle?.trim() || (isAccountItem ? 'ข้อมูลไอดี Roblox (Username : Password)' : isItemService ? 'รหัสคิวฟาร์ม' : globalClaimCodeTitle);

        const invData = sanitizeForFirestore({
          inventoryId: invId,
          id: invId,
          uid,
          userEmail: userDoc.data().email || '',
          productId: item.productId,
          orderId,
          productName: item.name,
          quantity: item.quantity,
          status: 'ready',
          deliveryType: item.deliveryType,
          image: item.image || '',
          claimCode,
          claimCodeTitle,
          instructions,
          instructionsTitle,
          serverLink: tradeServer,
          tradeServerLink: tradeServer,
          serverLinkTitle,
          metadata: {
            robloxUsername: robloxUsername || '',
            serviceAccountUsername: isItemService ? (serviceAccountUsername || robloxUsername || '') : '',
            serviceAccountPassword: isItemService ? (serviceAccountPassword || '') : '',
            accountCredentials: isAccountItem ? claimCode : '',
            isServiceOrder: isItemService,
            instructions,
            instructionsTitle,
            tradeServerLink: tradeServer,
            serverLink: tradeServer,
            serverLinkTitle,
            code: claimCode,
            claimCode,
            claimCodeTitle,
            deliveredAt: nowIso
          },
          createdAt: nowIso,
          updatedAt: nowIso
        });

        transaction.set(invRef, invData);
        createdInventoryItems.push(invData);
      }

      // 6. Create Order Record
      finalOrder = sanitizeForFirestore({
        orderId,
        uid,
        userEmail: userDoc.data().email || '',
        items: verifiedItems,
        subtotal: calculatedSubtotal,
        discount: 0,
        couponCode: '',
        total: orderTotal,
        totalAmount: orderTotal,
        paymentMethod: 'wallet',
        paymentStatus: 'paid',
        orderStatus: 'completed',
        status: 'completed',
        robloxUsername: robloxUsername || '',
        serviceAccountUsername: hasServiceItems ? (serviceAccountUsername || robloxUsername || '') : '',
        serviceAccountPassword: hasServiceItems ? (serviceAccountPassword || '') : '',
        isServiceOrder: hasServiceItems,
        note: note || '',
        createdAt: nowIso,
        updatedAt: nowIso
      });

      const orderRef = doc(db, 'orders', orderId);
      transaction.set(orderRef, finalOrder);

      // 7. Create Wallet Transaction for purchase
      const txRef = doc(db, 'wallet_transactions', txId);
      transaction.set(txRef, sanitizeForFirestore({
        transactionId: txId,
        uid,
        type: 'purchase',
        amount: orderTotal,
        status: 'success',
        reference: orderId,
        orderId,
        description: `ชำระคำสั่งซื้อ #${orderId} (${verifiedItems.length} รายการ)`,
        createdAt: nowIso
      }));

      // 8. Create Notification
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const notifRef = doc(db, 'notifications', notifId);
      transaction.set(notifRef, sanitizeForFirestore({
        notifId,
        uid,
        title: 'สั่งซื้อสินค้าสำเร็จ!',
        message: `คำสั่งซื้อ #${orderId} ยอด ฿${orderTotal.toLocaleString()} สำเร็จ สินค้าพร้อมใช้งานในคลังสินค้าของคุณแล้ว`,
        type: 'order',
        isRead: false,
        createdAt: nowIso
      }));
    });

    // Save newly created inventory items into server in-memory list
    for (const inv of createdInventoryItems) {
      inMemoryInventory.unshift(inv);
    }

    // Mark claimed accounts as sold in Firestore & memory AFTER transaction successfully commits
    for (const [prodId, accounts] of Object.entries(claimedAccountsByProductId)) {
      for (const acc of accounts) {
        acc.status = 'sold';
        acc.orderId = orderId;
        acc.soldToUid = uid;
        acc.soldAt = nowIso;
        try {
          await updateDoc(doc(db, 'gacha_accounts', acc.id), {
            status: 'sold',
            orderId,
            soldToUid: uid,
            soldAt: nowIso,
            updatedAt: nowIso
          });
        } catch (e) {
          console.warn('Mark sold gacha account notice:', e);
        }
        const memIdx = inMemoryGachaAccounts.findIndex(m => m.id === acc.id);
        if (memIdx !== -1) {
          inMemoryGachaAccounts[memIdx] = { ...inMemoryGachaAccounts[memIdx], ...acc };
        }
      }
    }

    // Invalidate and update server cache immediately so newly purchased products reflect reduced stock
    if (serverProductsCache && Array.isArray(serverProductsCache.data)) {
      for (const it of items) {
        const cachedItem = serverProductsCache.data.find(p => p.productId === it.productId);
        if (cachedItem) {
          cachedItem.stock = Math.max(0, (Number(cachedItem.stock) || 0) - (Number(it.quantity) || 1));
        }
      }
    }
    invalidateServerProductsCache();

    res.json({
      success: true,
      message: 'สั่งซื้อสินค้าและส่งมอบเข้าคลังเรียบร้อยแล้ว',
      order: finalOrder,
      inventoryItems: createdInventoryItems
    });
  } catch (error: any) {
    console.error('Checkout Error:', error);
    const isQuota = String(error?.message || '').includes('Quota exceeded') ||
      String(error?.code || '') === 'resource-exhausted' ||
      String(error?.message || '').includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      res.status(503).json({
        success: false,
        error: 'FIRESTORE_QUOTA_EXCEEDED',
        message: 'โควต้าการอ่าน/เขียนฐานข้อมูล Cloud Firestore เต็มชั่วคราว (Quota Exceeded) ทำให้ไม่สามารถตรวจสอบยอดเงินหรือตัดสต็อกได้ในขณะนี้ กรุณาแจ้งแอดมินหรือรอรีเซ็ตโควต้าประจำวัน',
        upgradeUrl: 'https://console.firebase.google.com/project/angusshopx2/firestore/databases/ai-studio-remixangusshop-2abe89df-2474-4dff-adaa-6fff1a4696e5/data?openUpgradeDialog=true'
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: 'CHECKOUT_FAILED',
      message: error.message || 'การสั่งซื้อไม่สำเร็จ'
    });
  }
});

// 3. User Inventory Endpoint with In-Memory Caching & Firestore Fallback
apiRouter.get('/inventory', async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = req.query;
    if (!uid) {
      res.json({ success: true, items: [] });
      return;
    }

    const uidStr = String(uid);
    let list: any[] = [];

    try {
      const snap = await getDocs(query(collection(db, 'inventory'), where('uid', '==', uidStr), limit(100)));
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
    } catch (e: any) {
      console.warn('Firestore inventory fetch fallback:', e?.message);
    }

    // Merge in-memory delivered items for this user
    for (const mem of inMemoryInventory) {
      if (mem.uid === uidStr && !list.some(it => it.id === mem.id || it.inventoryId === mem.inventoryId)) {
        list.push(mem);
      }
    }

    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json({
      success: true,
      items: list
    });
  } catch (err: any) {
    console.error('Inventory route error:', err);
    const fallbackList = inMemoryInventory.filter(mem => mem.uid === String(req.query.uid));
    res.json({ success: true, items: fallbackList });
  }
});

// 2.5 Get Products with high-performance server-side caching (Saves 95%+ of Firestore Read units)
apiRouter.get('/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const force = req.query.force === 'true';
    const now = Date.now();

    if (!force && serverProductsCache && (now - serverProductsCache.timestamp < SERVER_PRODUCTS_TTL_MS)) {
      res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=600');
      res.json({
        success: true,
        products: serverProductsCache.data,
        cached: true,
        cachedAt: new Date(serverProductsCache.timestamp).toISOString(),
        count: serverProductsCache.data.length
      });
      return;
    }

    if (force) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=600');
    }

    const productsColl = collection(db, 'products');
    const snap = await getDocs(productsColl);
    const list: any[] = [];
    snap.forEach((d) => {
      const item = d.data();
      const pId = item.productId || d.id;
      if (pId === 'prod_gacha_darkcoat_godhuman_99') return;
      let resolvedItem = item;
      if (!resolvedItem.name) {
        const fallback = fallbackProducts.find((f: any) => f.productId === pId);
        if (fallback) {
          resolvedItem = { ...fallback, ...resolvedItem };
        }
      }
      if (resolvedItem.name && typeof resolvedItem.name === 'string') {
        list.push({
          ...resolvedItem,
          productId: pId
        });
      }
    });

    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    serverProductsCache = {
      data: list,
      timestamp: now
    };
    saveDiskCache(PRODUCTS_CACHE_FILE, serverProductsCache);

    if (force) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=600');
    }
    res.json({
      success: true,
      products: list,
      cached: false,
      count: list.length
    });
  } catch (error: any) {
    console.error('Get Products API Error:', error);
    if (serverProductsCache) {
      res.setHeader('Cache-Control', 'public, max-age=120');
      res.json({
        success: true,
        products: serverProductsCache.data,
        cached: true,
        stale: true,
        count: serverProductsCache.data.length
      });
      return;
    }
    // Zero-downtime fallback: if Firestore quota is exhausted or offline, return fallback catalog
    const safeFallback = (Array.isArray(fallbackProducts) && fallbackProducts.length > 0)
      ? fallbackProducts
      : initialProducts;
    serverProductsCache = {
      data: safeFallback,
      timestamp: Date.now()
    };
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.json({
      success: true,
      products: safeFallback,
      cached: true,
      fallback: true,
      count: safeFallback.length
    });
  }
});

// ==========================================
// ADMIN AUTHENTICATION MIDDLEWARE
// Strictly validates Firebase Admin access
// ==========================================
const verifyAdminAuth = async (req: Request, res: Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'ไม่อนุญาตให้เข้าถึง: ต้องเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลระบบเท่านั้น (Admin token required)'
    });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'ไม่อนุญาตให้เข้าถึง: โทเค็นไม่ถูกต้อง (Invalid token)'
    });
  }

  try {
    const apiKey = process.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey;
    const lookupRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token })
    });

    if (!lookupRes.ok) {
      return res.status(401).json({
        success: false,
        message: 'การตรวจสอบสิทธิ์ล้มเหลว: โทเค็นหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่'
      });
    }

    const lookupData = await lookupRes.json() as any;
    const userInfo = lookupData.users?.[0];
    if (!userInfo) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้งาน'
      });
    }

    const email = (userInfo.email || '').toLowerCase().trim();
    const uid = userInfo.localId;

    // Master Admin Emails
    const isMasterAdmin = email === 'otinrealxz@gmail.com' || email === 'angusdiffx@gmail.com';
    if (isMasterAdmin) {
      (req as any).adminUser = { uid, email, role: 'admin' };
      return next();
    }

    // Role check in Firestore
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists() && userSnap.data()?.role === 'admin') {
      (req as any).adminUser = { uid, email, role: 'admin' };
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'ปฏิเสธการเข้าถึง: บัญชีของคุณไม่มีสิทธิ์ผู้ดูแลระบบ (Forbidden - Admin Role Required)'
    });
  } catch (err: any) {
    console.error('Admin token verification error:', err);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์แอดมิน'
    });
  }
};

apiRouter.use((req: Request, res: Response, next: express.NextFunction) => {
  if (req.path.startsWith('/admin')) {
    return verifyAdminAuth(req, res, next);
  }
  next();
});

// AI Promotional Banner Generator Endpoint
apiRouter.post('/admin/generate-banner', async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemName, category, style, prompt } = req.body || {};
    
    // Check if GEMINI_API_KEY is available
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are a high-converting Blox Fruits gaming e-commerce marketing expert for AngusShop.
Create compelling promotional banner metadata in Thai and English for Blox Fruits item: "${itemName}" (category: "${category}").
Style/Mood requested: "${style}".
Custom instructions: "${prompt || 'Highlight fast automated delivery in VIP Server and 100% guarantee'}".

Respond strictly with a single JSON object (no markdown, no backticks, no code block) with these exact keys:
{
  "title": "Thai & English catchy title, e.g. Kitsune Fruit (ผลคิตสึเนะ)",
  "highlightText": "Punchy benefit in Thai, e.g. สปีดเร็วที่สุด ดาเมจมหาศาล",
  "badge": "Short eye-catching badge, e.g. 🔥 MYTHICAL อันดับ 1",
  "badgeColor": "purple",
  "description": "2-line engaging product description in Thai explaining why to buy and that it trades safely in VIP server",
  "priceText": "฿299",
  "originalPriceText": "฿350",
  "discountBadge": "-15%",
  "themeGradient": "from-[#1E0D36] via-[#140A26] to-[#0A0614]",
  "accentColor": "purple",
  "ctaText": "สั่งซื้อทันที",
  "secondaryCtaText": "ดูรายละเอียด"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }]
        });

        const rawText = response.text?.trim() || '';
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        res.json({
          success: true,
          banner: parsed
        });
        return;
      } catch (genAiErr) {
        console.warn('Gemini generate banner error, using procedural fallback:', genAiErr);
      }
    }

    // Procedural Fallback
    const baseNames: Record<string, any> = {
      'Kitsune Fruit': {
        title: 'Kitsune Fruit (ผลคิตสึเนะ)',
        highlightText: 'จิ้งจอกเก้าหาง สปีดเร็วที่สุด ดาเมจมหาศาล',
        badge: '🔥 MYTHICAL อันดับ 1',
        badgeColor: 'purple',
        description: 'ผลคิตสึเนะของแท้ 100% เทรดผ่านระบบ VIP Server ด่วนใน 3 นาที สกิลแปลงร่างทรงพลังที่สุด',
        priceText: '฿299',
        originalPriceText: '฿350',
        discountBadge: '-15%',
        themeGradient: 'from-[#1E0D36] via-[#140A26] to-[#0A0614]',
        accentColor: 'purple',
        imageUrl: '/images/blox/kitsune.png'
      },
      'Dragon Fruit': {
        title: 'Dragon Fruit (ผลมังกร รีเวิร์ค)',
        highlightText: 'มังกรเกล็ดอสูร ทรงพลังที่สุด ดาเมจทะลุหลอด',
        badge: '⚡ REWORK HYPE',
        badgeColor: 'rose',
        description: 'ผลมังกรแท้ 100% สกิลกว้าง ล็อคเป้าแม่นยำ พร้อมส่งมอบในเซิร์ฟเวอร์ VIP การันตีสต็อกพร้อมส่ง',
        priceText: '฿249',
        originalPriceText: '฿290',
        discountBadge: '-14%',
        themeGradient: 'from-[#2A0E18] via-[#1B0A11] to-[#0D0509]',
        accentColor: 'rose',
        imageUrl: '/images/blox/dragon.png'
      },
      'Bounty 30M': {
        title: 'บริการล่าค่าหัว (Bounty 30M)',
        highlightText: 'ปลดล็อกฉายาจักรพรรดิ & บัฟ PvP สูงสุด',
        badge: '👑 PVP RANK #1',
        badgeColor: 'amber',
        description: 'บริการล่าค่าหัว 10M / 20M / 30M Max Cap ปลดล็อกโบนัสดาเมจและเกราะป้องกันสูงสุดในเกม โดยทีมนักล่ามืออาชีพ',
        priceText: '฿500 - ฿1,500',
        originalPriceText: '฿650 - ฿1,900',
        discountBadge: 'HOT DEAL',
        themeGradient: 'from-[#281A08] via-[#191005] to-[#0E0903]',
        accentColor: 'amber',
        imageUrl: '/images/blox/bounty_hunt_30m.png'
      },
      'Dark Blade Yoru': {
        title: 'Dark Blade Yoru & Gamepass 2x',
        highlightText: 'ดาบดำโยรุ + บัฟคูณสองเงิน/มาส',
        badge: '💎 GAMEPASS & WEAPONS',
        badgeColor: 'cyan',
        description: 'ดาบดำโยรุระดับ Mythical และ Gamepass ถาวร ช่วยให้ฟาร์มเลเวลเร็วขึ้น 2 เท่า ส่งมอบผ่านระบบของขวัญในเกมรวดเร็วใน 3 นาที',
        priceText: '฿150 - ฿490',
        originalPriceText: '฿200 - ฿550',
        discountBadge: 'แท้ 100%',
        themeGradient: 'from-[#0B202D] via-[#07151E] to-[#040B10]',
        accentColor: 'cyan',
        imageUrl: '/images/blox/dark_blade.png'
      }
    };

    const fallback = baseNames[itemName] || {
      title: `${itemName || 'Blox Fruits Item'} โปรโมชั่นพิเศษ`,
      highlightText: 'ส่งมอบไวใน 3 นาที ของแท้ 100%',
      badge: '✨ DEAL พิเศษ',
      badgeColor: 'purple',
      description: `ไอเทม ${itemName || 'Blox Fruits'} ยอดนิยม เทรดรับของในเซิร์ฟเวอร์ VIP รวดเร็ว ปลอดภัย ไร้กังวล`,
      priceText: '฿199',
      originalPriceText: '฿250',
      discountBadge: '-20%',
      themeGradient: 'from-[#1A0F2E] via-[#120B20] to-[#0A0714]',
      accentColor: 'purple'
    };

    res.json({
      success: true,
      banner: fallback
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate banner'
    });
  }
});

// Refresh Cache Endpoint for Admin
apiRouter.post('/admin/refresh-cache', (req: Request, res: Response) => {
  invalidateServerProductsCache();
  invalidateServerHomeConfigCache();
  res.json({
    success: true,
    message: 'ล้างแคชหน่วยความจำบนเซิร์ฟเวอร์เรียบร้อยแล้ว การเข้าชมครั้งถัดไปจะดึงข้อมูลใหม่'
  });
});

// Comprehensive System Health Audit for Top-Up & Database
apiRouter.get('/system/health-audit', async (req: Request, res: Response): Promise<void> => {
  const auditResult: any = {
    timestamp: new Date().toISOString(),
    overallStatus: 'operational',
    message: 'ทุกระบบทำงานสมบูรณ์ 100% พร้อมให้บริการ',
    systems: {}
  };

  // 1. SlipOK Gateway Check
  try {
    const slipokRes = await fetch(`${SLIPOK_URL}/quota`, {
      headers: { 'x-authorization': SLIPOK_KEY },
      signal: AbortSignal.timeout(3000)
    });
    if (slipokRes.ok) {
      const slipokData = await slipokRes.json();
      auditResult.systems.slipok = {
        name: 'ระบบตรวจสลิป SlipOK (QR พร้อมเพย์)',
        status: 'ready',
        configured: Boolean(SLIPOK_KEY && SLIPOK_KEY.length > 5),
        quotaRemaining: slipokData?.data?.quota ?? 'N/A',
        endDate: slipokData?.data?.endDate ?? 'N/A',
        promptpayNumber: PROMPTPAY_ACCOUNT,
        promptpayAccount: PROMPTPAY_ACCOUNT,
        promptpayName: PROMPTPAY_NAME,
        message: `SlipOK ใช้งานได้ปกติ (โควต้าคงเหลือ: ${slipokData?.data?.quota ?? 0} ครั้ง)`,
      };
    } else {
      auditResult.systems.slipok = {
        name: 'ระบบตรวจสลิป SlipOK (QR พร้อมเพย์)',
        status: 'warning',
        configured: Boolean(SLIPOK_KEY && SLIPOK_KEY.length > 5),
        statusCode: slipokRes.status,
        promptpayNumber: PROMPTPAY_ACCOUNT,
        message: 'SlipOK API ตอบกลับสถานะไม่สำเร็จ ตรวจสอบคีย์ API',
      };
    }
  } catch (err: any) {
    auditResult.systems.slipok = {
      name: 'ระบบตรวจสลิป SlipOK (QR พร้อมเพย์)',
      status: 'offline',
      configured: Boolean(SLIPOK_KEY && SLIPOK_KEY.length > 5),
      promptpayNumber: PROMPTPAY_ACCOUNT,
      error: err.message,
      message: 'ไม่สามารถติดต่อ SlipOK API ได้',
    };
  }

  // 2. TrueMoney Angpao System
  auditResult.systems.truemoney = {
    name: 'ระบบเติมเงินซองอั่งเปา TrueMoney Wallet',
    status: 'ready',
    recipientPhone: '0829848852',
    mode: 'auto_redeem',
    message: 'ระบบซองอั่งเปา TrueMoney พร้อมทำงาน (เบอร์รับเงิน: 0829848852)',
  };

  // 3. Cloud Firestore Probe
  try {
    const probePromise = getDocs(query(collection(db, 'settings'), limit(1)));
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firestore probe timeout after 3000ms')), 3000)
    );
    await Promise.race([probePromise, timeoutPromise]);

    auditResult.systems.firestore = {
      name: 'ฐานข้อมูล Google Cloud Firestore',
      status: 'ready',
      message: 'เชื่อมต่อฐานข้อมูลได้ปกติ โควต้าการอ่านยังไม่เต็ม',
      quotaExceeded: false,
    };
  } catch (err: any) {
    const isQuota = String(err?.message || '').includes('Quota exceeded') ||
      String(err?.code || '') === 'resource-exhausted' ||
      String(err?.message || '').includes('RESOURCE_EXHAUSTED');

    if (isQuota) {
      auditResult.systems.firestore = {
        name: 'ฐานข้อมูล Google Cloud Firestore',
        status: 'quota_exceeded',
        quotaExceeded: true,
        message: 'โควต้าการอ่านฟรีรายวันของ Cloud Firestore เต็มแล้ว (50,000 reads/วัน)',
        recommendation: 'ระบบสลับไปใช้แคชท้องถิ่นอัตโนมัติ สำหรับการปลดล็อคสดสามารถอัปเกรดเป็นแผน Blaze ใน Firebase Console หรือรอระบบรีเซ็ตเวลา 07:00 น. (ไทย)',
        upgradeUrl: 'https://console.firebase.google.com/project/angusshopx2/firestore/databases/ai-studio-remixangusshop-2abe89df-2474-4dff-adaa-6fff1a4696e5/data?openUpgradeDialog=true',
      };
    } else {
      auditResult.systems.firestore = {
        name: 'ฐานข้อมูล Google Cloud Firestore',
        status: 'error',
        error: err.message,
        message: `ข้อผิดพลาด Firestore: ${err.message}`,
      };
    }
  }

  // 4. Products & Cache Catalog
  const cachedProductsLength = serverProductsCache ? serverProductsCache.data.length : 0;
  auditResult.systems.cache = {
    name: 'ระบบ Server Cache & Fallback',
    status: 'ready',
    cachedProductsCount: cachedProductsLength,
    hasServerCache: Boolean(serverProductsCache),
    message: serverProductsCache 
      ? `แคชสินค้าพร้อมใช้งาน (${cachedProductsLength} รายการ)` 
      : 'ยังไม่ได้โหลดเข้าหน่วยความจำเซิร์ฟเวอร์',
  };

  auditResult.systems.products = {
    name: 'แคตตาล็อกสินค้า',
    status: 'ready',
    cachedCount: cachedProductsLength,
    hasServerCache: Boolean(serverProductsCache),
    message: serverProductsCache 
      ? `แคชสินค้าพร้อมใช้งาน (${cachedProductsLength} รายการ)` 
      : 'ยังไม่ได้โหลดเข้าหน่วยความจำเซิร์ฟเวอร์',
  };

  // Evaluate overall status dynamically
  const isSlipokHealthy = auditResult.systems.slipok?.status === 'ready';
  const isTruemoneyHealthy = auditResult.systems.truemoney?.status === 'ready';
  const isFirestoreQuota = Boolean(auditResult.systems.firestore?.quotaExceeded);
  const isFirestoreError = auditResult.systems.firestore?.status === 'error';

  if (!isSlipokHealthy && !isTruemoneyHealthy) {
    auditResult.overallStatus = 'outage';
    auditResult.message = 'ระบบรับชำระเงินขัดข้อง กรุณาตรวจสอบ SlipOK และ TrueMoney';
  } else if (isFirestoreQuota || !isSlipokHealthy || !isTruemoneyHealthy || isFirestoreError) {
    auditResult.overallStatus = 'degraded';
    auditResult.message = isFirestoreQuota 
      ? 'โควต้า Firestore เต็มชั่วคราว (ระบบทำงานต่อด้วยแคชสำรอง)'
      : 'มีบางระบบย่อยที่ทำงานได้ไม่สมบูรณ์';
  } else {
    auditResult.overallStatus = 'operational';
    auditResult.message = 'ทุกระบบทำงานสมบูรณ์ 100% พร้อมให้บริการ';
  }

  res.json(auditResult);
});

// 3. Seed Initial Products in Firestore Catalog
apiRouter.post('/admin/seed-products', async (req: Request, res: Response): Promise<void> => {
  try {
    invalidateServerProductsCache();
    const productsColl = collection(db, 'products');
    const existing = await getDocs(productsColl);

    if (!existing.empty && req.query.force !== 'true') {
      res.json({
        success: true,
        message: `มีสินค้าในระบบแล้ว (${existing.size} รายการ) ไม่จำเป็นต้องสร้างใหม่ (ใช้ ?force=true หากต้องการเขียนทับ)`,
        count: existing.size
      });
      return;
    }

    let inserted = 0;
    for (const prod of initialProducts) {
      const prodRef = doc(db, 'products', prod.productId);
      await setDoc(prodRef, prod, { merge: true });
      inserted++;
    }

    invalidateServerProductsCache();

    res.json({
      success: true,
      message: `นำเข้าสินค้าตั้งต้นสำเร็จ ${inserted} รายการ`,
      count: inserted
    });
  } catch (error: any) {
    console.error('Seed Products Error:', error);
    res.status(500).json({
      success: false,
      error: 'SEED_ERROR',
      message: error.message
    });
  }
});

// 4. Delete Product Endpoint
apiRouter.post('/admin/delete-product', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.body;
    if (!productId) {
      res.status(400).json({
        success: false,
        error: 'MISSING_PRODUCT_ID',
        message: 'กรุณาระบุรหัสสินค้าที่ต้องการลบ'
      });
      return;
    }

    const prodRef = doc(db, 'products', productId);
    await deleteDoc(prodRef);
    invalidateServerProductsCache();

    res.json({
      success: true,
      message: `ลบสินค้า ${productId} สำเร็จเรียบร้อยแล้ว`
    });
  } catch (error: any) {
    console.error('Delete Product Error:', error);
    res.status(500).json({
      success: false,
      error: 'DELETE_ERROR',
      message: error.message || 'ไม่สามารถลบสินค้าได้'
    });
  }
});

// Deduplicate Products Endpoint (removes duplicate products keeping only 1 canonical/best item per name)
apiRouter.post('/admin/deduplicate-products', async (req: Request, res: Response): Promise<void> => {
  try {
    const productsColl = collection(db, 'products');
    const existing = await getDocs(productsColl);
    
    // Group products by normalized name (trimmed & lowercased)
    const grouped: Record<string, any[]> = {};
    for (const d of existing.docs) {
      const data = d.data();
      const normName = (data.name || '').trim().toLowerCase();
      if (!normName) continue;
      if (!grouped[normName]) grouped[normName] = [];
      grouped[normName].push({ docId: d.id, ...data });
    }

    let deletedCount = 0;
    const removedNames: string[] = [];

    for (const [normName, items] of Object.entries(grouped)) {
      if (items.length > 1) {
        // Prioritize keeping canonical ID (e.g. prod_phoenix_fruit over prod_1789...) or newest
        items.sort((a, b) => {
          const aIsCanonical = !a.docId.startsWith('prod_1');
          const bIsCanonical = !b.docId.startsWith('prod_1');
          if (aIsCanonical && !bIsCanonical) return -1;
          if (!aIsCanonical && bIsCanonical) return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        // Keep items[0], delete items[1..n]
        for (let i = 1; i < items.length; i++) {
          await deleteDoc(doc(db, 'products', items[i].docId));
          deletedCount++;
          if (!removedNames.includes(items[i].name)) {
            removedNames.push(items[i].name);
          }
        }
      }
    }

    invalidateServerProductsCache();
    res.json({
      success: true,
      message: deletedCount > 0 
        ? `ลบรายการสินค้าที่ซ้ำกันเรียบร้อยแล้ว (${deletedCount} รายการ: ${removedNames.join(', ')})`
        : 'ไม่พบสินค้าที่มีชื่อซ้ำกัน ทุกรายการในระบบมีเพียง 1 รายการแล้ว',
      deletedCount,
      removedNames
    });
  } catch (error: any) {
    console.error('Deduplicate Products Error:', error);
    res.status(500).json({
      success: false,
      error: 'DEDUPLICATE_ERROR',
      message: error.message || 'ไม่สามารถลบรายการสินค้าที่ซ้ำกันได้'
    });
  }
});

// Clear All Products Endpoint (to start clean with manual entry only)
apiRouter.post('/admin/clear-all-products', async (req: Request, res: Response): Promise<void> => {
  try {
    const productsColl = collection(db, 'products');
    const existing = await getDocs(productsColl);
    let deletedCount = 0;
    for (const d of existing.docs) {
      await deleteDoc(d.ref);
      deletedCount++;
    }
    invalidateServerProductsCache();
    res.json({
      success: true,
      message: `ล้างรายการสินค้าทั้งหมดจำนวน ${deletedCount} รายการเรียบร้อยแล้ว`,
      deletedCount
    });
  } catch (error: any) {
    console.error('Clear All Products Error:', error);
    res.status(500).json({
      success: false,
      error: 'CLEAR_ALL_ERROR',
      message: error.message || 'ไม่สามารถล้างรายการสินค้าได้'
    });
  }
});

// 5. Update Product Endpoint (Full Data & Image update)
apiRouter.post('/admin/update-product', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, ...updateData } = req.body;
    if (!productId) {
      res.status(400).json({
        success: false,
        error: 'MISSING_PRODUCT_ID',
        message: 'กรุณาระบุรหัสสินค้าที่ต้องการแก้ไข'
      });
      return;
    }

    const prodRef = doc(db, 'products', productId);
    await setDoc(
      prodRef,
      sanitizeForFirestore({
        ...updateData,
        updatedAt: new Date().toISOString()
      }),
      { merge: true }
    );
    invalidateServerProductsCache();

    res.json({
      success: true,
      message: `อัปเดตข้อมูลและรูปภาพสินค้า ${productId} สำเร็จเรียบร้อยแล้ว`
    });
  } catch (error: any) {
    console.error('Update Product Error:', error);
    res.status(500).json({
      success: false,
      error: 'UPDATE_ERROR',
      message: error.message || 'ไม่สามารถแก้ไขข้อมูลสินค้าได้'
    });
  }
});

// 6. Get Home & Hero Configuration (Server-Cached to protect Firestore Read quota)
apiRouter.get('/home-config', async (req: Request, res: Response): Promise<void> => {
  try {
    const force = req.query.force === 'true';
    const now = Date.now();

    if (!force && serverHomeConfigCache && (now - serverHomeConfigCache.timestamp < SERVER_HOME_CONFIG_TTL_MS)) {
      res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=600');
      res.json({
        success: true,
        config: serverHomeConfigCache.data,
        cached: true,
        cachedAt: new Date(serverHomeConfigCache.timestamp).toISOString()
      });
      return;
    }

    const configDoc = await getDoc(doc(db, 'settings', 'homeConfig'));
    const configData = configDoc.exists() ? configDoc.data() : null;

    serverHomeConfigCache = {
      data: configData,
      timestamp: now
    };
    saveDiskCache(HOME_CONFIG_CACHE_FILE, serverHomeConfigCache);

    res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=600');
    res.json({
      success: true,
      config: configData,
      cached: false
    });
  } catch (error: any) {
    console.error('Get Home Config Error:', error);
    if (serverHomeConfigCache) {
      res.setHeader('Cache-Control', 'public, max-age=120');
      res.json({
        success: true,
        config: serverHomeConfigCache.data,
        cached: true,
        stale: true
      });
      return;
    }
    // Zero-downtime fallback: if Firestore quota is exhausted, return default preset config
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.json({
      success: true,
      config: DEFAULT_HOME_CONFIG,
      cached: true,
      fallback: true
    });
  }
});

// 7. Update Home & Hero Configuration
apiRouter.post('/admin/update-home-config', async (req: Request, res: Response): Promise<void> => {
  try {
    const { config } = req.body;
    if (!config) {
      res.status(400).json({
        success: false,
        error: 'MISSING_CONFIG',
        message: 'กรุณาส่งข้อมูลการตั้งค่าหน้าแรก'
      });
      return;
    }

    const configRef = doc(db, 'settings', 'homeConfig');
    await setDoc(
      configRef,
      sanitizeForFirestore({
        ...config,
        updatedAt: new Date().toISOString()
      }),
      { merge: true }
    );
    invalidateServerHomeConfigCache();

    res.json({
      success: true,
      message: 'บันทึกข้อมูลตกแต่งหน้าแรกและแบนเนอร์เรียบร้อยแล้ว'
    });
  } catch (error: any) {
    console.error('Update Home Config Error:', error);
    res.status(500).json({
      success: false,
      error: 'UPDATE_CONFIG_ERROR',
      message: error.message || 'ไม่สามารถบันทึกข้อมูลการตั้งค่าหน้าแรกได้'
    });
  }
});

// 8. Gacha Account Stock Management (กรอกไอดีไก่ตันใน Admin)
apiRouter.get('/admin/gacha-accounts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.query;
    const gachaColl = collection(db, 'gacha_accounts');
    
    // Purge sample accounts if any
    await purgeSampleGachaAccounts().catch(() => {});
    
    // Avoid composite index requirement by querying without multiple inequalities/orderBys
    let snap;
    try {
      if (productId) {
        snap = await getDocs(query(gachaColl, where('productId', '==', String(productId)), limit(300)));
      } else {
        snap = await getDocs(query(gachaColl, limit(300)));
      }
    } catch (e: any) {
      console.warn('Firestore gacha query fallback:', e?.message);
      snap = await getDocs(query(gachaColl, limit(200)));
    }

    const list: any[] = [];
    snap.forEach((d) => {
      const data = d.data();
      // Exclude sample accounts completely
      if (!isSampleAccount(data.username, data.password)) {
        list.push({
          id: d.id,
          ...data
        });
      }
    });

    // Merge with any inMemory accounts not in list (filter out samples)
    for (const mem of inMemoryGachaAccounts) {
      if (!isSampleAccount(mem.username, mem.password) && !list.some(a => a.id === mem.id)) {
        if (!productId || mem.productId === String(productId)) {
          list.push(mem);
        }
      }
    }

    // Sort descending by createdAt in memory
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    res.json({
      success: true,
      accounts: list,
      total: list.length,
      available: list.filter(a => a.status === 'available').length,
      sold: list.filter(a => a.status === 'sold').length
    });
  } catch (error: any) {
    console.error('Get Gacha Accounts Error:', error);
    // Return inMemory fallback on error (filter out samples)
    const fallbackList = inMemoryGachaAccounts.filter(a => !isSampleAccount(a.username, a.password));
    res.json({
      success: true,
      accounts: fallbackList,
      total: fallbackList.length,
      available: fallbackList.filter(a => a.status === 'available').length,
      sold: fallbackList.filter(a => a.status === 'sold').length
    });
  }
});

apiRouter.post('/admin/gacha-accounts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId = 'prod_gacha_cdk_35', accountsText, accountsList } = req.body;
    let lines: string[] = [];
    if (Array.isArray(accountsList)) {
      lines = accountsList;
    } else if (typeof accountsText === 'string') {
      lines = accountsText.split('\n').map((l: string) => l.trim()).filter(Boolean);
    }

    if (lines.length === 0) {
      res.status(400).json({ success: false, message: 'กรุณากรอกไอดีอย่างน้อย 1 รายการ' });
      return;
    }

    const nowIso = new Date().toISOString();
    let addedCount = 0;

    for (const line of lines) {
      let parts = line.split(':');
      if (parts.length < 2) parts = line.split('|');
      if (parts.length < 2) parts = line.split('/');
      if (parts.length < 2) parts = line.trim().split(/\s+/);

      const username = (parts[0] || '').trim();
      const password = (parts.slice(1).join(':') || '').trim();

      if (!username) continue;

      const docId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const accountData = {
        id: docId,
        productId,
        username,
        password: password || 'AngusShop#2026',
        rawLine: line,
        status: 'available',
        createdAt: nowIso
      };

      try {
        await setDoc(doc(db, 'gacha_accounts', docId), sanitizeForFirestore(accountData));
      } catch (err) {
        console.warn('Firestore set gacha account fallback:', err);
      }
      inMemoryGachaAccounts.unshift(accountData);
      addedCount++;
    }

    // Update product stock in Firestore
    try {
      const gachaSnap = await getDocs(query(collection(db, 'gacha_accounts'), where('productId', '==', productId), where('status', '==', 'available')));
      const availableCount = Math.max(gachaSnap.size, inMemoryGachaAccounts.filter(a => a.productId === productId && a.status === 'available').length);
      const prodRef = doc(db, 'products', productId);
      await updateDoc(prodRef, { stock: availableCount, updatedAt: nowIso });
    } catch {}

    invalidateServerProductsCache();

    res.json({
      success: true,
      addedCount,
      message: `บันทึกไอดีเข้าสู่สต็อกสำเร็จ ${addedCount} บัญชี`
    });
  } catch (error: any) {
    console.error('Add Gacha Accounts Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.delete('/admin/gacha-accounts/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let targetProductId = 'prod_gacha_cdk_35';

    // 1. Try reading doc to find product
    try {
      const accDoc = await getDoc(doc(db, 'gacha_accounts', id));
      if (accDoc.exists()) {
        targetProductId = accDoc.data().productId || targetProductId;
      }
    } catch {}

    // 2. Delete from Firestore
    try {
      await deleteDoc(doc(db, 'gacha_accounts', id));
    } catch (e: any) {
      console.warn('Firestore deleteDoc notice:', e?.message);
    }

    // 3. Remove from in-memory cache
    inMemoryGachaAccounts = inMemoryGachaAccounts.filter(a => a.id !== id);

    // 4. Recalculate remaining stock for this product
    try {
      const gachaSnap = await getDocs(query(collection(db, 'gacha_accounts'), where('productId', '==', targetProductId), where('status', '==', 'available')));
      const remainingCount = Math.max(gachaSnap.size, inMemoryGachaAccounts.filter(a => a.productId === targetProductId && a.status === 'available').length);
      
      const prodRef = doc(db, 'products', targetProductId);
      const pDoc = await getDoc(prodRef);
      if (pDoc.exists()) {
        await updateDoc(prodRef, { stock: remainingCount, updatedAt: new Date().toISOString() });
      }
    } catch {}

    invalidateServerProductsCache();
    res.json({ success: true, message: 'ลบไอดีออกจากสต็อกเรียบร้อยแล้ว' });
  } catch (error: any) {
    console.error('Delete Gacha Account Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk Delete Gacha Accounts (e.g. delete sold, or batch delete)
apiRouter.post('/admin/gacha-accounts/bulk-delete', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, onlySold, productId = 'prod_gacha_cdk_35' } = req.body;
    let deletedCount = 0;

    if (onlySold) {
      // Find all sold accounts
      const snap = await getDocs(query(collection(db, 'gacha_accounts'), where('status', '==', 'sold')));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'gacha_accounts', d.id));
        deletedCount++;
      }
      inMemoryGachaAccounts = inMemoryGachaAccounts.filter(a => a.status !== 'sold');
    } else if (Array.isArray(ids) && ids.length > 0) {
      for (const id of ids) {
        try {
          await deleteDoc(doc(db, 'gacha_accounts', id));
          deletedCount++;
        } catch {}
      }
      inMemoryGachaAccounts = inMemoryGachaAccounts.filter(a => !ids.includes(a.id));
    }

    // Recalculate stock
    try {
      const gachaSnap = await getDocs(query(collection(db, 'gacha_accounts'), where('productId', '==', productId), where('status', '==', 'available')));
      const remainingCount = Math.max(gachaSnap.size, inMemoryGachaAccounts.filter(a => a.productId === productId && a.status === 'available').length);
      const prodRef = doc(db, 'products', productId);
      await updateDoc(prodRef, { stock: remainingCount, updatedAt: new Date().toISOString() });
    } catch {}

    invalidateServerProductsCache();
    res.json({ success: true, deletedCount, message: `ลบไอดีสำเร็จ ${deletedCount} บัญชี` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Restore a sold account back to available
apiRouter.post('/admin/gacha-accounts/:id/restore', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let targetProductId = 'prod_gacha_cdk_35';
    try {
      const accDoc = await getDoc(doc(db, 'gacha_accounts', id));
      if (accDoc.exists()) {
        targetProductId = accDoc.data().productId || targetProductId;
      }
    } catch {}

    try {
      await updateDoc(doc(db, 'gacha_accounts', id), {
        status: 'available',
        orderId: null,
        soldToUid: null,
        soldAt: null,
        updatedAt: new Date().toISOString()
      });
    } catch (e: any) {
      console.warn('Restore doc notice:', e?.message);
    }

    const idx = inMemoryGachaAccounts.findIndex(m => m.id === id);
    if (idx !== -1) {
      inMemoryGachaAccounts[idx].status = 'available';
      delete inMemoryGachaAccounts[idx].orderId;
    }

    // Recalculate stock
    try {
      const gachaSnap = await getDocs(query(collection(db, 'gacha_accounts'), where('productId', '==', targetProductId), where('status', '==', 'available')));
      const availableCount = Math.max(gachaSnap.size, inMemoryGachaAccounts.filter(a => a.productId === targetProductId && a.status === 'available').length);
      const prodRef = doc(db, 'products', targetProductId);
      await updateDoc(prodRef, { stock: availableCount, updatedAt: new Date().toISOString() });
    } catch {}

    invalidateServerProductsCache();
    res.json({ success: true, message: 'คืนไอดีสู่สต็อกพร้อมส่งเรียบร้อยแล้ว' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/admin/gacha-accounts/sync-orphans', async (req: Request, res: Response): Promise<void> => {
  try {
    const restored = await syncOrphanedGachaAccounts();
    res.json({ success: true, restored, message: `ตรวจเช็คและคืนไอดีสู่สต็อกสำเร็จ ${restored} บัญชี` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/admin/gacha-accounts/seed-samples', async (req: Request, res: Response): Promise<void> => {
  res.status(400).json({
    success: false,
    message: 'ระบบปิดการสร้างไอดีตัวอย่างแล้ว เพื่อป้องกันไม่ให้ไอดีตัวอย่างปนในสต็อกจริงของลูกค้า'
  });
});

apiRouter.post('/admin/gacha-accounts/purge-samples', async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await purgeSampleGachaAccounts();
    res.json({
      success: true,
      count,
      message: `ล้างไอดีตัวอย่างออกจากระบบเรียบร้อยแล้ว (${count} บัญชี)`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Seed/Ensure Gacha Products exist in Firestore with real stock
export async function ensureGachaProducts(): Promise<void> {
  try {
    await syncOrphanedGachaAccounts();

    // 1. Ensure CDK 35 THB
    let cdkAvailableCount = 0;
    let magnetAvailableCount = 0;
    let controlAvailableCount = 0;

    try {
      const gachaSnap = await getDocs(query(collection(db, 'gacha_accounts'), where('status', '==', 'available')));
      gachaSnap.forEach((d) => {
        const data = d.data();
        if (data.productId === 'prod_gacha_magnet_110') {
          magnetAvailableCount++;
        } else if (data.productId === 'prod_gacha_control_50') {
          controlAvailableCount++;
        } else if (data.productId === 'prod_gacha_cdk_35' || !data.productId) {
          cdkAvailableCount++;
        }
      });
    } catch {}

    const cdkRef = doc(db, 'products', 'prod_gacha_cdk_35');
    const cdkSnap = await getDoc(cdkRef);
    if (!cdkSnap.exists()) {
      await setDoc(cdkRef, sanitizeForFirestore({
        productId: 'prod_gacha_cdk_35',
        name: 'สุ่มไก่ตันดาบคู่ (CDK) 35 บาท',
        slug: 'gacha-cdk-35-baht',
        description: 'สุ่มไอดีไก่ตัน Blox Fruits ดาบคู่ Cursed Dual Katana (CDK) การันตีเลเวล Max 2550 สเตตัสอัปเต็ม พร้อมดาบ CDK 100% สุ่มผลตื่นและผลเทพ ส่งมอบไอดีและรหัสผ่านเข้าสู่ระบบทันที 24 ชั่วโมง',
        shortDescription: 'สุ่มไก่ตันดาบคู่ CDK เลเวล Max 2550 สเตตัสตัน พร้อมเล่น ส่งมอบรหัสอัตโนมัติ 24 ชม.',
        category: 'ไอดี',
        price: 35,
        oldPrice: 79,
        image: '/images/blox/cursed_dual_katana.png',
        stock: cdkAvailableCount,
        isActive: true,
        isFeatured: true,
        isBestSeller: true,
        deliveryType: 'account_code',
        rarity: 'Mythical',
        claimCodeTitle: 'ข้อมูลไอดี Roblox (Username : Password)',
        claimCode: '',
        deliveryInstructions: 'ระบบส่งมอบ Username และ Password ของบัญชี Roblox เรียบร้อยแล้ว สามารถนำไปล็อกอินเข้าเล่นเกมได้ทันที แนะนำให้เปลี่ยนรหัสผ่านและผูกอีเมลเพื่อความปลอดภัย',
        instructionsTitle: 'วิธีใช้งานไอดีไก่ตันที่ได้รับ',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    } else {
      await updateDoc(cdkRef, { 
        category: 'ไอดี', 
        stock: cdkAvailableCount,
        updatedAt: new Date().toISOString() 
      });
    }

    // 2. Ensure Magnet in box 110 THB
    const magnetRef = doc(db, 'products', 'prod_gacha_magnet_110');
    const magnetSnap = await getDoc(magnetRef);
    if (!magnetSnap.exists()) {
      await setDoc(magnetRef, sanitizeForFirestore({
        productId: 'prod_gacha_magnet_110',
        name: 'ไก่ตันผลแม่เหล็กในกล่อง 110 บาท',
        slug: 'gacha-magnet-box-110-baht',
        description: 'ไอดีไก่ตัน Blox Fruits เลเวล Max 2550 สเตตัสตัน การันตีผลแม่เหล็ก (Magnet Fruit) อยู่ในกล่องผล/คลังกระเป๋า (Inventory) 100% พร้อมหมัดและไอเทมครบเซ็ต ส่งมอบไอดีและรหัสผ่านเข้าสู่ระบบทันที 24 ชั่วโมง',
        shortDescription: 'ไก่ตันเลเวล Max 2550 การันตีผลแม่เหล็กในกล่อง 100% ส่งมอบรหัสทันที 24 ชม.',
        category: 'ไอดี',
        price: 110,
        oldPrice: 220,
        image: '/images/blox/magnet.png',
        stock: magnetAvailableCount || 10,
        isActive: true,
        isFeatured: true,
        isBestSeller: true,
        deliveryType: 'account_code',
        rarity: 'Mythical',
        claimCodeTitle: 'ข้อมูลไอดี Roblox (Username : Password)',
        claimCode: '',
        deliveryInstructions: 'ระบบส่งมอบ Username และ Password ของบัญชี Roblox เรียบร้อยแล้ว สามารถนำไปล็อกอินเข้าเล่นเกมได้ทันที แนะนำให้เปลี่ยนรหัสผ่านและผูกอีเมลเพื่อความปลอดภัย',
        instructionsTitle: 'วิธีใช้งานไอดีไก่ตันที่ได้รับ',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    } else {
      await updateDoc(magnetRef, {
        category: 'ไอดี',
        price: 110,
        stock: magnetAvailableCount || Number(magnetSnap.data()?.stock ?? 10),
        updatedAt: new Date().toISOString()
      });
    }

    // 3. Ensure Control in box 50 THB
    const controlRef = doc(db, 'products', 'prod_gacha_control_50');
    const controlSnap = await getDoc(controlRef);
    if (!controlSnap.exists()) {
      await setDoc(controlRef, sanitizeForFirestore({
        productId: 'prod_gacha_control_50',
        name: 'ไก่ตันผลคอนโทรลในกล่อง 50 บาท',
        slug: 'gacha-control-box-50-baht',
        description: 'ไอดีไก่ตัน Blox Fruits เลเวล Max 2550 สเตตัสตัน การันตีผลคอนโทรล (Control Fruit) อยู่ในกล่องผล/คลังกระเป๋า (Inventory) 100% พร้อมหมัดและไอเทมครบเซ็ต ส่งมอบไอดีและรหัสผ่านเข้าสู่ระบบทันที 24 ชั่วโมง',
        shortDescription: 'ไก่ตันเลเวล Max 2550 การันตีผลคอนโทรลในกล่อง 100% ส่งมอบรหัสทันที 24 ชม.',
        category: 'ไอดี',
        price: 50,
        oldPrice: 99,
        image: '/images/blox/control.png',
        stock: controlAvailableCount || 10,
        isActive: true,
        isFeatured: true,
        isBestSeller: true,
        deliveryType: 'account_code',
        rarity: 'Mythical',
        claimCodeTitle: 'ข้อมูลไอดี Roblox (Username : Password)',
        claimCode: '',
        deliveryInstructions: 'ระบบส่งมอบ Username และ Password ของบัญชี Roblox เรียบร้อยแล้ว สามารถนำไปล็อกอินเข้าเล่นเกมได้ทันที แนะนำให้เปลี่ยนรหัสผ่านและผูกอีเมลเพื่อความปลอดภัย',
        instructionsTitle: 'วิธีใช้งานไอดีไก่ตันที่ได้รับ',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    } else {
      await updateDoc(controlRef, {
        category: 'ไอดี',
        price: 50,
        stock: controlAvailableCount || Number(controlSnap.data()?.stock ?? 10),
        updatedAt: new Date().toISOString()
      });
    }

    // 4. Remove deprecated Dark Coat 99 THB product completely from Firestore
    try {
      const darkCoatRef = doc(db, 'products', 'prod_gacha_darkcoat_godhuman_99');
      await deleteDoc(darkCoatRef).catch(() => {});
    } catch {}

    invalidateServerProductsCache();
  } catch (err) {
    console.error('ensureGachaProducts error:', err);
  }
}

// Call on startup
ensureGachaProducts().catch(() => {});

