import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Wallet, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  User, 
  FileText,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import type { Order } from '../types';
import { BloxImage } from '../components/BloxImage';

interface CheckoutViewProps {
  onNavigate: (view: string, param?: string) => void;
  onOrderCompleted: (order: Order) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ 
  onNavigate, 
  onOrderCompleted 
}) => {
  const { user, loginWithGoogle, refreshUserProfile } = useAuth();
  const { items, subtotal, total, clearCart } = useCart();
  const { success, error: toastError } = useToast();

  const [robloxUsername, setRobloxUsername] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 sm:py-20 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-4">
          <User className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">กรุณาเข้าสู่ระบบ</h2>
        <p className="text-xs text-zinc-400 mt-2">
          ท่านจำเป็นต้องเข้าสู่ระบบด้วย Google ก่อนทำการชำระเงิน
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

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 sm:py-20 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#141420] flex items-center justify-center text-zinc-500 mx-auto mb-4">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">ไม่มีสินค้าในตะกร้า</h2>
        <p className="text-xs text-zinc-400 mt-2">
          กรุณาเลือกซื้อผลปีศาจหรือ Gamepass ก่อนทำรายการชำระเงิน
        </p>
        <button
          onClick={() => onNavigate('shop')}
          className="mt-6 px-6 py-3 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 cursor-pointer"
        >
          ไปยังร้านค้า
        </button>
      </div>
    );
  }

  const currentBalance = user.balance || 0;
  const isBalanceSufficient = currentBalance >= total;
  const remainingBalance = currentBalance - total;

  const handleConfirmOrder = async () => {
    if (!robloxUsername.trim()) {
      toastError('ระบุชื่อ Roblox', 'กรุณากรอกชื่อตัวละคร Roblox (Username) เพื่อให้ทีมงานส่งมอบสินค้า');
      return;
    }

    if (!isBalanceSufficient) {
      toastError('ยอดเงินไม่เพียงพอ', 'ยอดเงินในกระเป๋าของคุณไม่พอชำระ กรุณาเติมเงินก่อน');
      return;
    }

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const response = await fetch('/api/order/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          items,
          robloxUsername: robloxUsername.trim(),
          note: note.trim(),
        }),
      });

      const data = await response.json();

      if (data.success && data.order) {
        success('สั่งซื้อสินค้าสำเร็จ!', 'ระบบได้ส่งไอเทมเข้าสู่คลังสินค้าของคุณเรียบร้อยแล้ว');
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
        clearCart();
        if (refreshUserProfile) refreshUserProfile();
        onOrderCompleted(data.order);
      } else {
        setCheckoutError(data.error || data.message || 'ไม่สามารถทำรายการสั่งซื้อได้');
        toastError('ชำระเงินไม่สำเร็จ', data.error || data.message);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setCheckoutError('ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง');
      toastError('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ชำระเงินได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl 2xl:max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 pb-24 sm:pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">ชำระเงินและรับสินค้า</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 sm:mt-1">
          กรอกชื่อผู้เล่น Roblox และยืนยันการตัดยอดเงินจากกระเป๋า Wallet
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
        
        {/* Left: Roblox Info Form */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-4 sm:p-6 rounded-3xl bg-[#11111A] border border-[#212133] space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#212133]">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">ข้อมูลบัญชี Roblox สำหรับส่งมอบ</h3>
                <p className="text-xs text-zinc-400">กรุณาระบุ Username ตัวละครให้ถูกต้อง</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1">
                ชื่อผู้ใช้ Roblox (Username) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น RobloxGamer123 (ไม่ใช่ Display Name)"
                value={robloxUsername}
                onChange={(e) => setRobloxUsername(e.target.value)}
                className="w-full bg-[#0B0B12] border border-[#262638] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
              <p className="text-[11px] text-zinc-400">
                * บอทและทีมงานจะส่งผลปีศาจผ่านระบบ Trade ใน Private VIP Server ให้กับชื่อนี้
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                หมายเหตุเพิ่มเติมถึงทางร้าน (ถ้ามี)
              </label>
              <textarea
                rows={2}
                placeholder="เช่น ขอรับสินค้าช่วง 18:00 น. หรือสะดวกเทรดเกาะ Sea 2"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[#0B0B12] border border-[#262638] rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Delivery Process Info */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0D0D16] border border-[#202030] space-y-2 text-xs">
            <div className="font-bold text-zinc-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ระบบส่งมอบสินค้าอัตโนมัติ (Digital Delivery)
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px] sm:text-xs">
              เมื่อกดชำระเงินสำเร็จ ไอเทมจะปรากฏในเมนู <strong>"คลังสินค้า (Inventory)"</strong> ของท่านทันที พร้อมลิงก์เข้าร่วมเซิร์ฟเวอร์ VIP Trade ในเกมอย่างปลอดภัย 100%
            </p>
          </div>

        </div>

        {/* Right: Order Summary & Wallet Balance check */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="p-4 sm:p-6 rounded-3xl bg-[#11111A] border border-[#212133] space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-white pb-3 border-b border-[#212133]">
              สรุปคำสั่งซื้อ ({items.length} รายการ)
            </h3>

            {/* Items list */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 divide-y divide-[#1A1A28]">
              {items.map((it) => (
                <div key={it.productId} className="pt-2 first:pt-0 flex items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#0B0B14] border border-[#232336] shrink-0 p-0.5 flex items-center justify-center overflow-hidden">
                      <BloxImage
                        src={it.image}
                        alt={it.name}
                        productName={it.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="truncate">
                      <h5 className="font-semibold text-white truncate text-xs">{it.name}</h5>
                      <span className="text-zinc-500 text-[10px]">x{it.quantity}</span>
                    </div>
                  </div>
                  <div className="font-bold text-purple-300 shrink-0">
                    ฿{((it.price || 0) * (it.quantity || 1)).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="pt-3 border-t border-[#212133] space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>ยอดรวมสินค้า</span>
                <span>฿{(subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-black text-white pt-2 border-t border-[#212133]">
                <span>ยอดชำระทั้งหมด</span>
                <span className="text-purple-400 font-black">฿{(total || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Wallet Balance Verification Box */}
            <div className={`p-3.5 sm:p-4 rounded-2xl border transition-colors ${
              isBalanceSufficient 
                ? 'bg-[#151224] border-purple-500/30' 
                : 'bg-rose-950/20 border-rose-500/30'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-purple-400" />
                  <span className="text-zinc-300 font-medium">ยอดเงินใน Wallet:</span>
                </div>
                <span className="font-bold text-white text-xs sm:text-sm">
                  ฿{(currentBalance || 0).toLocaleString()}
                </span>
              </div>

              {isBalanceSufficient ? (
                <div className="mt-2 text-[11px] text-zinc-400 pt-2 border-t border-purple-500/20 flex justify-between">
                  <span>คงเหลือหลังชำระ:</span>
                  <span className="text-emerald-400 font-semibold">฿{(remainingBalance || 0).toLocaleString()}</span>
                </div>
              ) : (
                <div className="mt-2.5 pt-2 border-t border-rose-500/20 space-y-2">
                  <div className="text-[11px] text-rose-400 font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    ยอดเงินไม่พอ (ขาดอีก ฿{Math.max(0, (total || 0) - (currentBalance || 0)).toLocaleString()})
                  </div>
                  <button
                    onClick={() => onNavigate('wallet')}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เติมเงินผ่าน PromptPay ทันที</span>
                  </button>
                </div>
              )}
            </div>

            {checkoutError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Confirm Payment Button */}
            <button
              onClick={handleConfirmOrder}
              disabled={isSubmitting || !isBalanceSufficient}
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:brightness-110 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังตัดยอดเงินและส่งมอบสินค้า...</span>
                </>
              ) : (
                <>
                  <span>ยืนยันการชำระเงิน (฿{(total || 0).toLocaleString()})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
