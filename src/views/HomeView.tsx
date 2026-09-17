import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  ShoppingBag, 
  Wallet, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Star, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  HelpCircle, 
  Gamepad2 
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, HomeConfig } from '../types';
import { ProductCard } from '../components/ProductCard';
import { BloxImage } from '../components/BloxImage';
import { DEFAULT_HOME_CONFIG } from '../data/bloxPresets';

interface HomeViewProps {
  products: Product[];
  onNavigate: (view: string, param?: string) => void;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
  products, 
  onNavigate, 
  onSelectProduct, 
  onBuyNow 
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(DEFAULT_HOME_CONFIG);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'homeConfig'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as HomeConfig;
        setHomeConfig({
          ...DEFAULT_HOME_CONFIG,
          ...data,
          trendingItems: data.trendingItems?.length ? data.trendingItems : DEFAULT_HOME_CONFIG.trendingItems,
          promoCard1: data.promoCard1 || DEFAULT_HOME_CONFIG.promoCard1,
          promoCard2: data.promoCard2 || DEFAULT_HOME_CONFIG.promoCard2,
        });
      }
    }, (err) => {
      console.warn('HomeConfig listener error:', err);
    });

    return () => unsub();
  }, []);

  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 4);
  const bestSellers = products.filter(p => p.isBestSeller).slice(0, 4);

  const configCategories = homeConfig.categoryCards || DEFAULT_HOME_CONFIG.categoryCards || [];

  const steps = [
    { num: '01', title: 'เลือกสินค้า', desc: 'ค้นหาผลปีศาจหรือ Gamepass ที่ต้องการในร้านค้า' },
    { num: '02', title: 'เติมเงิน Wallet', desc: 'สแกน QR PromptPay ตรวจสลิปอัตโนมัติใน 3 วินาที' },
    { num: '03', title: 'สั่งซื้อสินค้า', desc: 'กรอกชื่อ Roblox กดซื้อ หักยอดเงินทันที' },
    { num: '04', title: 'รับสินค้าทันที', desc: 'เข้าเซิร์ฟเวอร์ VIP เทรดรับผลปีศาจกับบอท 100%' },
  ];

  const reviews = [
    { name: 'Nonthaphon K.', rating: 5, time: '10 นาทีที่แล้ว', comment: 'สั่งผลคิตสึเนะถาวร ได้รับของไวมาก บอทเทรดให้ในเซิร์ฟ VIP สะดวกสุดๆ แนะนำเลยครับ' },
    { name: 'Thanakorn R.', rating: 5, time: '1 ชั่วโมงที่แล้ว', comment: 'ระบบเติมเงินสลิปโอเคเร็วมาก โอนปุ๊บ สลิปผ่าน ยอดเข้าทันที 500 บาท สั่งดาบโยรุเรียบร้อย' },
    { name: 'Siravit B.', rating: 5, time: '3 ชั่วโมงที่แล้ว', comment: 'บริการอเวค V4 ดีมากครับ แอดมินตอบไว เผ่ามิ้งค์ดึงคันโยกให้เสร็จสรรพ ไว้มาอุดหนุนใหม่' },
  ];

  const faqs = [
    { 
      q: 'ได้รับผลปีศาจได้อย่างไร?', 
      a: 'หลังจากทำการสั่งซื้อสำเร็จ ให้ไปที่เมนู "คลังสินค้า" จะมีปุ่ม "เข้าเซิร์ฟเวอร์ VIP" เพื่อเปิดเกม Blox Fruits และทำการ Trade ผลปีศาจกับบอทหรือทีมงานของร้านได้ทันที' 
    },
    { 
      q: 'ระบบเติมเงิน PromptPay ตรวจสอบสลิปอย่างไร?', 
      a: 'ร้านเราใช้ระบบ SlipOK API ตรวจสอบสลิปผ่านทางเซิร์ฟเวอร์ทันที โดยตรวจทั้งยอดเงิน ผู้รับเงิน (นาย กฤติน สุโขพล) และรหัสอ้างอิงธุรกรรมเพื่อความถูกต้องและปลอดภัยสูงสุด' 
    },
    { 
      q: 'ปลอดภัยหรือไม่ จะโดนแบนหรือเปล่า?', 
      a: 'ผลปีศาจและไอเทมทั้งหมดของ AngusShop เป็นของแท้ 100% เทรดผ่านระบบในเกม Blox Fruits อย่างถูกต้อง ไม่มีการใช้โปรแกรมโกง ปลอดภัยต่อบัญชี Roblox ของท่าน 100%' 
    },
    { 
      q: 'หากมีปัญหาในการสั่งซื้อหรือรับของติดต่อใคร?', 
      a: 'ท่านสามารถติดต่อทีมงานแอดมินผ่านทาง Discord Community หรือทางหน้าซัพพอร์ต มีแอดมินดูแลช่วยเหลือตลอด 24 ชั่วโมง' 
    }
  ];

  return (
    <div className="space-y-12 sm:space-y-20 pb-6">
      
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-12 pb-10 sm:pb-16 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] sm:w-[800px] h-[250px] sm:h-[400px] bg-purple-600/20 blur-[100px] sm:blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-28 right-4 sm:right-16 w-[200px] sm:w-[350px] h-[200px] sm:h-[350px] bg-indigo-600/15 blur-[90px] rounded-full pointer-events-none" />
        <div className="absolute top-40 left-4 sm:left-16 w-[180px] sm:w-[300px] h-[180px] sm:h-[300px] bg-cyan-600/15 blur-[80px] rounded-full pointer-events-none" />

        <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Roblox & Blox Fruits Verified Header Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-950/80 via-[#161226] to-indigo-950/80 border border-purple-500/40 text-purple-200 text-[11px] sm:text-xs font-semibold mb-5 shadow-xl shadow-purple-950/60 backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-cyan-400 uppercase tracking-wider">{homeConfig.heroBadgeText || 'ROBLOX VERIFIED'}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-300">{homeConfig.heroStatusText || 'ร้านผลปีศาจ Blox Fruits อัตโนมัติ 24 ชม.'}</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-rapper tracking-normal text-white max-w-5xl mx-auto leading-tight sm:leading-none drop-shadow-2xl">
            {homeConfig.heroTitle ? (
              homeConfig.heroTitle.includes('SHOP') ? (
                <>
                  {homeConfig.heroTitle.split('SHOP')[0]}<span className="animate-rgb-text drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">SHOP</span>{homeConfig.heroTitle.split('SHOP')[1]}
                </>
              ) : homeConfig.heroTitle
            ) : (
              <>
                ANGUS<span className="animate-rgb-text drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">SHOP</span>
              </>
            )}
          </h1>

          <p className="mt-3 sm:mt-5 text-sm sm:text-xl md:text-2xl font-medium text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            {homeConfig.heroSubtitle || 'ศูนย์รวมผลปีศาจ ถาวร, Gamepass และบริการฟาร์ม Roblox ส่งมอบทันที'}
          </p>

          {/* Blox Fruits Fast Showcase Ribbon */}
          <div className="mt-6 sm:mt-8 max-w-3xl mx-auto p-2 sm:p-3 rounded-2xl sm:rounded-3xl bg-[#0E0E18]/80 border border-purple-500/20 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 mb-2 text-left">
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-zinc-300">
                <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                <span>{homeConfig.trendingTitle || 'ผลปีศาจยอดนิยมประจำสัปดาห์ (ยอดสั่งซื้อสูงสุด)'}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {homeConfig.trendingBadge || 'VIP Server พร้อมเทรด'}
              </span>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {homeConfig.trendingItems.map((fruit) => (
                <div
                  key={fruit.id || fruit.name}
                  onClick={() => onNavigate('shop', fruit.th || fruit.name)}
                  className="group p-2 rounded-xl bg-[#141422] hover:bg-purple-900/30 border border-white/5 hover:border-purple-500/60 transition-all duration-200 cursor-pointer text-center flex flex-col items-center"
                >
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 mb-1">
                    <BloxImage
                      src={fruit.img}
                      alt={fruit.name}
                      productName={fruit.th || fruit.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_4px_10px_rgba(168,85,247,0.3)]"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-white group-hover:text-purple-300 truncate w-full">
                    {fruit.th}
                  </span>
                  <span className="text-[10px] font-black text-cyan-400">
                    {fruit.price}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="mt-8 sm:mt-9 grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-2.5 sm:gap-4 max-w-md mx-auto">
            <button
              id="hero-shop-btn"
              onClick={() => onNavigate('shop')}
              className="py-3 sm:py-3.5 px-4 sm:px-8 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{homeConfig.heroButtonText || 'เลือกซื้อผลปีศาจ'}</span>
            </button>

            <button
              id="hero-wallet-btn"
              onClick={() => onNavigate('wallet')}
              className="py-3 sm:py-3.5 px-4 sm:px-8 rounded-2xl bg-[#151522] hover:bg-[#1C1C2E] border border-purple-500/30 hover:border-purple-500/60 text-zinc-200 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 active:scale-95 shadow-lg"
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>เติมเงิน PromptPay</span>
            </button>
          </div>

          {/* Flow Stepper Highlight */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 text-[11px] sm:text-xs font-bold text-zinc-400 bg-[#11111A]/90 border border-[#212133] px-3.5 sm:px-5 py-2 rounded-2xl backdrop-blur-md">
            <span className="text-purple-300">1. เลือกสินค้า</span>
            <span className="text-zinc-600">→</span>
            <span className="text-purple-300">2. เติมเงิน</span>
            <span className="text-zinc-600">→</span>
            <span className="text-purple-300">3. สั่งซื้อ</span>
            <span className="text-zinc-600">→</span>
            <span className="text-emerald-400 flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> 4. รับของใน VIP
            </span>
          </div>

          {/* Stats Bar */}
          <div className="mt-8 sm:mt-12 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 max-w-4xl mx-auto">
            <div className="p-3 sm:p-4 rounded-2xl bg-[#11111A]/80 border border-[#212133] backdrop-blur-sm text-center">
              <div className="text-xl sm:text-3xl font-black text-white">10,000+</div>
              <div className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">{homeConfig.stat1Label || 'ลูกค้าไว้วางใจ'}</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-[#11111A]/80 border border-[#212133] backdrop-blur-sm text-center">
              <div className="text-xl sm:text-3xl font-black text-emerald-400">3 วินาที</div>
              <div className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">{homeConfig.stat2Label || 'สินค้าคุณภาพ'}</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-[#11111A]/80 border border-[#212133] backdrop-blur-sm text-center">
              <div className="text-xl sm:text-3xl font-black text-purple-400">100%</div>
              <div className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">{homeConfig.stat3Label || 'รับประกัน'}</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-[#11111A]/80 border border-[#212133] backdrop-blur-sm text-center">
              <div className="text-xl sm:text-3xl font-black text-amber-400">4.9/5</div>
              <div className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">{homeConfig.stat4Label || 'บริการ 24 ชม.'}</div>
            </div>
          </div>

        </div>
      </section>

      {/* Categories Section */}
      <section className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-5 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-white">{homeConfig.categoriesTitle || DEFAULT_HOME_CONFIG.categoriesTitle}</h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">{homeConfig.categoriesSubtitle || DEFAULT_HOME_CONFIG.categoriesSubtitle}</p>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer shrink-0"
          >
            ดูทั้งหมด <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
          {configCategories.map((cat, idx) => {
            const Icon = cat.iconName === 'Zap' ? Zap : cat.iconName === 'Sparkles' ? Sparkles : cat.iconName === 'ShieldCheck' ? ShieldCheck : Flame;
            return (
              <div
                key={idx}
                onClick={() => onNavigate('shop', cat.name)}
                className="p-4 sm:p-6 rounded-2xl bg-[#11111A] hover:bg-[#161624] border border-[#212133] hover:border-purple-500/50 transition-all duration-300 cursor-pointer group shadow-lg flex flex-col justify-between items-center text-center active:scale-[0.98]"
              >
                <div className="flex flex-col items-center w-full">
                  <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform overflow-hidden ${cat.iconType === 'image' && cat.imageUrl ? 'bg-transparent border-0 p-0' : 'bg-gradient-to-br text-purple-300 ' + cat.colorClass}`}>
                    {cat.iconType === 'image' && cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-contain rounded-2xl shadow-lg" />
                    ) : (
                      <Icon className="w-16 h-16 sm:w-20 sm:h-20" />
                    )}
                  </div>
                  <h3 className="text-base sm:text-xl font-black text-white group-hover:text-purple-300 transition-colors">{cat.name}</h3>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mt-1.5 sm:mt-2 leading-relaxed line-clamp-2 max-w-[90%]">{cat.desc}</p>
                </div>
                <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-semibold text-purple-400 bg-purple-500/10 px-4 py-2 rounded-xl w-full max-w-[120px] group-hover:bg-purple-500/20 transition-colors">
                  <span>เลือกชม</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-5 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-400 mb-0.5">
              <Sparkles className="w-3.5 h-3.5" /> สินค้าแนะนำพิเศษ
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white">Featured Products</h2>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer shrink-0"
          >
            ดูทั้งหมด <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-4 gap-3 sm:gap-6">
            {featuredProducts.map((p) => (
              <ProductCard
                key={p.productId}
                product={p}
                onSelect={onSelectProduct}
                onBuyNow={onBuyNow}
              />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center rounded-2xl bg-[#11111A] border border-[#212133] p-6 text-zinc-500 text-xs">
            กำลังอัปเดตรายการสินค้าใหม่ แอดมินสามารถเพิ่มสินค้าได้ที่หน้าแอดมิน
          </div>
        )}
      </section>

      {/* Promotion / Highlight Banner */}
      <section className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-6 sm:p-10 overflow-hidden bg-gradient-to-br from-[#1A102E] via-[#120D24] to-[#0A0814] border border-purple-500/30 shadow-2xl">
          {/* Background Radial Glow */}
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-purple-600/20 blur-[100px] pointer-events-none rounded-full" />
          <div className="absolute right-1/3 bottom-0 w-72 h-72 bg-cyan-600/15 blur-[90px] pointer-events-none rounded-full" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>{homeConfig.promoBadge || 'FAST & SECURE ROBLOX DELIVERY'}</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                {homeConfig.promoTitle || 'รับผลปีศาจและ Gamepass แท้ 100% ส่งมอบรวดเร็วใน 3 นาที'}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 mt-2.5 leading-relaxed max-w-xl">
                {homeConfig.promoDescription || 'ระบบส่งมอบอัตโนมัติ 24 ชั่วโมง เทรดรับไอเทมได้ทันทีในเซิร์ฟเวอร์ VIP ของ AngusShop การันตีปลอดภัย ไม่มีประวัติแบน รองรับชำระผ่าน PromptPay สแกนจ่ายตรวจสอบสลิปอัตโนมัติ'}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  id="promo-shop-now-btn"
                  onClick={() => onNavigate('shop')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{homeConfig.promoButtonText || 'ช้อปผลปีศาจตอนนี้เลย'}</span>
                </button>
                <button
                  id="promo-fruits-filter-btn"
                  onClick={() => onNavigate('shop', 'ผลปีศาจ')}
                  className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                >
                  {homeConfig.promoSecondaryButtonText || 'ดูเฉพาะผลปีศาจ'}
                </button>
              </div>
            </div>

            {/* Right Blox Fruits Visual Showcase */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="relative w-full max-w-sm grid grid-cols-2 gap-3 p-3 rounded-2xl bg-black/40 border border-purple-500/20 backdrop-blur-md">
                
                {/* Visual Fruit Card 1 */}
                <div 
                  onClick={() => onNavigate('shop', homeConfig.promoCard1?.keyword || homeConfig.promoCard1?.name || 'คิตสึเนะ')}
                  className="p-3 rounded-xl bg-gradient-to-b from-purple-950/60 to-black/60 border border-purple-500/30 flex flex-col items-center text-center cursor-pointer hover:border-purple-400 transition-all group"
                >
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-1">
                    <BloxImage 
                      src={homeConfig.promoCard1?.img || '/images/blox/kitsune.png'}
                      alt={homeConfig.promoCard1?.name || 'Kitsune Fruit'}
                      productName={homeConfig.promoCard1?.name || 'ผลคิตสึเนะ'}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_4px_12px_rgba(217,70,239,0.5)]"
                    />
                  </div>
                  <span className="text-xs font-black text-white group-hover:text-purple-300 truncate w-full">
                    {homeConfig.promoCard1?.name || 'ผลคิตสึเนะ'}
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-400">
                    {homeConfig.promoCard1?.tag || 'Mythical • ฿299'}
                  </span>
                </div>

                {/* Visual Fruit Card 2 */}
                <div 
                  onClick={() => onNavigate('shop', homeConfig.promoCard2?.keyword || homeConfig.promoCard2?.name || 'มังกร')}
                  className="p-3 rounded-xl bg-gradient-to-b from-purple-950/60 to-black/60 border border-purple-500/30 flex flex-col items-center text-center cursor-pointer hover:border-purple-400 transition-all group"
                >
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-1">
                    <BloxImage 
                      src={homeConfig.promoCard2?.img || '/images/blox/dragon.png'}
                      alt={homeConfig.promoCard2?.name || 'Dragon Fruit'}
                      productName={homeConfig.promoCard2?.name || 'ผลมังกร'}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_4px_12px_rgba(244,63,94,0.5)]"
                    />
                  </div>
                  <span className="text-xs font-black text-white group-hover:text-purple-300 truncate w-full">
                    {homeConfig.promoCard2?.name || 'ผลมังกร'}
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-400">
                    {homeConfig.promoCard2?.tag || 'Mythical • ฿249'}
                  </span>
                </div>

                {/* Bottom badge */}
                <div className="col-span-2 py-1.5 px-3 rounded-lg bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-[10px] text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{homeConfig.promoFooterText || 'มีผลสต็อกพร้อมส่งในเซิร์ฟ VIP'}</span>
                  </div>
                  <span className="text-cyan-400 font-bold">{homeConfig.promoFooterTag || '100% แท้'}</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-5 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-400 mb-0.5">
              <Flame className="w-3.5 h-3.5" /> สินค้าขายดีประจำสัปดาห์
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white">Best Sellers</h2>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer shrink-0"
          >
            ดูเพิ่มเติม <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {bestSellers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-4 gap-3 sm:gap-6">
            {bestSellers.map((p) => (
              <ProductCard
                key={p.productId}
                product={p}
                onSelect={onSelectProduct}
                onBuyNow={onBuyNow}
              />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center rounded-2xl bg-[#11111A] border border-[#212133] p-6 text-zinc-500 text-xs">
            กำลังอัปเดตรายการสินค้าขายดี แอดมินสามารถเพิ่มสินค้าได้ที่หน้าแอดมิน
          </div>
        )}
      </section>

      {/* How to Order Steps */}
      <section className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-3xl font-black text-white">ขั้นตอนการสั่งซื้อง่ายๆ 4 ขั้นตอน</h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">รับผลปีศาจและไอเทม Blox Fruits ได้ทันใจ ปลอดภัย 100%</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {steps.map((st) => (
            <div key={st.num} className="p-4 sm:p-6 rounded-2xl bg-[#11111A] border border-[#212133] relative flex flex-col justify-between">
              <div>
                <span className="text-2xl sm:text-4xl font-black text-purple-500/30">{st.num}</span>
                <h3 className="text-sm sm:text-base font-bold text-white mt-1 sm:mt-2">{st.title}</h3>
                <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 leading-relaxed">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews Section */}
      <section className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-3xl font-black text-white">เสียงตอบรับจากลูกค้าจริง</h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">ผู้เล่น Blox Fruits ไว้วางใจสั่งซื้อกับ AngusShop</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {reviews.map((rev, idx) => (
            <div key={idx} className="p-5 sm:p-6 rounded-2xl bg-[#11111A] border border-[#212133] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] text-zinc-500">{rev.time}</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed italic">
                "{rev.comment}"
              </p>
              <div className="pt-2 border-t border-[#1C1C2A] flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center">
                  {rev.name.charAt(0)}
                </div>
                <span className="text-xs font-bold text-white">{rev.name}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full ml-auto">
                  ซื้อจริง
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-10">
          <h2 className="text-xl sm:text-3xl font-black text-white">คำถามที่พบบ่อย (FAQ)</h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">ข้อสงสัยยอดนิยมเกี่ยวกับการซื้อขายผลปีศาจ</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openFaqIndex === i;
            return (
              <div 
                key={i} 
                className="rounded-2xl bg-[#11111A] border border-[#212133] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-3 cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-white">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-purple-400' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-[#1B1B2A] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
