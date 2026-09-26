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
  Plus,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ShieldAlert,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import type { Order } from '../types';
import { BloxImage } from '../components/BloxImage';
import { playClickSound, playSuccessSound } from '../lib/sound';

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
  const [serviceAccountUsername, setServiceAccountUsername] = useState('');
  const [serviceAccountPassword, setServiceAccountPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Check if cart contains any service/farm items
  const hasServiceItems = items.some(item => 
    item.category === 'บริการ' ||
    item.deliveryType === 'service' || 
    item.deliveryType === 'manual_service' ||
    item.name?.includes('ฟาร์ม') ||
    item.name?.includes('เงินเขียว') ||
    item.name?.includes('Beli') ||
    item.name?.includes('บริการ') ||
    item.name?.includes('CDK') ||
    item.name?.includes('โอเด้ง') ||
    item.name?.includes('ฮาคิ') ||
    item.name?.includes('Haki') ||
    item.name?.includes('เผ่า') ||
    item.name?.includes('V4')
  );

  const hasHakiItem = items.some(item => 
    item.name?.includes('ฮาคิ') || item.name?.includes('Haki')
  );

  const hasDragonRaceItem = items.some(item => 
    item.name?.includes('เผ่ามังกร') || item.name?.includes('V4T10')
  );

  const hasIslandCombatV2Item = items.some(item => 
    item.name?.includes('เควสเกาะ') || item.name?.includes('Combat') || item.name?.includes('คอมแบท') || item.productId === 'prod_island_combat_v2'
  );

  const hasMasteryItem = items.some(item => 
    item.productId === 'prod_farm_mastery_100' ||
    item.name?.includes('มาสเตอร์') ||
    item.name?.includes('มาส') ||
    item.name?.includes('Mastery')
  );

  const hasBountyItem = items.some(item => 
    item.name?.includes('ค่าหัว') || item.name?.includes('Bounty') || item.productId?.includes('bounty')
  );

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
          กรุณาเลือกซื้อผลปีศาจ บริการฟาร์ม หรือ Gamepass ก่อนทำรายการชำระเงิน
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

  const payableTotal = total;
  const currentBalance = user.balance || 0;
  const isBalanceSufficient = currentBalance >= payableTotal;
  const remainingBalance = currentBalance - payableTotal;

  const handleConfirmOrder = async () => {
    // Regular Roblox username validation
    if (!robloxUsername.trim()) {
      toastError('ระบุชื่อ Roblox', 'กรุณากรอกชื่อตัวละคร Roblox (Username) เพื่อให้ทีมงานส่งมอบสินค้า');
      return;
    }

    // Specific validation for service/farm items
    if (hasServiceItems) {
      const actualServiceUser = serviceAccountUsername.trim() || robloxUsername.trim();
      if (!actualServiceUser) {
        toastError('ระบุไอดีสำหรับฟาร์ม', 'กรุณาระบุไอดี Roblox สำหรับให้ทีมงานเข้าดำเนินการฟาร์ม');
        return;
      }
      if (!serviceAccountPassword.trim()) {
        toastError('ระบุรหัสผ่าน', 'กรุณากรอกรหัสผ่าน Roblox เพื่อให้ทีมงานล็อกอินเข้าฟาร์ม (ข้อมูลจะถูกส่งถึงแอดมินโดยตรงอย่างปลอดภัย)');
        return;
      }
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
          serviceAccountUsername: hasServiceItems ? (serviceAccountUsername.trim() || robloxUsername.trim()) : undefined,
          serviceAccountPassword: hasServiceItems ? serviceAccountPassword.trim() : undefined,
          note: note.trim(),
        }),
      });

      const data = await response.json();

      if (data.success && data.order) {
        success('สั่งซื้อสินค้าสำเร็จ!', hasServiceItems ? 'ระบบได้ส่งข้อมูลคำสั่งซื้อและไอดี/รหัสผ่านไปยังทีมงานเรียบร้อยแล้ว' : 'ระบบได้ส่งไอเทมเข้าสู่คลังสินค้าของคุณเรียบร้อยแล้ว');
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
        clearCart();
        if (refreshUserProfile) {
          try {
            await refreshUserProfile();
          } catch {}
        }
        try {
          // Invalidate user caches
          sessionStorage.removeItem(`user_orders_${user.uid}`);
          sessionStorage.removeItem(`user_orders_time_${user.uid}`);
          sessionStorage.removeItem(`user_inventory_${user.uid}`);
          sessionStorage.removeItem(`user_inventory_time_${user.uid}`);
          sessionStorage.removeItem(`user_tx_${user.uid}`);
          sessionStorage.removeItem(`user_tx_time_${user.uid}`);
          sessionStorage.removeItem(`user_stats_${user.uid}`);
          sessionStorage.removeItem(`user_stats_time_${user.uid}`);
          // Invalidate admin and catalog caches so all views update immediately
          localStorage.removeItem('angus_admin_orders');
          localStorage.removeItem('angus_admin_inventory');
          localStorage.removeItem('angus_admin_deposits');
          localStorage.removeItem('angus_products_cache');
          localStorage.removeItem('angus_cached_products');
        } catch {}
        window.dispatchEvent(new CustomEvent('productsUpdated'));
        window.dispatchEvent(new CustomEvent('ordersUpdated'));
        window.dispatchEvent(new CustomEvent('inventoryUpdated'));
        window.dispatchEvent(new CustomEvent('walletUpdated'));
        window.dispatchEvent(new CustomEvent('accountStatsUpdated'));
        onOrderCompleted(data.order);
      } else {
        const errMsg = data.message || data.error || 'ไม่สามารถทำรายการสั่งซื้อได้';
        setCheckoutError(errMsg);
        toastError('ชำระเงินไม่สำเร็จ', errMsg);
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
    <div className="w-full max-w-6xl 2xl:max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 pb-24 sm:pb-8 overflow-x-hidden [overscroll-behavior-x:none] [touch-action:pan-y_pinch-zoom]">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">ชำระเงินและสั่งซื้อ</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 sm:mt-1">
          {hasServiceItems 
            ? 'กรอกข้อมูลบัญชีสำหรับการฟาร์มและยืนยันการตัดยอดเงินจากกระเป๋า Wallet'
            : 'กรอกชื่อผู้เล่น Roblox และยืนยันการตัดยอดเงินจากกระเป๋า Wallet'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
        
        {/* Left: Roblox Info Form & Service Account Form */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Service Farm Credentials Box (Rendered ONLY when cart has service items) */}
          {hasServiceItems && (
            <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-[#18132A] via-[#120F24] to-[#11111A] border-2 border-purple-500/40 space-y-4 shadow-xl shadow-purple-950/20">
              <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-inner">
                    <KeyRound className="w-4 h-4 text-purple-300" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                      <span>ข้อมูลไอดีและรหัสผ่านสำหรับรับบริการฟาร์ม</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                        เฉพาะบริการฟาร์ม
                      </span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-purple-200/70">
                      ระบบจะส่งไอดีและรหัสผ่านไปยังแอดมินโดยตรงเพื่อเข้าดำเนินการฟาร์ม
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Banner */}
              <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex items-start gap-2.5 text-[11px] text-purple-200 leading-relaxed">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300">ข้อแนะนำความปลอดภัย:</strong> ปิดระบบยืนยันตัวตน 2 ขั้นตอน (2-Step Verification) ชั่วคราว หรือเตรียมรหัส 2-Step เพื่อให้ทีมงานเข้าทำรายการได้อย่างรวดเร็ว
                </div>
              </div>

              {/* Haki V2 Condition Banner */}
              {hasHakiItem && (
                <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-2.5 text-[11px] text-amber-200 leading-relaxed shadow-lg shadow-amber-950/20">
                  <span className="text-sm">⚠️</span>
                  <div>
                    <strong className="text-amber-300 font-bold">เงื่อนไขสำคัญบริการฮาคิ V2:</strong> ในไอดี Roblox ต้องมีเงินในเกม (Beli) ครบอย่างน้อย <strong className="text-white underline">5,000,000 (5 ล้าน Beli)</strong> สำหรับจ่ายให้ NPC ในเกม
                  </div>
                </div>
              )}

              {/* Dragon Race V4 T10 Info Banner */}
              {hasDragonRaceItem && (
                <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-start gap-2.5 text-[11px] text-red-200 leading-relaxed shadow-lg shadow-red-950/20">
                  <span className="text-sm">🐉</span>
                  <div>
                    <strong className="text-red-300 font-bold">บริการทำเผ่ามังกร V4T10:</strong> ทีมงานจะดำเนินการทำเควสและหมุนเกียร์จนเต็ม Tier 10 ปลดล็อกพลังสูงสุด ปลอดภัย 100%
                  </div>
                </div>
              )}

              {/* Island Quests + Combat V2 Info Banner */}
              {hasIslandCombatV2Item && (
                <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex items-start gap-2.5 text-[11px] text-purple-200 leading-relaxed shadow-lg shadow-purple-950/20">
                  <span className="text-sm">⚡</span>
                  <div>
                    <strong className="text-purple-300 font-bold">บริการเควสเกาะทั้งหมด + หมัด Combat V2:</strong> ทีมงานจะเข้าดำเนินการทำเควสเกาะทั้งหมดและปลดล็อกหมัด Combat V2 ให้ครบถ้วน ปลอดภัย 100% ปิด 2-Step ชั่วคราวเพื่อความรวดเร็ว
                  </div>
                </div>
              )}

              {/* Mastery Service Target Info Banner */}
              {hasMasteryItem && (
                <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5 text-[11px] text-amber-200 leading-relaxed">
                  <span className="text-sm">🥊</span>
                  <div>
                    <strong className="text-amber-300 font-bold">บริการฟาร์มมาสเตอร์รี่:</strong> ทีมงานจะเข้าดำเนินการฟาร์มมาสเตอร์รี่ตามประเภทที่ท่านเลือกไว้ (ผล / หมัด / ปืน) อย่างแม่นยำ
                  </div>
                </div>
              )}

              {/* Bounty Hunting Service Banner */}
              {hasBountyItem && (
                <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-2.5 text-[11px] text-amber-200 leading-relaxed shadow-lg shadow-amber-950/20">
                  <span className="text-base">🏴‍☠️</span>
                  <div>
                    <strong className="text-amber-300 font-bold">บริการล่าค่าหัว Blox Fruits:</strong> ทีมงานมืออาชีพจะเข้าดำเนินการฟาร์มค่าหัวตามระดับที่ท่านเลือก (10M / 20M / 30M) อย่างปลอดภัย 100% ไม่ใช้โปรแกรมเสี่ยงแบน ตรวจสอบคิวงานและความคืบหน้าได้ในประวัติการสั่งซื้อ
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Service Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-200 flex items-center gap-1">
                    ไอดี Roblox (Username) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น RobloxGamer123"
                    value={serviceAccountUsername || robloxUsername}
                    onChange={(e) => {
                      setServiceAccountUsername(e.target.value);
                      if (!robloxUsername) setRobloxUsername(e.target.value);
                    }}
                    className="w-full bg-[#0B0B14] border border-[#2D2D44] focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                    required
                  />
                  <p className="text-[10px] text-zinc-400">ไอดี Roblox ที่ต้องการให้ทีมงานเข้าฟาร์ม</p>
                </div>

                {/* Service Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-200 flex items-center gap-1">
                    รหัสผ่าน Roblox (Password) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="กรอกรหัสผ่านบัญชี Roblox"
                      value={serviceAccountPassword}
                      onChange={(e) => setServiceAccountPassword(e.target.value)}
                      className="w-full bg-[#0B0B14] border border-[#2D2D44] focus:border-purple-500 rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1 cursor-pointer"
                      title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400">ส่งตรงถึงแอดมิน ปลอดภัย 100%</p>
                </div>
              </div>
            </div>
          )}

          {/* Standard Roblox Info Form */}
          <div className="p-4 sm:p-6 rounded-3xl bg-[#11111A] border border-[#212133] space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#212133]">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">ข้อมูลตัวละคร Roblox ผู้รับ</h3>
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
                onChange={(e) => {
                  setRobloxUsername(e.target.value);
                  if (hasServiceItems && !serviceAccountUsername) {
                    setServiceAccountUsername(e.target.value);
                  }
                }}
                className="w-full bg-[#0B0B12] border border-[#262638] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
              <p className="text-[11px] text-zinc-400">
                {hasServiceItems 
                  ? '* ใช้สำหรับระบุตัวตนในระบบและยืนยันออเดอร์'
                  : '* บอทและทีมงานจะส่งผลปีศาจผ่านระบบ Trade ใน Private VIP Server ให้กับชื่อนี้'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                หมายเหตุเพิ่มเติมถึงทางร้าน / แอดมิน (ถ้ามี)
              </label>
              <textarea
                rows={2}
                placeholder="เช่น ระบุสิ่งที่ต้องการฟาร์มมาส (ผล Kitsune, ดาบ CDK, หมัด Godhuman), ขอรับบริการช่วง 18:00 น., หรือรายละเอียดที่ต้องการกำชับ"
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
              {hasServiceItems ? 'ระบบบริการฟาร์มปลอดภัย 100%' : 'ระบบส่งมอบสินค้าอัตโนมัติ (Digital Delivery)'}
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px] sm:text-xs">
              {hasServiceItems
                ? 'เมื่อกดชำระเงินสำเร็จ ข้อมูลไอดีและรหัสผ่านจะถูกส่งตรงไปยังแอดมินในระบบหลังบ้าน เพื่อเริ่มดำเนินการฟาร์มทันทีตามคิว คุณสามารถตรวจสอบสถานะได้ที่เมนู "คลังสินค้า"'
                : 'เมื่อกดชำระเงินสำเร็จ ไอเทมจะปรากฏในเมนู "คลังสินค้า (Inventory)" ของท่านทันที พร้อมลิงก์เข้าร่วมเซิร์ฟเวอร์ VIP Trade ในเกมอย่างปลอดภัย 100%'}
            </p>
          </div>

        </div>

        {/* Right: Order Summary & Wallet Balance check */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="p-4 sm:p-6 rounded-3xl bg-[#11111A] border border-[#212133] space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-white pb-3 border-b border-[#212133] flex items-center justify-between">
              <span>สรุปคำสั่งซื้อ ({items.length} รายการ)</span>
              {hasServiceItems && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  มีบริการฟาร์ม
                </span>
              )}
            </h3>

            {/* Items list */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 divide-y divide-[#1A1A28]">
              {items.map((it) => (
                <div key={it.cartItemId || it.productId} className="pt-2 first:pt-0 flex items-center justify-between gap-2.5 text-xs">
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
                      <div className="flex items-center gap-1.5 truncate">
                        <h5 className="font-semibold text-white truncate text-xs">{it.name}</h5>
                        {it.selectedOption && (
                          <span className="shrink-0 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            {it.selectedOption}
                          </span>
                        )}
                      </div>
                      <span className="text-zinc-500 text-[10px]">
                        {it.name.includes('เงินม่วง') || it.name.includes('Fragment')
                          ? `${(Number(it.quantity) * 10).toLocaleString()}k Fragments (${it.quantity} ชุด)`
                          : it.name.includes('เงินเขียว') || it.name.includes('Beli') 
                          ? `${it.quantity}M (${(Number(it.quantity) * 1000000).toLocaleString()} Beli)`
                          : it.name.includes('เลเวล') || it.name.includes('Level')
                          ? `${(Number(it.quantity) * 100).toLocaleString()} เลเวล (${it.quantity} ชุด)`
                          : it.name.includes('มาสเตอร์') || it.name.includes('มาส') || it.name.includes('Mastery')
                          ? `${(Number(it.quantity) * 100).toLocaleString()} มาสเตอร์รี่ (${it.quantity} ชุด)`
                          : `x${it.quantity}`}
                      </span>
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
                <span className="text-purple-400 font-black">฿{payableTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Wallet Balance Verification Box */}
            <div className={`p-3.5 sm:p-4 rounded-2xl border transition-colors ${
              isBalanceSufficient 
                ? 'bg-[#151224] border-purple-500/30' 
                : 'bg-rose-950/20 border-rose-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className={`w-4 h-4 ${isBalanceSufficient ? 'text-purple-400' : 'text-rose-400'}`} />
                  <span className="text-xs font-bold text-zinc-200">ยอดเงินในกระเป๋าของคุณ</span>
                </div>
                <span className={`text-xs font-bold ${isBalanceSufficient ? 'text-purple-300' : 'text-rose-300'}`}>
                  ฿{(currentBalance || 0).toLocaleString()}
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                {isBalanceSufficient ? (
                  <>
                    <span className="text-zinc-400">ยอดคงเหลือหลังชำระ:</span>
                    <span className="text-emerald-400 font-bold">฿{remainingBalance.toLocaleString()}</span>
                  </>
                ) : (
                  <>
                    <span className="text-rose-400 font-medium">ขาดอีก ฿{(payableTotal - currentBalance).toLocaleString()}</span>
                    <button
                      onClick={() => onNavigate('wallet')}
                      className="text-purple-400 hover:text-purple-300 font-bold underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> เติมเงินทันที
                    </button>
                  </>
                )}
              </div>
            </div>

            {checkoutError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleConfirmOrder}
              disabled={isSubmitting || !isBalanceSufficient}
              className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                isBalanceSufficient && !isSubmitting
                  ? 'bg-gradient-to-r from-[#7C3AED] via-purple-600 to-[#A855F7] hover:brightness-110 text-white shadow-purple-600/30 active:scale-98'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังดำเนินการสั่งซื้อ...</span>
                </>
              ) : isBalanceSufficient ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ยืนยันชำระเงิน ฿{payableTotal.toLocaleString()}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>ยอดเงินไม่พอ (เติมเงินก่อนทำรายการ)</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-zinc-500 leading-relaxed">
              การกดยืนยันชำระเงินถือว่าท่านยอมรับข้อตกลงและนโยบายการให้บริการของทางร้าน AngusShop
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CheckoutView;
