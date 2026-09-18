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
  serverTimestamp 
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

// Health Check Endpoint (For keep-alive ping)
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const SLIPOK_URL = process.env.SLIPOK_API_URL || 'https://api.slipok.com/api/line/apikey/76096';
const SLIPOK_KEY = process.env.SLIPOK_API_KEY || 'SLIPOKTMX6PUU';
const PROMPTPAY_ACCOUNT = process.env.PROMPTPAY_ACCOUNT || '0829848852';
const PROMPTPAY_NAME = process.env.PROMPTPAY_NAME || 'นาย กฤติน สุโขพล';

// Health check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    store: 'AngusShop',
    time: new Date().toISOString(),
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
      where('status', '==', 'completed')
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
      where('reference', '==', transRef)
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
      transaction.set(userRef, {
        uid,
        balance: newBalance,
        updatedAt: nowIso
      }, { merge: true });

      // 2. Update/create deposit record
      const depositRef = doc(db, 'deposits', actualDepositId);
      transaction.set(depositRef, {
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
      }, { merge: true });

      // 3. Create wallet transaction
      const txRef = doc(db, 'wallet_transactions', txId);
      transaction.set(txRef, {
        transactionId: txId,
        uid,
        type: 'deposit',
        amount: creditAmount,
        status: 'success',
        reference: transRef,
        depositId: actualDepositId,
        description: `เติมเงินผ่าน PromptPay ${PROMPTPAY_ACCOUNT} ยอด ฿${creditAmount.toLocaleString()} สำเร็จ`,
        createdAt: nowIso
      });

      // 4. Create notification
      const notifRef = doc(db, 'notifications', notifId);
      transaction.set(notifRef, {
        notifId,
        uid,
        title: 'เติมเงินสำเร็จ!',
        message: `เติมเงินจำนวน ฿${creditAmount.toLocaleString()} เข้ากระเป๋า AngusShop Wallet เรียบร้อยแล้ว`,
        type: 'deposit',
        isRead: false,
        createdAt: nowIso
      });
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
      where('status', '==', 'completed')
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
      where('reference', '==', cleanCode)
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
      transaction.set(userRef, {
        uid,
        balance: newBalance,
        updatedAt: nowIso
      }, { merge: true });

      // 2. Create deposit record
      const depositRef = doc(db, 'deposits', depositId);
      transaction.set(depositRef, {
        depositId,
        uid,
        amount: creditAmount,
        method: 'truemoney_angpao',
        voucherHash: cleanCode,
        recipientPhone: targetPhone,
        senderName: redeemResult.senderName || null,
        status: 'completed',
        createdAt: nowIso,
        updatedAt: nowIso
      });

      // 3. Create wallet transaction
      const txRef = doc(db, 'wallet_transactions', txId);
      transaction.set(txRef, {
        transactionId: txId,
        uid,
        type: 'deposit',
        amount: creditAmount,
        status: 'success',
        reference: cleanCode,
        depositId,
        description: `เติมเงินผ่านซองอั่งเปา TrueMoney Wallet ฿${creditAmount.toLocaleString()} สำเร็จ (เบอร์รับ: ${targetPhone})`,
        createdAt: nowIso
      });

      // 4. Create notification
      const notifRef = doc(db, 'notifications', notifId);
      transaction.set(notifRef, {
        notifId,
        uid,
        title: 'เติมเงินซองอั่งเปาสำเร็จ!',
        message: `เติมเงินจำนวน ฿${creditAmount.toLocaleString()} จากซองของขวัญ TrueMoney Wallet เข้ากระเป๋าเรียบร้อยแล้ว`,
        type: 'deposit',
        isRead: false,
        createdAt: nowIso
      });
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
    const { uid, items, robloxUsername, note } = req.body;

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
        if (!prodData.isActive) {
          throw new Error(`สินค้า "${prodData.name}" ปิดจำหน่ายชั่วคราว`);
        }

        const currentStock = Number(prodData.stock || 0);
        const reqQty = Math.max(1, Number(item.quantity) || 1);

        if (currentStock < reqQty) {
          throw new Error(`สินค้า "${prodData.name}" มีสินค้าเหลือเพียง ${currentStock} ชิ้น (ไม่พอสำหรับการสั่งซื้อ)`);
        }

        const serverPrice = Number(prodData.price);
        calculatedSubtotal += serverPrice * reqQty;

        verifiedItems.push({
          productId: prodData.productId || item.productId,
          name: prodData.name,
          slug: prodData.slug,
          price: serverPrice,
          quantity: reqQty,
          image: prodData.image,
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

      // 4. Create Order Record
      finalOrder = {
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
        note: note || '',
        createdAt: nowIso,
        updatedAt: nowIso
      };

      const orderRef = doc(db, 'orders', orderId);
      transaction.set(orderRef, finalOrder);

      // 5. Create Wallet Transaction for purchase
      const txRef = doc(db, 'wallet_transactions', txId);
      transaction.set(txRef, {
        transactionId: txId,
        uid,
        type: 'purchase',
        amount: orderTotal,
        status: 'success',
        reference: orderId,
        orderId,
        description: `ชำระคำสั่งซื้อ #${orderId} (${verifiedItems.length} รายการ)`,
        createdAt: nowIso
      });

      // 6. Deliver to Inventory
      for (const item of verifiedItems) {
        const invId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const invRef = doc(db, 'inventory', invId);

        const customInstructions = item.deliveryInstructions?.trim();
        const customTradeServer = item.tradeServerLink?.trim();
        const customClaimCode = item.claimCode?.trim();

        let tradeServer = customTradeServer || globalVipLink;
        let instructions = customInstructions || globalInstructions || '';
        if (!instructions) {
          if (item.deliveryType === 'gamepass') {
            instructions = 'ระบบได้ส่งของขวัญ Gamepass เข้าสู่บัญชี Roblox ของท่านเรียบร้อยแล้ว';
          } else if (item.deliveryType === 'service') {
            instructions = 'ทีมงานกำลังดำเนินการฟาร์ม/อเวคให้ภายใน 15-30 นาที โปรดรอการติดต่อผ่าน Discord/ระบบ';
          } else {
            instructions = 'เข้าสู่เซิร์ฟเวอร์ VIP ผ่านลิงก์ด้านล่างเพื่อรับสินค้าผ่านระบบ Trade ในเกมกับบอท AngusShop';
          }
        }
        const claimCode = customClaimCode || `${globalPrefix}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const instructionsTitle = item.instructionsTitle?.trim() || globalInstructionsTitle;
        const serverLinkTitle = item.serverLinkTitle?.trim() || globalServerLinkTitle;
        const claimCodeTitle = item.claimCodeTitle?.trim() || globalClaimCodeTitle;

        transaction.set(invRef, {
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
      }

      // 7. Create Notification
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const notifRef = doc(db, 'notifications', notifId);
      transaction.set(notifRef, {
        notifId,
        uid,
        title: 'สั่งซื้อสินค้าสำเร็จ!',
        message: `คำสั่งซื้อ #${orderId} ยอด ฿${orderTotal.toLocaleString()} สำเร็จ สินค้าพร้อมใช้งานในคลังสินค้าของคุณแล้ว`,
        type: 'order',
        isRead: false,
        createdAt: nowIso
      });
    });

    res.json({
      success: true,
      message: 'สั่งซื้อสินค้าและส่งมอบเข้าคลังเรียบร้อยแล้ว',
      order: finalOrder
    });
  } catch (error: any) {
    console.error('Checkout Error:', error);
    res.status(400).json({
      success: false,
      error: 'CHECKOUT_FAILED',
      message: error.message || 'การสั่งซื้อไม่สำเร็จ'
    });
  }
});

// 3. Seed Initial Products in Firestore Catalog
apiRouter.post('/admin/seed-products', async (req: Request, res: Response): Promise<void> => {
  try {
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
      {
        ...updateData,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

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

// 6. Get Home & Hero Configuration
apiRouter.get('/home-config', async (req: Request, res: Response): Promise<void> => {
  try {
    const configDoc = await getDoc(doc(db, 'settings', 'homeConfig'));
    if (configDoc.exists()) {
      res.json({
        success: true,
        config: configDoc.data()
      });
    } else {
      res.json({
        success: true,
        config: null
      });
    }
  } catch (error: any) {
    console.error('Get Home Config Error:', error);
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
      {
        ...config,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

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

