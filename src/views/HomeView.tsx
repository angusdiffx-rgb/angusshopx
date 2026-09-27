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
  Gamepad2,
  Calculator,
  ArrowRightLeft,
  Music,
  Headphones,
  Monitor,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { BloxImage } from '../components/BloxImage';
import { DEFAULT_HOME_CONFIG } from '../data/bloxPresets';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useHomeConfig } from '../context/HomeConfigContext';
import { playClickSound, isSoundMuted } from '../lib/sound';
import { parseYoutubeUrl } from '../lib/youtube';

interface HomeViewProps {
  products: Product[];
  onNavigate: (view: string, param?: string) => void;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onOpenCalculator?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
  products, 
  onNavigate, 
  onSelectProduct, 
  onBuyNow,
  onOpenCalculator
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const { homeConfig } = useHomeConfig();
  const { isAdmin } = useAuth();
  const { error: toastError } = useToast();

  // Autoplay YouTube Player on load or first user interaction fallback (only in music mode)
  useEffect(() => {
    if ((homeConfig.desktopBannerType || 'music') !== 'music') return;
    if (homeConfig.desktopBannerAutoplay === false) return;

    const triggerPlay = () => {
      try {
        const iframe = document.getElementById('angus-youtube-player') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          if (isSoundMuted()) {
            iframe.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', '*');
          }
        }
      } catch (e) {
        // ignore
      }
    };

    const timer = setTimeout(triggerPlay, 1000);

    window.addEventListener('click', triggerPlay, { once: true });
    window.addEventListener('touchstart', triggerPlay, { once: true });
    window.addEventListener('keydown', triggerPlay, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', triggerPlay);
      window.removeEventListener('touchstart', triggerPlay);
      window.removeEventListener('keydown', triggerPlay);
    };
  }, [homeConfig.desktopBannerType, homeConfig.desktopBannerAutoplay, homeConfig.desktopBannerYoutubeUrl]);

  const handleAdminOnlyClick = () => {
    if (!isAdmin) {
      toastError('เฉพาะแอดมินเท่านั้น', 'คุณไม่มีสิทธิ์กดปุ่มนี้ เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถกดได้');
      return;
    }
    onNavigate('shop');
  };

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
      a: 'หลังจากทำการสั่งซื้อสำเร็จ ให้ไปที่เมนู "คลังสินค้า" จะมีปุ่ม "ลิงค์รับของ" เพื่อเปิดเกม Blox Fruits และทำการ Trade ผลปีศาจกับบอทหรือทีมงานของร้านได้ทันที' 
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
    <div className="space-y-10 sm:space-y-20 pb-6 w-full max-w-[100vw] overflow-x-hidden [overscroll-behavior-x:none] [touch-action:pan-y_pinch-zoom]">
      
      {/* Hero Section */}
      <section className="relative pt-5 sm:pt-10 pb-8 sm:pb-16 overflow-hidden w-full max-w-[100vw]">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[320px] sm:w-[800px] h-[220px] sm:h-[400px] bg-purple-600/20 blur-[100px] sm:blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-28 right-4 sm:right-16 w-[180px] sm:w-[350px] h-[180px] sm:h-[350px] bg-indigo-600/15 blur-[90px] rounded-full pointer-events-none" />
        <div className="absolute top-40 left-4 sm:left-16 w-[160px] sm:w-[300px] h-[160px] sm:h-[300px] bg-cyan-600/15 blur-[80px] rounded-full pointer-events-none" />

        <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Roblox & Blox Fruits Verified Header Pill */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-950/80 via-[#161226] to-indigo-950/80 border border-purple-500/40 text-purple-200 text-[10px] sm:text-xs font-semibold mb-4 sm:mb-5 shadow-xl shadow-purple-950/60 backdrop-blur-md max-w-full overflow-hidden">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-cyan-400 uppercase tracking-wider shrink-0">{homeConfig.heroBadgeText || 'ROBLOX VERIFIED'}</span>
            <span className="text-zinc-600 shrink-0">•</span>
            <span className="text-zinc-300 truncate">{homeConfig.heroStatusText || 'ร้านผลปีศาจ Blox Fruits อัตโนมัติ 24 ชม.'}</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-rapper tracking-normal text-white max-w-5xl mx-auto leading-tight sm:leading-none drop-shadow-2xl px-1 break-words">
            {homeConfig.heroTitle ? (
              homeConfig.heroTitle.includes('SHOP') ? (
                <>
                  <span className="text-white">{homeConfig.heroTitle.split('SHOP')[0]}</span>
                  <span className="bg-gradient-to-r from-[#A855F7] via-[#C084FC] to-[#8B5CF6] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(168,85,247,0.5)]">
                    SHOP
                  </span>
                  <span className="text-white">{homeConfig.heroTitle.split('SHOP')[1]}</span>
                </>
              ) : (
                <span className="bg-gradient-to-r from-[#A855F7] via-[#C084FC] to-[#8B5CF6] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(168,85,247,0.5)]">
                  {homeConfig.heroTitle}
                </span>
              )
            ) : (
              <>
                <span className="text-white">ANGUS</span>
                <span className="bg-gradient-to-r from-[#A855F7] via-[#C084FC] to-[#8B5CF6] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(168,85,247,0.5)]">
                  SHOP
                </span>
              </>
            )}
          </h1>

          <p className="mt-2.5 sm:mt-5 text-xs sm:text-xl md:text-2xl font-medium text-[#B8AEC9] max-w-2xl mx-auto leading-relaxed px-2">
            {homeConfig.heroSubtitle || 'ศูนย์รวมผลปีศาจ ถาวร, Gamepass และบริการฟาร์ม Roblox ส่งมอบทันที'}
          </p>

          {/* Blox Fruits Fast Showcase Ribbon (ตารางผลยอดนิยม) */}
          <div className="mt-5 sm:mt-8 max-w-3xl mx-auto p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl bg-[rgba(255,255,255,0.04)] border border-[rgba(168,85,247,0.18)] backdrop-blur-[18px] shadow-[0_8px_32px_rgba(7,5,15,0.6)] w-full max-w-full overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-2.5 sm:px-3 py-1.5 border-b border-purple-500/15 mb-2 text-left min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-zinc-300 min-w-0 truncate">
                <Gamepad2 className="w-3.5 h-3.5 text-[#C084FC] shrink-0" />
                <span className="truncate">{homeConfig.trendingTitle || 'ผลปีศาจยอดนิยมประจำสัปดาห์'}</span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap shrink-0">
                {homeConfig.trendingBadge || 'VIP พร้อมเทรด'}
              </span>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2 w-full max-w-full">
              {homeConfig.trendingItems.map((fruit) => (
                <div
                  key={fruit.id || fruit.name}
                  onClick={() => onNavigate('shop', 'ผลปีศาจ')}
                  className="group p-1.5 sm:p-2.5 rounded-xl bg-[#0F0A1A]/80 hover:bg-[#1A102E] border border-[rgba(168,85,247,0.15)] hover:border-[rgba(192,132,252,0.50)] hover:shadow-[0_0_15px_rgba(168,85,247,0.25)] transition-all duration-300 cursor-pointer text-center flex flex-col items-center min-w-0 overflow-hidden active:scale-95"
                >
                  <div className="relative w-11 h-11 sm:w-14 sm:h-14 mb-1 shrink-0">
                    <BloxImage
                      src={fruit.img}
                      alt={fruit.name}
                      productName={fruit.th || fruit.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_4px_10px_rgba(168,85,247,0.35)]"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-white group-hover:text-[#C084FC] truncate w-full block">
                    {fruit.th}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-black text-cyan-400 tabular-nums truncate w-full block">
                    {fruit.price}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="mt-6 sm:mt-9 grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-2.5 sm:gap-4 max-w-md mx-auto w-full">
            <button
              id="hero-shop-btn"
              onClick={() => onNavigate('shop')}
              className="py-3 sm:py-3.5 px-4 sm:px-8 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#C084FC] text-white font-black text-xs sm:text-sm shadow-[0_4px_25px_rgba(139,92,246,0.45),0_0_30px_rgba(168,85,247,0.35)] hover:shadow-[0_6px_30px_rgba(168,85,247,0.65),0_0_40px_rgba(192,132,252,0.50)] flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-all duration-300 active:scale-95 hover:-translate-y-0.5"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span className="truncate">{homeConfig.heroButtonText || 'เลือกซื้อผลปีศาจ'}</span>
            </button>

            <button
              id="hero-wallet-btn"
              onClick={() => onNavigate('wallet')}
              className="py-3 sm:py-3.5 px-4 sm:px-8 rounded-xl sm:rounded-2xl bg-[#0F0A1A]/85 hover:bg-[#1A102E] border border-[rgba(168,85,247,0.25)] hover:border-[rgba(192,132,252,0.55)] text-[#E9D5FF] hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-all duration-300 active:scale-95 shadow-sm hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] hover:-translate-y-0.5"
            >
              <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">เติมเงิน PromptPay</span>
            </button>
          </div>

          {/* Quick Feature Tools Bar */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto w-full">
            <button
              onClick={() => {
                playClickSound();
                if (onOpenCalculator) onOpenCalculator();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#0F0A1A]/80 hover:bg-[#1A102E] border border-[rgba(168,85,247,0.25)] hover:border-[#C084FC]/50 text-purple-200 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm hover:shadow-[0_0_15px_rgba(168,85,247,0.25)]"
            >
              <Calculator className="w-3.5 h-3.5 text-[#C084FC]" />
              <span>คำนวณ Trade Value (W/F/L)</span>
            </button>
          </div>

          {/* Flow Stepper Highlight */}
          <div className="mt-5 sm:mt-6 inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs font-bold text-[#B8AEC9] bg-[rgba(255,255,255,0.04)] border border-[rgba(168,85,247,0.18)] px-3 sm:px-5 py-2 rounded-2xl backdrop-blur-[18px] max-w-full shadow-sm">
            <span className="text-[#C084FC]">1. เลือกสินค้า</span>
            <span className="text-zinc-600">→</span>
            <span className="text-[#C084FC]">2. เติมเงิน</span>
            <span className="text-zinc-600">→</span>
            <span className="text-[#C084FC]">3. สั่งซื้อ</span>
            <span className="text-zinc-600">→</span>
            <span className="text-emerald-400 flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> 4. รับของใน VIP
            </span>
          </div>

          {/* Stats Bar (แถบสถิติความปลอดภัย & ความน่าเชื่อถือ) */}
          <div className="mt-7 sm:mt-12 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 max-w-4xl mx-auto w-full">
            <div className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-[rgba(255,255,255,0.04)] border border-[rgba(168,85,247,0.18)] hover:border-[rgba(192,132,252,0.45)] backdrop-blur-[18px] text-center shadow-[0_8px_32px_rgba(7,5,15,0.6)] hover:shadow-[0_12px_35px_rgba(139,92,246,0.25)] transition-all min-w-0 overflow-hidden">
              <div className="text-lg sm:text-3xl font-black bg-gradient-to-r from-white via-purple-100 to-[#C084FC] bg-clip-text text-transparent tabular-nums">10,000+</div>
              <div className="text-[10px] sm:text-xs text-[#B8AEC9] mt-0.5 truncate">{homeConfig.stat1Label || 'ลูกค้าไว้วางใจ'}</div>
            </div>
            <div className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-[rgba(255,255,255,0.04)] border border-[rgba(168,85,247,0.18)] hover:border-[rgba(192,132,252,0.45)] backdrop-blur-[18px] text-center shadow-[0_8px_32px_rgba(7,5,15,0.6)] hover:shadow-[0_12px_35px_rgba(139,92,246,0.25)] transition-all min-w-0 overflow-hidden">
              <div className="text-lg sm:text-3xl font-black text-emerald-400 tabular-nums">3 วินาที</div>
              <div className="text-[10px] sm:text-xs text-[#B8AEC9] mt-0.5 truncate">{homeConfig.stat2Label || 'ตรวจสลิปอัตโนมัติ'}</div>
            </div>
            <div className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-[rgba(255,255,255,0.04)] border border-[rgba(168,85,247,0.18)] hover:border-[rgba(192,132,252,0.45)] backdrop-blur-[18px] text-center shadow-[0_8px_32px_rgba(7,5,15,0.6)] hover:shadow-[0_12px_35px_rgba(139,92,246,0.25)] transition-all min-w-0 overflow-hidden">
              <div className="text-lg sm:text-3xl font-black text-[#C084FC] drop-shadow-[0_0_12px_rgba(192,132,252,0.5)] tabular-nums">100%</div>
              <div className="text-[10px] sm:text-xs text-[#B8AEC9] mt-0.5 truncate">{homeConfig.stat3Label || 'ของแท้ปลอดภัย'}</div>
            </div>
            <div className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-[rgba(255,255,255,0.04)] border border-[rgba(168,85,247,0.18)] hover:border-[rgba(192,132,252,0.45)] backdrop-blur-[18px] text-center shadow-[0_8px_32px_rgba(7,5,15,0.6)] hover:shadow-[0_12px_35px_rgba(139,92,246,0.25)] transition-all min-w-0 overflow-hidden">
              <div className="text-lg sm:text-3xl font-black text-amber-400 tabular-nums">4.9/5</div>
              <div className="text-[10px] sm:text-xs text-[#B8AEC9] mt-0.5 truncate">{homeConfig.stat4Label || 'คะแนนรีวิวผู้เล่น'}</div>
            </div>
          </div>

        </div>
      </section>

      {/* Official Media & Music/Image Banner (รองรับทั้งมือถือและคอมพิวเตอร์) */}
      <section className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-5 sm:p-6 lg:p-8 overflow-hidden bg-gradient-to-br from-[#160E2A] via-[#0E0B1A] to-[#0A0D1E] border border-purple-500/35 shadow-2xl">
          {/* Ambient Glows */}
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-purple-600/20 blur-[100px] pointer-events-none rounded-full" />
          <div className="absolute right-10 bottom-0 w-80 h-80 bg-cyan-600/15 blur-[100px] pointer-events-none rounded-full" />

          {(() => {
            const isMusicBanner = (homeConfig.desktopBannerType || 'music') === 'music';
            const parsedYoutube = parseYoutubeUrl(
              homeConfig.desktopBannerYoutubeUrl,
              homeConfig.desktopBannerStartTime,
              homeConfig.desktopBannerAutoplay !== false
            );

            return (
              <div className="relative z-10 grid grid-cols-12 gap-6 lg:gap-8 items-center">
                {/* Left Column: Info & Music / Banner Details */}
                <div className="col-span-12 lg:col-span-5 space-y-3 sm:space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/35 text-purple-300 text-xs font-bold uppercase tracking-wider">
                      {isMusicBanner ? (
                        <Music className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>
                        {homeConfig.desktopBannerBadge || (isMusicBanner ? 'ANGUSSHOP OFFICIAL SOUND' : 'ANGUSSHOP SPECIAL BANNER')}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>{homeConfig.desktopBannerTag || (isMusicBanner ? 'เล่นต่อเนื่องทุกหน้า' : 'โปรโมชั่นพิเศษ')}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                      {homeConfig.desktopBannerTitle || (isMusicBanner ? 'เปิดเพลงฟังชิลๆ ระหว่างช้อปปิ้งผลปีศาจ' : 'โปรโมชั่นพิเศษ Blox Fruits')}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed">
                      {homeConfig.desktopBannerSubtitle || (isMusicBanner 
                        ? `สัมผัสประสบการณ์เสียงเพลงสุดมันส์ธีม Blox Fruits เริ่มต้นที่วินาทีที่ ${parsedYoutube.startTime} พร้อมเทรดและสั่งซื้อไอเทมได้เพลิดเพลินไม่มีสะดุด เพลงจะเล่นต่อเนื่องแม้กดเข้าร้านค้าหรือหน้าอื่นๆ` 
                        : 'รับผลปีศาจและ Gamepass แท้ 100% ส่งมอบรวดเร็วใน 3 นาที เทรดรับไอเทมได้ทันทีในเซิร์ฟเวอร์ VIP ของ AngusShop')}
                    </p>
                  </div>

                  {/* Sound Wave Animation Visualizer (Only in Music Mode) */}
                  {isMusicBanner ? (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-purple-500/20 backdrop-blur-md">
                      <div className="flex items-end gap-1 h-6">
                        <span className="w-1 bg-purple-500 rounded-full animate-bounce [animation-delay:0.1s] h-5" />
                        <span className="w-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.3s] h-3" />
                        <span className="w-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s] h-6" />
                        <span className="w-1 bg-pink-500 rounded-full animate-bounce [animation-delay:0.4s] h-4" />
                        <span className="w-1 bg-purple-400 rounded-full animate-bounce [animation-delay:0.15s] h-6" />
                      </div>
                      <div className="text-xs">
                        <div className="text-white font-bold flex items-center gap-1.5">
                          <Headphones className="w-3.5 h-3.5 text-purple-400" />
                          <span>{homeConfig.desktopBannerSoundtrackTitle || 'Official Soundtrack & Beat'}</span>
                        </div>
                        <div className="text-zinc-400 text-[11px]">
                          {homeConfig.desktopBannerSoundtrackDetail || `Timestamp: ${parsedYoutube.startTime}s • High Quality Stereo`}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-emerald-500/20 backdrop-blur-md">
                      <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div className="text-xs">
                        <div className="text-white font-bold">{homeConfig.desktopBannerSoundtrackTitle || 'แบนเนอร์ทางการ AngusShop'}</div>
                        <div className="text-zinc-400 text-[11px]">{homeConfig.desktopBannerSoundtrackDetail || 'อัปเดตแบบเรียลไทม์จากระบบแอดมิน'}</div>
                      </div>
                    </div>
                  )}

                  {/* Quick Action */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const target = homeConfig.desktopBannerButtonLink || 'shop';
                        if (target.startsWith('http://') || target.startsWith('https://')) {
                          window.open(target, '_blank');
                        } else {
                          onNavigate(target);
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{homeConfig.desktopBannerButtonText || 'เลือกซื้อสินค้าในร้าน'}</span>
                    </button>

                    <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span>
                        {homeConfig.desktopBannerFooterNote || (
                          isMusicBanner 
                            ? (homeConfig.desktopBannerAutoplay !== false ? 'ระบบเล่นเพลงอัตโนมัติ (Autoplay On)' : 'กด Play เพื่อฟังเพลง')
                            : 'โปรโมชั่นพิเศษพร้อมให้บริการ'
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Embedded YouTube Video Player OR Image Banner */}
                <div className="col-span-12 lg:col-span-7 flex justify-center lg:justify-end">
                  <div className="relative rounded-2xl p-2 bg-[#120F24]/80 border-2 border-purple-500/40 shadow-[0_0_35px_rgba(168,85,247,0.25)] hover:border-purple-400/80 transition-all duration-300 w-full max-w-[560px]">
                    {isMusicBanner ? (
                      <iframe 
                        id="angus-youtube-player"
                        width="560" 
                        height="315" 
                        src={parsedYoutube.embedUrl} 
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        referrerPolicy="strict-origin-when-cross-origin" 
                        allowFullScreen
                        className="w-full max-w-[560px] aspect-video rounded-xl shadow-2xl bg-black"
                      />
                    ) : (
                      homeConfig.desktopBannerImageUrl ? (
                        homeConfig.desktopBannerImageLink ? (
                          <a href={homeConfig.desktopBannerImageLink} target="_blank" rel="noreferrer" className="block group">
                            <img 
                              src={homeConfig.desktopBannerImageUrl} 
                              alt={homeConfig.desktopBannerTitle || 'Banner'} 
                              className="w-full max-w-[560px] aspect-video object-cover rounded-xl shadow-2xl group-hover:scale-[1.01] transition-transform duration-300"
                            />
                          </a>
                        ) : (
                          <img 
                            src={homeConfig.desktopBannerImageUrl} 
                            alt={homeConfig.desktopBannerTitle || 'Banner'} 
                            className="w-full max-w-[560px] aspect-video object-cover rounded-xl shadow-2xl"
                          />
                        )
                      ) : (
                        <div className="w-full max-w-[560px] aspect-video rounded-xl bg-gradient-to-br from-purple-950/40 via-black to-indigo-950/40 border border-purple-500/20 flex flex-col items-center justify-center p-6 text-center">
                          <ImageIcon className="w-12 h-12 text-purple-400/50 mb-2" />
                          <span className="text-sm font-bold text-white">แบนเนอร์รูปภาพ AngusShop</span>
                          <span className="text-xs text-zinc-400 mt-1">แอดมินสามารถอัปโหลดรูปภาพได้ในหน้าแผงควบคุม</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Categories Section */}
      <section className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-4 sm:mb-8">
          <div>
            <h2 className="text-lg sm:text-3xl font-black text-white">{homeConfig.categoriesTitle || DEFAULT_HOME_CONFIG.categoriesTitle}</h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">{homeConfig.categoriesSubtitle || DEFAULT_HOME_CONFIG.categoriesSubtitle}</p>
          </div>
          <button
            onClick={handleAdminOnlyClick}
            className={`text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-all ${
              isAdmin 
                ? 'text-purple-400 hover:text-purple-300' 
                : 'text-zinc-500 hover:text-zinc-400'
            }`}
            title={isAdmin ? 'ดูทั้งหมด (สิทธิ์แอดมิน)' : 'เฉพาะแอดมินเท่านั้น'}
          >
            ดูทั้งหมด <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-5 w-full">
          {configCategories.map((cat, idx) => {
            const Icon = cat.iconName === 'Zap' ? Zap : cat.iconName === 'Sparkles' ? Sparkles : cat.iconName === 'ShieldCheck' ? ShieldCheck : Flame;
            return (
              <div
                key={idx}
                onClick={() => onNavigate('shop', cat.name)}
                className="p-3.5 sm:p-6 rounded-2xl bg-[#11111A] hover:bg-[#161624] border border-[#212133] hover:border-purple-500/50 transition-all duration-300 cursor-pointer group shadow-lg flex flex-col justify-between items-center text-center active:scale-[0.98] min-w-0 overflow-hidden"
              >
                <div className="flex flex-col items-center w-full min-w-0">
                  <div className={`w-24 h-24 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-2xl flex items-center justify-center mb-3 sm:mb-5 group-hover:scale-110 transition-transform overflow-hidden ${cat.iconType === 'image' && cat.imageUrl ? 'bg-transparent border-0 p-0' : 'bg-gradient-to-br text-purple-300 ' + cat.colorClass}`}>
                    {cat.iconType === 'image' && cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-contain rounded-2xl shadow-lg" />
                    ) : (
                      <Icon className="w-12 h-12 sm:w-20 sm:h-20" />
                    )}
                  </div>
                  <h3 className="text-sm sm:text-xl font-black text-white group-hover:text-purple-300 transition-colors truncate w-full">{cat.name}</h3>
                  <p className="text-[10px] sm:text-xs text-zinc-400 mt-1 sm:mt-2 leading-relaxed line-clamp-2 max-w-[95%]">{cat.desc}</p>
                </div>
                <div className="mt-3.5 sm:mt-5 flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-semibold text-purple-400 bg-purple-500/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl w-full max-w-[120px] group-hover:bg-purple-500/20 transition-colors">
                  <span>เลือกชม</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-4 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-400 mb-0.5">
              <Sparkles className="w-3.5 h-3.5" /> สินค้าแนะนำพิเศษ
            </div>
            <h2 className="text-lg sm:text-3xl font-black text-white">Featured Products</h2>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer shrink-0"
          >
            ดูทั้งหมด <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-4 gap-2.5 sm:gap-6 w-full">
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
      <section className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 overflow-hidden bg-gradient-to-br from-[#1A102E] via-[#120D24] to-[#0A0814] border border-purple-500/30 shadow-2xl w-full">
          {/* Background Radial Glow */}
          <div className="absolute -right-20 -top-20 w-80 sm:w-96 h-80 sm:h-96 bg-purple-600/20 blur-[90px] sm:blur-[100px] pointer-events-none rounded-full" />
          <div className="absolute right-1/3 bottom-0 w-60 sm:w-72 h-60 sm:h-72 bg-cyan-600/15 blur-[80px] sm:blur-[90px] pointer-events-none rounded-full" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2.5 sm:mb-3 max-w-full truncate">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{homeConfig.promoBadge || 'FAST & SECURE ROBLOX DELIVERY'}</span>
              </div>
              <h3 className="text-xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                {homeConfig.promoTitle || 'รับผลปีศาจและ Gamepass แท้ 100% ส่งมอบรวดเร็วใน 3 นาที'}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 mt-2 sm:mt-2.5 leading-relaxed max-w-xl">
                {homeConfig.promoDescription || 'ระบบส่งมอบอัตโนมัติ 24 ชั่วโมง เทรดรับไอเทมได้ทันทีในเซิร์ฟเวอร์ VIP ของ AngusShop การันตีปลอดภัย ไม่มีประวัติแบน รองรับชำระผ่าน PromptPay สแกนจ่ายตรวจสอบสลิปอัตโนมัติ'}
              </p>

              <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                <button
                  id="promo-shop-now-btn"
                  onClick={() => onNavigate('shop')}
                  className="w-full sm:w-auto px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>{homeConfig.promoButtonText || 'ช้อปผลปีศาจตอนนี้เลย'}</span>
                </button>
                <button
                  id="promo-fruits-filter-btn"
                  onClick={() => onNavigate('shop', 'ผลปีศาจ')}
                  className="w-full sm:w-auto px-4 sm:px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer text-center"
                >
                  {homeConfig.promoSecondaryButtonText || 'ดูเฉพาะผลปีศาจ'}
                </button>
              </div>
            </div>

            {/* Right Blox Fruits Visual Showcase */}
            <div className="lg:col-span-5 flex items-center justify-center w-full">
              <div className="relative w-full max-w-sm mx-auto grid grid-cols-2 gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-black/40 border border-purple-500/20 backdrop-blur-md">
                
                {/* Visual Fruit Card 1 */}
                <div 
                  onClick={() => onNavigate('shop', 'ผลปีศาจ')}
                  className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-b from-purple-950/60 to-black/60 border border-purple-500/30 flex flex-col items-center text-center cursor-pointer hover:border-purple-400 transition-all group min-w-0 overflow-hidden"
                >
                  <div className="relative w-14 h-14 sm:w-20 sm:h-20 mb-1 shrink-0">
                    <BloxImage 
                      src={homeConfig.promoCard1?.img || '/images/blox/kitsune.png'}
                      alt={homeConfig.promoCard1?.name || 'Kitsune Fruit'}
                      productName={homeConfig.promoCard1?.name || 'ผลคิตสึเนะ'}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_4px_12px_rgba(217,70,239,0.5)]"
                    />
                  </div>
                  <span className="text-xs font-black text-white group-hover:text-purple-300 truncate w-full block">
                    {homeConfig.promoCard1?.name || 'ผลคิตสึเนะ'}
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-400 tabular-nums truncate w-full block">
                    {homeConfig.promoCard1?.tag || 'Mythical • ฿299'}
                  </span>
                </div>

                {/* Visual Fruit Card 2 */}
                <div 
                  onClick={() => onNavigate('shop', 'ผลปีศาจ')}
                  className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-b from-purple-950/60 to-black/60 border border-purple-500/30 flex flex-col items-center text-center cursor-pointer hover:border-purple-400 transition-all group min-w-0 overflow-hidden"
                >
                  <div className="relative w-14 h-14 sm:w-20 sm:h-20 mb-1 shrink-0">
                    <BloxImage 
                      src={homeConfig.promoCard2?.img || '/images/blox/dragon.png'}
                      alt={homeConfig.promoCard2?.name || 'Dragon Fruit'}
                      productName={homeConfig.promoCard2?.name || 'ผลมังกร'}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_4px_12px_rgba(244,63,94,0.5)]"
                    />
                  </div>
                  <span className="text-xs font-black text-white group-hover:text-purple-300 truncate w-full block">
                    {homeConfig.promoCard2?.name || 'ผลมังกร'}
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-400 tabular-nums truncate w-full block">
                    {homeConfig.promoCard2?.tag || 'Mythical • ฿249'}
                  </span>
                </div>

                {/* Bottom badge */}
                <div className="col-span-2 py-1.5 px-2.5 sm:px-3 rounded-lg bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-[10px] text-zinc-300 gap-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{homeConfig.promoFooterText || 'มีผลสต็อกพร้อมส่งในเซิร์ฟ VIP'}</span>
                  </div>
                  <span className="text-cyan-400 font-bold shrink-0">{homeConfig.promoFooterTag || '100% แท้'}</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-4 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-400 mb-0.5">
              <Flame className="w-3.5 h-3.5" /> สินค้าขายดีประจำสัปดาห์
            </div>
            <h2 className="text-lg sm:text-3xl font-black text-white">Best Sellers</h2>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer shrink-0"
          >
            ดูเพิ่มเติม <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {bestSellers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-4 gap-2.5 sm:gap-6 w-full">
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

      {/* Blox Fruits Value Calculator & Trade Evaluator Banner */}
      <section className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-7 lg:p-8 bg-gradient-to-r from-[#150F2B] via-[#0F0B1E] to-[#121A2E] border border-purple-500/30 shadow-2xl overflow-hidden w-full">
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6">
            <div className="max-w-2xl text-center lg:text-left space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] sm:text-xs font-bold uppercase tracking-wider max-w-full truncate">
                <Calculator className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">BLOX FRUITS COMMUNITY VALUE GUIDE</span>
              </div>
              <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                เครื่องคำนวณราคาเทรดผลปีศาจ เทียบข้อเสนอ <span className="text-emerald-400">WIN</span> / <span className="text-amber-400">FAIR</span> / <span className="text-rose-400">LOSE</span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                ไม่มั่นใจว่าการเทรดนี้คุ้มหรือไม่? ใช้เครื่องคำนวณราคากลางอัปเดตปี 2026 ตรวจสอบมูลค่า Demand ของผลคิตสึเนะ, มังกร, โมจิ, เสือดาว ได้ฟรีทันที!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0 w-full lg:w-auto">
              <button
                onClick={() => {
                  playClickSound();
                  if (onOpenCalculator) onOpenCalculator();
                }}
                className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 hover:brightness-110 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Calculator className="w-4 h-4 shrink-0" />
                <span>เปิดเครื่องคำนวณ Trade ทันที</span>
              </button>

              <button
                onClick={() => onNavigate('shop', 'ผลปีศาจ')}
                className="w-full sm:w-auto px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer text-center"
              >
                ดูราคาผลในร้าน
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* How to Order Steps */}
      <section className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-12">
          <h2 className="text-lg sm:text-3xl font-black text-white">ขั้นตอนการสั่งซื้อง่ายๆ 4 ขั้นตอน</h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">รับผลปีศาจและไอเทม Blox Fruits ได้ทันใจ ปลอดภัย 100%</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5 w-full">
          {steps.map((st) => (
            <div key={st.num} className="p-3.5 sm:p-6 rounded-2xl bg-[#11111A] border border-[#212133] relative flex flex-col justify-between min-w-0 overflow-hidden">
              <div>
                <span className="text-2xl sm:text-4xl font-black text-purple-500/30 tabular-nums">{st.num}</span>
                <h3 className="text-xs sm:text-base font-bold text-white mt-1 sm:mt-2 truncate">{st.title}</h3>
                <p className="text-[10px] sm:text-xs text-zinc-400 mt-1 leading-relaxed">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews Section */}
      <section className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-12">
          <h2 className="text-lg sm:text-3xl font-black text-white">เสียงตอบรับจากลูกค้าจริง</h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">ผู้เล่น Blox Fruits ไว้วางใจสั่งซื้อกับ AngusShop</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 w-full">
          {reviews.map((rev, idx) => (
            <div key={idx} className="p-4 sm:p-6 rounded-2xl bg-[#11111A] border border-[#212133] space-y-3 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] text-zinc-500">{rev.time}</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed italic">
                "{rev.comment}"
              </p>
              <div className="pt-2 border-t border-[#1C1C2A] flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {rev.name.charAt(0)}
                </div>
                <span className="text-xs font-bold text-white truncate">{rev.name}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full ml-auto shrink-0">
                  ซื้อจริง
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-xl mx-auto mb-5 sm:mb-10">
          <h2 className="text-lg sm:text-3xl font-black text-white">คำถามที่พบบ่อย (FAQ)</h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">ข้อสงสัยยอดนิยมเกี่ยวกับการซื้อขายผลปีศาจ</p>
        </div>

        <div className="space-y-2.5 sm:space-y-3 w-full">
          {faqs.map((faq, i) => {
            const isOpen = openFaqIndex === i;
            return (
              <div 
                key={i} 
                className="rounded-2xl bg-[#11111A] border border-[#212133] overflow-hidden transition-all w-full"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                  className="w-full p-3.5 sm:p-5 flex items-center justify-between text-left gap-3 cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-white">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-purple-400' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-3.5 sm:px-5 pb-3.5 sm:pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-[#1B1B2A] pt-3">
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
