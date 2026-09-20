import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, 
  QrCode, 
  Copy, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  RefreshCw, 
  Image as ImageIcon, 
  Check, 
  FileCheck, 
  Download, 
  Camera,
  Gift,
  Sparkles,
  ExternalLink,
  HelpCircle,
  Info,
  ChevronRight,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { generatePromptPayQR } from '../lib/promptpay';
import { 
  ANGPAO_RECIPIENT_PHONE, 
  ANGPAO_RECIPIENT_NAME, 
  extractVoucherCode, 
  formatPhoneNumber 
} from '../lib/angpao';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { WalletTransaction } from '../types';

export const WalletView: React.FC = () => {
  const { user, loginWithGoogle, refreshUserProfile } = useAuth();
  const { success, error: toastError } = useToast();

  // Top-up method: 'truemoney' or 'promptpay'
  const [depositMethod, setDepositMethod] = useState<'truemoney' | 'promptpay'>('truemoney');

  // TrueMoney Angpao State
  const [angpaoInput, setAngpaoInput] = useState<string>('');
  const [isRedeemingAngpao, setIsRedeemingAngpao] = useState(false);
  const [copiedAngpao, setCopiedAngpao] = useState(false);
  const [angpaoResult, setAngpaoResult] = useState<{
    success: boolean;
    message: string;
    amount?: number;
    voucherCode?: string;
    senderName?: string;
  } | null>(null);

  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  // Slip upload state
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    transRef?: string;
    amount?: number;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Transactions list
  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    try {
      const cached = sessionStorage.getItem(`user_tx_${user?.uid}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [loadingTx, setLoadingTx] = useState(!transactions.length);
  const [isRefreshingTx, setIsRefreshingTx] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const PROMPTPAY_NUMBER = '0829848852';
  const PROMPTPAY_NAME = 'นาย กฤติน สุโขพล';

  const amountPresets = [50, 100, 200, 300, 500, 1000];
  const activeAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  // Generate QR on amount change
  useEffect(() => {
    let isMounted = true;
    const generate = async () => {
      try {
        const amt = activeAmount > 0 ? activeAmount : undefined;
        const qrUrl = await generatePromptPayQR(PROMPTPAY_NUMBER, amt);
        if (isMounted) {
          setQrDataUrl(qrUrl);
        }
      } catch (err) {
        console.error('Failed to generate PromptPay QR:', err);
      }
    };
    generate();
    return () => { isMounted = false; };
  }, [activeAmount]);

  // Fetch transactions with cache
  const fetchTransactions = async (force = false) => {
    if (!user) {
      setTransactions([]);
      setLoadingTx(false);
      return;
    }

    const cacheKey = `user_tx_${user.uid}`;
    const cacheTimeKey = `user_tx_time_${user.uid}`;
    const now = Date.now();
    const lastTime = Number(sessionStorage.getItem(cacheTimeKey) || 0);

    if (!force && now - lastTime < 3 * 60 * 1000) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          setTransactions(JSON.parse(cached));
          setLoadingTx(false);
          return;
        }
      } catch {}
    }

    if (force) setIsRefreshingTx(true);
    else if (!transactions.length) setLoadingTx(true);

    try {
      const q = query(
        collection(db, 'wallet_transactions'),
        where('uid', '==', user.uid),
        limit(15)
      );
      const snapshot = await getDocs(q);
      const items: WalletTransaction[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as WalletTransaction) });
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransactions(items);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(items));
        sessionStorage.setItem(cacheTimeKey, String(now));
      } catch {}
    } catch (err) {
      console.warn('Transactions fetch notice:', err);
    } finally {
      setLoadingTx(false);
      setIsRefreshingTx(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    const handleUpdate = () => {
      fetchTransactions(true);
    };
    window.addEventListener('walletUpdated', handleUpdate);

    return () => {
      window.removeEventListener('walletUpdated', handleUpdate);
    };
  }, [user]);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(PROMPTPAY_NUMBER);
    setCopied(true);
    success('คัดลอกหมายเลข PromptPay แล้ว', PROMPTPAY_NUMBER);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `PromptPay-AngusShop-${activeAmount}THB.png`;
    link.click();
    success('บันทึกภาพสำเร็จ', 'บันทึกรูป QR Code ลงเครื่องแล้ว สามารถนำไปสแกนในแอปธนาคารได้ทันที');
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toastError('ไฟล์ไม่ถูกต้อง', 'กรุณาอัปโหลดไฟล์รูปภาพสลิปเท่านั้น (JPG, PNG, WEBP)');
      return;
    }
    setSlipFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      // Optimize and resize image for SlipOK API to guarantee fast mobile uploads
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.90);
          setSlipPreview(optimizedDataUrl);
        } else {
          setSlipPreview(dataUrl);
        }
        setVerificationResult(null);
      };
      img.onerror = () => {
        setSlipPreview(dataUrl);
        setVerificationResult(null);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleVerifySlip = async () => {
    if (!user) {
      toastError('กรุณาเข้าสู่ระบบ', 'ต้องเข้าสู่ระบบก่อนทำการเติมเงิน');
      return;
    }
    if (!slipPreview) {
      toastError('ไม่พบสลิป', 'กรุณาเลือกรูปภาพสลิปที่โอนเงินสำเร็จ');
      return;
    }
    if (activeAmount <= 0) {
      toastError('จำนวนเงินไม่ถูกต้อง', 'กรุณาระบุจำนวนเงินที่ถูกต้อง');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const response = await fetch('/api/wallet/verify-slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          expectedAmount: activeAmount,
          imageBase64: slipPreview,
          depositId: `dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationResult({
          success: true,
          message: data.message || 'เติมเงินเข้ากระเป๋าสำเร็จ!',
          transRef: data.transRef,
          amount: data.amount,
        });
        const credited = (data.amount !== undefined ? data.amount : activeAmount) || 0;
        success('เติมเงินสำเร็จ!', `เพิ่ม ฿${credited.toLocaleString()} เข้า Wallet ของคุณแล้ว`);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        setSlipFile(null);
        setSlipPreview(null);
        if (refreshUserProfile) refreshUserProfile();
        fetchTransactions(true);
        window.dispatchEvent(new CustomEvent('accountStatsUpdated'));
      } else {
        setVerificationResult({
          success: false,
          message: data.message || 'การตรวจสอบสลิปไม่ผ่าน',
        });
        toastError('ตรวจสอบสลิปไม่สำเร็จ', data.message);
      }
    } catch (err: any) {
      console.error('Verify slip error:', err);
      setVerificationResult({
        success: false,
        message: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ตรวจสอบสลิปได้ กรุณาลองใหม่',
      });
      toastError('ข้อผิดพลาด', 'ระบบเซิร์ฟเวอร์ขัดข้องชั่วคราว');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyAngpaoNumber = () => {
    navigator.clipboard.writeText(ANGPAO_RECIPIENT_PHONE);
    setCopiedAngpao(true);
    success('คัดลอกเบอร์สำเร็จ', ANGPAO_RECIPIENT_PHONE);
    setTimeout(() => setCopiedAngpao(false), 2000);
  };

  const handlePasteAngpao = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setAngpaoInput(text.trim());
        success('วางลิงก์แล้ว', 'นำข้อความจากคลิปบอร์ดมาใส่ในช่องแล้ว');
      }
    } catch {
      toastError('ไม่สามารถเข้าถึงคลิปบอร์ด', 'กรุณากดคลิกขวาหรือกดค้างเพื่อวางลิงก์');
    }
  };

  const handleRedeemAngpao = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      toastError('กรุณาเข้าสู่ระบบ', 'ต้องเข้าสู่ระบบก่อนทำการเติมเงิน');
      return;
    }

    const trimmed = angpaoInput.trim();
    if (!trimmed) {
      toastError('กรุณากรอกข้อมูล', 'กรุณาวางลิงก์หรือรหัสซองของขวัญ TrueMoney Wallet');
      return;
    }

    const code = extractVoucherCode(trimmed);
    if (!code) {
      toastError('ลิงก์ซองของขวัญไม่ถูกต้อง', 'กรุณาวางลิงก์ที่ได้จาก TrueMoney เช่น https://gift.truemoney.com/campaign/?v=...');
      return;
    }

    setIsRedeemingAngpao(true);
    setAngpaoResult(null);

    try {
      const response = await fetch('/api/wallet/redeem-angpao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          voucherUrl: trimmed,
          phone: ANGPAO_RECIPIENT_PHONE
        })
      });

      const data = await response.json();

      if (data.success) {
        const credited = data.amount || 0;
        setAngpaoResult({
          success: true,
          message: data.message || `เติมเงินสำเร็จ! ได้รับ ฿${credited.toLocaleString()} พ้อยท์`,
          amount: credited,
          voucherCode: data.voucherCode,
          senderName: data.senderName
        });
        success('เติมเงินสำเร็จ!', `เพิ่ม ฿${credited.toLocaleString()} พ้อยท์เข้า Wallet เรียบร้อยแล้ว`);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        setAngpaoInput('');
        if (refreshUserProfile) refreshUserProfile();
        fetchTransactions(true);
        window.dispatchEvent(new CustomEvent('accountStatsUpdated'));
      } else {
        setAngpaoResult({
          success: false,
          message: data.message || 'ไม่สามารถเติมเงินผ่านซองอั่งเปาได้'
        });
        toastError('เติมเงินไม่สำเร็จ', data.message || 'กรุณาตรวจสอบซองของขวัญในแอป TrueMoney');
      }
    } catch (err: any) {
      console.error('Angpao redeem error:', err);
      setAngpaoResult({
        success: false,
        message: 'ไม่สามารถเชื่อมต่อระบบเติมเงินได้ กรุณาลองใหม่อีกครั้ง'
      });
      toastError('ข้อผิดพลาด', 'ระบบเชื่อมต่อขัดข้อง กรุณาลองใหม่');
    } finally {
      setIsRedeemingAngpao(false);
    }
  };

  const detectedVoucherCode = extractVoucherCode(angpaoInput);

  const totalDeposited = transactions
    .filter((t) => t.type === 'deposit' && t.status === 'success')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalSpent = transactions
    .filter((t) => t.type === 'purchase' && t.status === 'success')
    .reduce((acc, t) => acc + t.amount, 0);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 sm:py-24 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-[#A855F7] mx-auto mb-4">
          <Wallet className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">เข้าสู่ระบบเพื่อใช้งาน Wallet</h2>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
          ระบบกระเป๋าเงิน AngusShop สำหรับเติมเงิน ซื้อผลปีศาจ และตรวจสอบสลิปอัตโนมัติ
        </p>
        <button
          onClick={loginWithGoogle}
          className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-bold text-xs shadow-lg shadow-purple-500/25 hover:brightness-110 cursor-pointer"
        >
          เข้าสู่ระบบด้วย Google
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl 2xl:max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 pb-20 sm:pb-8">
      
      {/* Wallet Balance Overview Cards */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">กระเป๋าเงิน Wallet</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 sm:mt-1">
          เติมเงินเข้ากระเป๋าผ่านซองของขวัญ TrueMoney Wallet หรือพร้อมเพย์ PromptPay อัตโนมัติ 24 ชม.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        {/* Main Balance Card */}
        <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1C1333] via-[#120F24] to-[#0D0B18] border border-purple-500/40 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">ยอดเงินปัจจุบัน</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400">
              ฿{(user.balance || 0).toLocaleString()}
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-1">พร้อมใช้งานสำหรับการสั่งซื้อ</p>
          </div>
        </div>

        {/* Total Deposited */}
        <div className="p-4 sm:p-6 rounded-3xl bg-[#11111A] border border-[#212133] shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ยอดเติมเงินทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <div className="text-2xl sm:text-3xl font-black text-white">
              ฿{totalDeposited.toLocaleString()}
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-1">สลิปผ่านการตรวจสอบแล้ว</p>
          </div>
        </div>

        {/* Total Spent */}
        <div className="p-4 sm:p-6 rounded-3xl bg-[#11111A] border border-[#212133] shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ยอดใช้จ่ายทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <div className="text-2xl sm:text-3xl font-black text-zinc-200">
              ฿{totalSpent.toLocaleString()}
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-1">สั่งซื้อสินค้าในร้านค้า</p>
          </div>
        </div>
      </div>

      {/* Deposit Method Selection Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF8A00]" />
            <span>เลือกช่องทางการเติมเงิน</span>
          </h2>
          <span className="text-[11px] text-zinc-400">ระบบอัตโนมัติ 24 ชั่วโมง</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* TrueMoney Angpao Tab */}
          <button
            type="button"
            onClick={() => setDepositMethod('truemoney')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex items-center justify-between ${
              depositMethod === 'truemoney'
                ? 'bg-gradient-to-r from-[#FF5B00]/20 via-[#FF8A00]/10 to-transparent border-[#FF6A00] ring-1 ring-[#FF6A00]/50 shadow-lg shadow-[#FF5B00]/10'
                : 'bg-[#11111A] border-[#212133] hover:border-[#383850] opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF5B00] to-[#E64A19] flex items-center justify-center text-white shadow-md shadow-[#FF5B00]/30 shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">ซองอั่งเปา TrueMoney</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF5B00]/20 text-[#FF8A00] border border-[#FF5B00]/30">
                    แนะนำ • ออโต้
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  กรอกเบอร์ {formatPhoneNumber(ANGPAO_RECIPIENT_PHONE)} อัตโนมัติ • ได้รับพ้อยท์ตามจำนวนเงินในซอง
                </p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
              depositMethod === 'truemoney' ? 'border-[#FF6A00] bg-[#FF6A00] text-white' : 'border-[#33334A]'
            }`}>
              {depositMethod === 'truemoney' && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* PromptPay Tab */}
          <button
            type="button"
            onClick={() => setDepositMethod('promptpay')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex items-center justify-between ${
              depositMethod === 'promptpay'
                ? 'bg-gradient-to-r from-purple-500/20 via-indigo-500/10 to-transparent border-purple-500 ring-1 ring-purple-500/50 shadow-lg shadow-purple-500/10'
                : 'bg-[#11111A] border-[#212133] hover:border-[#383850] opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#003B71] to-[#0284C7] flex items-center justify-center text-white shadow-md shadow-blue-500/30 shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">พร้อมเพย์ PromptPay</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    ตรวจสลิปออโต้
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  สแกน Thai QR Code ทุกธนาคาร ตรวจสอบสลิปผ่าน SlipOK
                </p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
              depositMethod === 'promptpay' ? 'border-purple-500 bg-purple-500 text-white' : 'border-[#33334A]'
            }`}>
              {depositMethod === 'promptpay' && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>
        </div>
      </div>

      {/* Main Deposit Section: TrueMoney Angpao or PromptPay */}
      {depositMethod === 'truemoney' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
          {/* Left: How-to and Recipient Phone Info */}
          <div className="lg:col-span-5 p-4 sm:p-6 rounded-3xl bg-[#11111A] border border-[#212133] space-y-4 sm:space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#212133]">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5B00] to-[#E64A19] flex items-center justify-center text-white shadow-md shadow-[#FF5B00]/20">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">ซองของขวัญ TrueMoney Wallet</h3>
                  <p className="text-xs text-[#FF8A00]">โอนเงินผ่านซองอั่งเปา ระบบแอดพ้อยท์อัตโนมัติ</p>
                </div>
              </div>

              {/* Recipient Phone Info Card - Auto-filled as requested */}
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-[#1C120C] to-[#120B07] border border-[#FF6A00]/30 space-y-3 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-28 h-28 bg-[#FF5B00]/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-400">เบอร์โทรศัพท์ผู้รับ (กำหนดให้อัตโนมัติ)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FF5B00]/20 text-[#FF8A00] border border-[#FF5B00]/30">
                    อัตโนมัติ
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white">
                      {formatPhoneNumber(ANGPAO_RECIPIENT_PHONE)}
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5 font-medium">
                      ชื่อบัญชี: <span className="text-zinc-200">{ANGPAO_RECIPIENT_NAME}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAngpaoNumber}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2A180E] hover:bg-[#3D2214] border border-[#FF6A00]/40 text-xs text-[#FF8A00] font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    {copiedAngpao ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอกเบอร์</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step-by-Step Guide */}
              <div className="mt-4 space-y-2.5">
                <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#FF8A00]" />
                  <span>วิธีสร้างซองของขวัญในแอป TrueMoney</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#0B0B12] border border-[#1E1E2E] flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#FF5B00]/20 text-[#FF8A00] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <p className="text-zinc-300">เปิดแอป <strong>TrueMoney Wallet</strong> แล้วกดเลือกเมนู <strong>"โอนเงิน"</strong> &gt; <strong>"ส่งซองของขวัญ"</strong></p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0B0B12] border border-[#1E1E2E] flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#FF5B00]/20 text-[#FF8A00] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <p className="text-zinc-300">ใส่จำนวนเงินที่ต้องการเติม (เช่น 20, 50, 100, 300, 500 บาท ฯลฯ)</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0B0B12] border border-[#1E1E2E] flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#FF5B00]/20 text-[#FF8A00] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <p className="text-zinc-300">เลือกประเภทการส่งเป็น <strong className="text-amber-300">"แบ่งจำนวนเงินเท่ากัน"</strong> และใส่จำนวนคนที่รับได้ <strong className="text-amber-300">"1 คน"</strong></p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0B0B12] border border-[#1E1E2E] flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#FF5B00]/20 text-[#FF8A00] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                    <p className="text-zinc-300">คัดลอกลิงก์ซองของขวัญ แล้วนำมาวางในช่องด้านขวา เพื่อรับพ้อยท์เข้าบัญชีทันที</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[10px] sm:text-[11px] text-zinc-500 flex items-center gap-1.5 justify-center mt-3 pt-3 border-t border-[#212133]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF8A00]" />
              ระบบตัดเงินและแอดพ้อยท์ตามจำนวนเงินในซองของขวัญทันที
            </div>
          </div>

          {/* Right: Voucher Link Input & Submit */}
          <div className="lg:col-span-7 p-4 sm:p-6 rounded-3xl bg-[#11111A] border border-[#212133] space-y-5 sm:space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF8A00]" />
                  <span>วางลิงก์ซองของขวัญ TrueMoney</span>
                </h3>
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  1 บาท = 1 พ้อยท์
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                วางลิงก์ซองอั่งเปาที่คัดลอกมาจากแอป TrueMoney เช่น <span className="font-mono text-zinc-300">https://gift.truemoney.com/campaign/?v=...</span>
              </p>
            </div>

            <form onSubmit={handleRedeemAngpao} className="space-y-4">
              {/* Input & Paste action */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300">
                    ลิงก์ซองของขวัญ (Voucher Link)
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteAngpao}
                    className="text-xs text-[#FF8A00] hover:text-[#FFA040] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>กดวางลิงก์จากคลิปบอร์ด</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={angpaoInput}
                    onChange={(e) => setAngpaoInput(e.target.value)}
                    placeholder="https://gift.truemoney.com/campaign/?v=..."
                    className="w-full bg-[#0B0B12] border border-[#2B2B40] focus:border-[#FF6A00] rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#FF6A00]/50 transition-all font-mono pr-20"
                  />
                  {angpaoInput && (
                    <button
                      type="button"
                      onClick={() => setAngpaoInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-[#181824] border border-[#2B2B40] cursor-pointer"
                    >
                      ล้าง
                    </button>
                  )}
                </div>

                {/* Detected Voucher Preview */}
                {detectedVoucherCode && (
                  <div className="p-2.5 rounded-xl bg-[#0D180E] border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <div className="truncate">
                      <span>ตรวจพบรหัสซอง: </span>
                      <strong className="font-mono text-white">{detectedVoucherCode}</strong>
                      <span className="text-zinc-400 ml-1">(พร้อมเติมเงิน)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recipient Phone Confirmation Box (Readonly / Auto-filled) */}
              <div className="p-3.5 rounded-2xl bg-[#0B0B12] border border-[#212133] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-zinc-400">เบอร์ผู้รับเงินในระบบ:</span>
                  <span className="font-mono font-bold text-white">{formatPhoneNumber(ANGPAO_RECIPIENT_PHONE)}</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-medium">กรอกให้อัตโนมัติ</span>
              </div>

              {/* Result Feedback Banner */}
              {angpaoResult && (
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
                    angpaoResult.success
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {angpaoResult.success ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-bold text-sm">{angpaoResult.message}</div>
                    {angpaoResult.amount !== undefined && (
                      <div className="text-xs text-emerald-400 font-semibold">
                        ยอดเงินที่ได้รับ: ฿{angpaoResult.amount.toLocaleString()} พ้อยท์
                      </div>
                    )}
                    {angpaoResult.senderName && (
                      <div className="text-[11px] text-zinc-400">
                        ผู้ส่งซอง: {angpaoResult.senderName}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isRedeemingAngpao || !angpaoInput.trim()}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF5B00] via-[#FF6A00] to-[#E64A19] hover:brightness-110 text-white font-black text-xs sm:text-sm shadow-xl shadow-[#FF5B00]/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                {isRedeemingAngpao ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังตรวจสอบและรับเงินจากซองอั่งเปา...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4" />
                    <span>ยืนยันเติมเงินผ่านซองของขวัญ</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Tips */}
            <div className="p-3.5 rounded-2xl bg-[#0E0E16] border border-[#1E1E2E] space-y-1.5 text-[11px] text-zinc-400">
              <div className="font-bold text-zinc-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                <span>ข้อควรรู้เกี่ยวกับการเติมเงินซองของขวัญ:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1 text-zinc-400 leading-relaxed">
                <li>ต้องเลือกจำนวนคนที่รับซองเป็น <strong>1 คน</strong> เท่านั้น</li>
                <li>ระบบจะแอดพ้อยท์ตามจำนวนเงินจริงที่ระบุไว้ในซอง 1 บาท = 1 พ้อยท์</li>
                <li>ซองของขวัญต้องยังไม่เคยถูกผู้อื่นรับ และยังไม่หมดอายุ (มีอายุ 72 ชั่วโมง)</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* PromptPay Deposit Section */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
          
          {/* Left: QR PromptPay & Account Details */}
          <div className="lg:col-span-5 p-4 sm:p-6 rounded-3xl bg-[#11111A] border border-[#212133] space-y-4 sm:space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#212133]">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-[#A855F7]">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">พร้อมเพย์ PromptPay</h3>
                  <p className="text-xs text-zinc-400">สแกนจ่ายผ่าน Mobile Banking ได้ทุกธนาคาร</p>
                </div>
              </div>

              {/* QR Card with Thai QR Header */}
              <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-white text-zinc-900 shadow-2xl max-w-[260px] sm:max-w-[290px] mx-auto flex flex-col items-center">
                <div className="w-full bg-[#003B71] text-white py-1 px-3 rounded-t-lg flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black tracking-wider">THAI QR PAYMENT</span>
                  <span className="text-[9px] font-bold">PromptPay</span>
                </div>

                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="PromptPay QR"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-xs text-zinc-400">
                    กำลังสร้าง QR...
                  </div>
                )}

                <div className="text-center mt-2 w-full pt-2 border-t border-zinc-200">
                  <div className="text-xs font-bold text-zinc-800">{PROMPTPAY_NAME}</div>
                  <div className="text-xs text-zinc-500 font-mono mt-0.5">{PROMPTPAY_NUMBER}</div>
                  <div className="text-sm font-black text-[#003B71] mt-1">
                    ฿{activeAmount.toLocaleString()} บาท
                  </div>
                </div>
              </div>

              {/* Quick Actions for Mobile User */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  onClick={handleDownloadQr}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C2C] hover:bg-[#252538] border border-[#2E2E44] text-xs text-zinc-200 font-semibold cursor-pointer active:scale-95 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>บันทึกรูป QR</span>
                </button>

                <button
                  onClick={handleCopyNumber}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C2C] hover:bg-[#252538] border border-[#2E2E44] text-xs text-zinc-200 font-semibold cursor-pointer active:scale-95 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
                  <span>คัดลอกเบอร์</span>
                </button>
              </div>

              {/* Account Info details */}
              <div className="mt-4 p-3.5 rounded-2xl bg-[#0B0B12] border border-[#232336] space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">ชื่อบัญชี:</span>
                  <span className="font-bold text-white">{PROMPTPAY_NAME}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">เบอร์ PromptPay:</span>
                  <span className="font-mono font-bold text-purple-300 text-xs sm:text-sm">{PROMPTPAY_NUMBER}</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] sm:text-[11px] text-zinc-500 flex items-center gap-1.5 justify-center mt-3">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              ระบบ SlipOK ตรวจสอบสลิปอัตโนมัติ 24 ชม.
            </div>
          </div>

          {/* Right: Amount Selection & Slip Upload */}
          <div className="lg:col-span-7 p-4 sm:p-6 rounded-3xl bg-[#11111A] border border-[#212133] space-y-5 sm:space-y-6">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">1. เลือกจำนวนเงินที่ต้องการเติม</h3>
              <p className="text-xs text-zinc-400 mt-0.5">เลือกจำนวนเงิน หรือระบุจำนวนเอง</p>

              {/* Presets Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
                {amountPresets.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount('');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeAmount === amt && !customAmount
                        ? 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white shadow-md shadow-purple-500/25 ring-1 ring-purple-400'
                        : 'bg-[#181826] text-zinc-300 hover:bg-[#212135] border border-[#2B2B40]'
                    }`}
                  >
                    ฿{amt}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="mt-2.5">
                <input
                  type="number"
                  placeholder="หรือระบุจำนวนเงินเอง (เช่น 250, 750, 1500)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  min="1"
                  className="w-full bg-[#0B0B12] border border-[#262638] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Slip Upload Box */}
            <div className="space-y-3 pt-3 border-t border-[#212133]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">2. อัปโหลดสลิปการโอนเงิน</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  สลิปต้องมียอดเงิน <strong className="text-white">฿{activeAmount.toLocaleString()}</strong> โอนเข้า <strong className="text-purple-300">{PROMPTPAY_NAME}</strong>
                </p>
              </div>

              {/* Drag & Drop Box */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 sm:p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                  dragActive
                    ? 'border-purple-500 bg-purple-500/10'
                    : slipPreview
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-[#2D2D42] bg-[#0B0B12] hover:border-purple-500/50 hover:bg-[#12121F]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                />

                {slipPreview ? (
                  <div className="space-y-2">
                    <div className="relative inline-block">
                      <img
                        src={slipPreview}
                        alt="Slip Preview"
                        className="max-h-44 sm:max-h-48 rounded-xl border border-emerald-500/30 object-contain shadow-md mx-auto"
                      />
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <p className="text-xs text-emerald-400 font-medium">
                      สลิปพร้อมตรวจสอบ (แตะเพื่อเปลี่ยนรูป)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 py-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-[#A855F7] mx-auto">
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h4 className="text-xs font-bold text-zinc-200">
                      แตะเพื่อเลือกภาพสลิปจากมือถือ หรือลากไฟล์มาวาง
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-zinc-500">
                      รองรับ JPG, PNG, WEBP (สลิปจากทุกธนาคาร)
                    </p>
                  </div>
                )}
              </div>

              {/* Verification Result Feedback */}
              {verificationResult && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs ${
                    verificationResult.success
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-950/30 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {verificationResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{verificationResult.message}</div>
                    {verificationResult.transRef && (
                      <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                        Ref: {verificationResult.transRef}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleVerifySlip}
                disabled={isVerifying || !slipPreview}
                className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังส่งตรวจสอบกับ SlipOK...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>ตรวจสอบสลิปและเติมเงิน (฿{activeAmount.toLocaleString()})</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Transaction History Section */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#11111A] border border-[#212133] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#212133] gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">ประวัติธุรกรรม Wallet</h3>
            <p className="text-xs text-zinc-400">รายการเติมเงินและสั่งซื้อสินค้าทั้งหมดของคุณ</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 hidden sm:inline">{transactions.length} รายการ</span>
            <button
              onClick={() => fetchTransactions(true)}
              disabled={isRefreshingTx}
              className="flex items-center gap-1 bg-[#141420] hover:bg-[#1c1c2e] border border-[#212133] text-zinc-300 hover:text-white px-2.5 py-1 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="รีเฟรชประวัติธุรกรรม"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingTx ? 'animate-spin text-purple-400' : ''}`} />
              <span className="hidden sm:inline">{isRefreshingTx ? '...' : 'รีเฟรช'}</span>
            </button>
          </div>
        </div>

        {loadingTx ? (
          <div className="py-8 text-center text-xs text-zinc-500">กำลังโหลดประวัติธุรกรรม...</div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            ยังไม่มีประวัติธุรกรรมในระบบ เริ่มเติมเงินครั้งแรกได้ทันที
          </div>
        ) : (
          <div>
            {/* Mobile Cards View */}
            <div className="sm:hidden space-y-2.5">
              {transactions.map((t) => (
                <div key={t.id || t.transactionId} className="p-3 rounded-2xl bg-[#0B0B12] border border-[#1E1E2E] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      t.type === 'deposit' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-purple-500/15 text-purple-400'
                    }`}>
                      {t.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{t.description || (t.type === 'deposit' ? 'เติมเงิน Wallet' : 'สั่งซื้อสินค้า')}</div>
                      <div className="text-[10px] text-zinc-500">{new Date(t.createdAt).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-xs font-black ${t.type === 'deposit' ? 'text-emerald-400' : 'text-purple-300'}`}>
                      {t.type === 'deposit' ? `+฿${(t.amount || 0).toLocaleString()}` : `-฿${(t.amount || 0).toLocaleString()}`}
                    </div>
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">สำเร็จ</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-zinc-500 border-b border-[#1E1E2E]">
                    <th className="pb-3 font-semibold">ประเภท</th>
                    <th className="pb-3 font-semibold">รายละเอียด</th>
                    <th className="pb-3 font-semibold">รหัสอ้างอิง</th>
                    <th className="pb-3 font-semibold">วันที่ / เวลา</th>
                    <th className="pb-3 font-semibold text-right">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A28]">
                  {transactions.map((t) => (
                    <tr key={t.id || t.transactionId} className="hover:bg-[#161624] transition-colors">
                      <td className="py-3.5">
                        {t.type === 'deposit' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            <ArrowDownLeft className="w-3 h-3" /> เติมเงิน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-purple-400 font-semibold bg-purple-500/10 px-2 py-0.5 rounded-md">
                            <ArrowUpRight className="w-3 h-3" /> สั่งซื้อสินค้า
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-zinc-300">{t.description || '-'}</td>
                      <td className="py-3.5 font-mono text-[11px] text-zinc-400">{t.reference || '-'}</td>
                      <td className="py-3.5 text-zinc-400">
                        {t.createdAt ? new Date(t.createdAt).toLocaleString('th-TH', { hour12: false }) : '-'}
                      </td>
                      <td className="py-3.5 text-right font-bold">
                        {t.type === 'deposit' ? (
                          <span className="text-emerald-400">+฿{(t.amount || 0).toLocaleString()}</span>
                        ) : (
                          <span className="text-zinc-300">-฿{(t.amount || 0).toLocaleString()}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
