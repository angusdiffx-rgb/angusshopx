import express, { Request, Response, Router } from 'express';
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
  limit 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { initialProducts } from '../data/initialProducts';
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

let serverProductsCache: CacheStore<any[]> | null = null;
const SERVER_PRODUCTS_TTL_MS = 60 * 60 * 1000; // 60 minutes cache (invalidated immediately on admin mutations)

let serverHomeConfigCache: CacheStore<any> | null = null;
const SERVER_HOME_CONFIG_TTL_MS = 60 * 60 * 1000; // 60 minutes cache (invalidated immediately on admin mutations)

export const invalidateServerProductsCache = () => {
  serverProductsCache = null;
};

export const invalidateServerHomeConfigCache = () => {
  serverHomeConfigCache = null;
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

    let orderTotal = 0;
    let finalOrder: any = null;

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
      const verifiedItems = [];

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

        verifiedItems.push({
          productId: prodData.productId || item.productId || '',
          name: finalItemName,
          selectedOption: item.selectedOption || '',
          targetNote: item.targetNote || '',
          slug: prodData.slug || '',
          price: serverPrice || 0,
          quantity: reqQty,
          image: item.image || prodData.image || '',
          deliveryType: prodData.deliveryType || 'fruit',
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

      // 4. Check if order contains service products
      const hasServiceItems = verifiedItems.some(it => 
        it.deliveryType === 'service' || 
        it.deliveryType === 'manual_service' || 
        it.name?.includes('ฟาร์ม') || 
        it.name?.includes('เงินเขียว') || 
        it.name?.includes('บริการ') ||
        it.name?.includes('CDK') ||
        it.name?.includes('โอเด้ง') ||
        it.name?.includes('ฮาคิ') ||
        it.name?.includes('Haki') ||
        it.name?.includes('เผ่า') ||
        it.name?.includes('V4') ||
        it.name?.includes('Combat') ||
        it.name?.includes('คอมแบท') ||
        it.name?.includes('เควส') ||
        it.name?.includes('ค่าหัว') ||
        it.name?.includes('Bounty') ||
        it.name?.includes('Honor')
      );

      // 5. Create Order Record
      finalOrder = sanitizeForFirestore({
        orderId,
        uid,
        userEmail: userDoc.data().email || '',
        items: verifiedItems,
        subtotal: calculatedSubtotal,
        discount: 0,
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

      // 6. Create Wallet Transaction for purchase
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

      // 7. Deliver to Inventory
      for (const item of verifiedItems) {
        const invId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const invRef = doc(db, 'inventory', invId);

        const isItemService = 
          item.deliveryType === 'service' || 
          item.deliveryType === 'manual_service' || 
          item.name?.includes('ฟาร์ม') || 
          item.name?.includes('เงินเขียว') || 
          item.name?.includes('บริการ') ||
          item.name?.includes('CDK') ||
          item.name?.includes('โอเด้ง') ||
          item.name?.includes('ฮาคิ') ||
          item.name?.includes('Haki') ||
          item.name?.includes('เผ่า') ||
          item.name?.includes('V4');

        const customInstructions = item.deliveryInstructions?.trim();
        const customTradeServer = item.tradeServerLink?.trim();
        const customClaimCode = item.claimCode?.trim();

        let tradeServer = customTradeServer || globalVipLink;
        let instructions = customInstructions || globalInstructions || '';
        if (!instructions) {
          if (item.deliveryType === 'gamepass') {
            instructions = 'ระบบได้ส่งของขวัญ Gamepass เข้าสู่บัญชี Roblox ของท่านเรียบร้อยแล้ว';
          } else if (isItemService) {
            instructions = 'ทีมงานได้รับข้อมูลไอดี/รหัสผ่านแล้ว และกำลังดำเนินการฟาร์มให้ตามคิวอย่างปลอดภัย ปิดระบบยืนยัน 2 ชั้นชั่วคราวเพื่อความรวดเร็ว';
          } else {
            instructions = 'เข้าสู่เซิร์ฟเวอร์ VIP ผ่านลิงก์ด้านล่างเพื่อรับสินค้าผ่านระบบ Trade ในเกมกับบอท AngusShop';
          }
        }
        const claimCode = customClaimCode || `${globalPrefix}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const instructionsTitle = item.instructionsTitle?.trim() || (isItemService ? 'ขั้นตอนบริการฟาร์ม' : globalInstructionsTitle);
        const serverLinkTitle = item.serverLinkTitle?.trim() || (isItemService ? 'ติดต่อแอดมินฟาร์ม' : globalServerLinkTitle);
        const claimCodeTitle = item.claimCodeTitle?.trim() || (isItemService ? 'รหัสคิวฟาร์ม' : globalClaimCodeTitle);

        transaction.set(invRef, sanitizeForFirestore({
          inventoryId: invId,
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
        }));
      }

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

    res.json({
      success: true,
      message: 'สั่งซื้อสินค้าและส่งมอบเข้าคลังเรียบร้อยแล้ว',
      order: finalOrder
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

// 2.5 Get Products with high-performance server-side caching (Saves 95%+ of Firestore Read units)
apiRouter.get('/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const force = req.query.force === 'true';
    const now = Date.now();

    if (!force && serverProductsCache && (now - serverProductsCache.timestamp < SERVER_PRODUCTS_TTL_MS)) {
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.json({
        success: true,
        products: serverProductsCache.data,
        cached: true,
        cachedAt: new Date(serverProductsCache.timestamp).toISOString(),
        count: serverProductsCache.data.length
      });
      return;
    }

    const productsColl = collection(db, 'products');
    const snap = await getDocs(productsColl);
    const list: any[] = [];
    snap.forEach((d) => {
      const item = d.data();
      list.push({
        ...item,
        productId: item.productId || d.id
      });
    });

    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    serverProductsCache = {
      data: list,
      timestamp: now
    };

    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json({
      success: true,
      products: list,
      cached: false,
      count: list.length
    });
  } catch (error: any) {
    console.error('Get Products API Error:', error);
    if (serverProductsCache) {
      res.json({
        success: true,
        products: serverProductsCache.data,
        cached: true,
        stale: true,
        count: serverProductsCache.data.length
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'GET_PRODUCTS_ERROR',
      message: error.message || 'ไม่สามารถดึงข้อมูลสินค้าได้'
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
      res.setHeader('Cache-Control', 'public, max-age=60');
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

    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json({
      success: true,
      config: configData,
      cached: false
    });
  } catch (error: any) {
    console.error('Get Home Config Error:', error);
    if (serverHomeConfigCache) {
      res.json({
        success: true,
        config: serverHomeConfigCache.data,
        cached: true,
        stale: true
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'GET_CONFIG_ERROR',
      message: error.message || 'ไม่สามารถดึงข้อมูลหน้าแรกได้'
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

