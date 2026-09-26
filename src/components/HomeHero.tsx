import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sparkles, 
  ShoppingBag, 
  Zap, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  Flame, 
  Crown,
  Calculator,
  Wallet
} from 'lucide-react';
import { Product, HeroBannerConfig } from '../types';
import { useHomeConfig } from '../context/HomeConfigContext';
import { BloxImage } from './BloxImage';
import { DEFAULT_HOME_CONFIG } from '../data/bloxPresets';
import { playClickSound } from '../lib/sound';

interface HomeHeroProps {
  products: Product[];
  onNavigate: (view: string, param?: string) => void;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onOpenCalculator?: () => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  products,
  onNavigate,
  onSelectProduct,
  onBuyNow,
  onOpenCalculator
}) => {
  const { homeConfig } = useHomeConfig();
  const banners: HeroBannerConfig[] = (homeConfig.heroBanners && homeConfig.heroBanners.length > 0)
    ? homeConfig.heroBanners.filter(b => b.isActive !== false)
    : (DEFAULT_HOME_CONFIG.heroBanners || []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeBanner = banners[currentIndex] || banners[0];

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Autoplay banner rotation with pause on hover
  useEffect(() => {
    if (isPaused || banners.length <= 1) return;

    timerRef.current = setInterval(() => {
      goToNext();
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, goToNext, banners.length]);

  // Mobile Touch Swipe Handlers (Prevents horizontal page scroll, only swipes the hero)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const isLeftSwipe = distance > 45;
    const isRightSwipe = distance < -45;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Find linked product for CTA
  const handleBannerAction = (banner: HeroBannerConfig, isDirectBuy = false) => {
    playClickSound();
    if (banner.targetProductId) {
      const match = products.find(p => 
        p.productId.toLowerCase() === banner.targetProductId?.toLowerCase() ||
        p.slug?.toLowerCase() === banner.targetProductId?.toLowerCase()
      );
      if (match) {
        if (isDirectBuy) {
          onBuyNow(match);
        } else {
          onSelectProduct(match);
        }
        return;
      }
    }
    if (banner.targetCategory) {
      onNavigate('shop', banner.targetCategory);
      return;
    }
    onNavigate('shop');
  };

  if (!activeBanner) return null;

  // Badge Accent Styles
  const getBadgeStyle = (color?: string) => {
    switch (color) {
      case 'rose':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/20';
      case 'amber':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/20';
      case 'cyan':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-500/20';
      case 'emerald':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20';
      case 'purple':
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-500/20';
    }
  };

  const getGradientTheme = (gradient?: string) => {
    return gradient || 'from-[#1A0F2E] via-[#120B20] to-[#0A0714]';
  };

  return (
    <div className="w-full max-w-full overflow-hidden relative">
      {/* Top Ambient Glow - Clamped to prevent mobile horizontal overflow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-56 bg-purple-600/15 blur-[120px] rounded-full pointer-events-none -z-10" 
        aria-hidden="true"
      />

      <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6">
        
        {/* Main Hero Promotional Banner Frame */}
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative w-full rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-700 bg-gradient-to-br ${getGradientTheme(activeBanner.themeGradient)}`}
        >
          {/* Subtle Ambient Radial Lighting Inside Banner */}
          <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-purple-500/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-60 sm:w-80 h-60 sm:h-80 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

          {/* Autoplay Progress Line Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 z-20 overflow-hidden">
            <div 
              key={currentIndex}
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 animate-[progress_6s_linear_infinite]"
              style={{
                animationPlayState: isPaused ? 'paused' : 'running'
              }}
            />
          </div>

          {/* Grid Layout: Left Content & Right Graphic Artwork */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center p-5 sm:p-8 lg:p-12">
            
            {/* Left Column: Promotion Info & Direct Actions */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-3.5 sm:space-y-5 text-left">
              
              {/* Badge & Category Strip */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black tracking-wide border shadow-md backdrop-blur-md ${getBadgeStyle(activeBanner.badgeColor)}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{activeBanner.badge}</span>
                </span>

                {activeBanner.targetCategory && (
                  <span className="text-zinc-400 text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-black/40 border border-white/5">
                    หมวด: {activeBanner.targetCategory}
                  </span>
                )}

                {activeBanner.discountBadge && (
                  <span className="text-rose-300 font-extrabold text-[11px] sm:text-xs px-2.5 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/30">
                    ลดพิเศษ {activeBanner.discountBadge}
                  </span>
                )}
              </div>

              {/* Title & Highlight */}
              <div className="space-y-1.5 sm:space-y-2">
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md">
                  {activeBanner.title}
                </h1>
                {activeBanner.highlightText && (
                  <p className="text-sm sm:text-lg md:text-xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                    {activeBanner.highlightText}
                  </p>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl line-clamp-3 sm:line-clamp-none">
                {activeBanner.description}
              </p>

              {/* Price & Stock Showcase */}
              <div className="flex flex-wrap items-baseline gap-3 pt-1">
                {activeBanner.priceText && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-4xl font-black text-emerald-400 drop-shadow-sm">
                      {activeBanner.priceText}
                    </span>
                    {activeBanner.originalPriceText && (
                      <span className="text-xs sm:text-sm text-zinc-500 line-through">
                        {activeBanner.originalPriceText}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-400 bg-black/30 border border-white/5 px-2.5 py-1 rounded-xl">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>รับของผ่าน VIP Server 100%</span>
                </div>
              </div>

              {/* Action Buttons: Buy Now & Details */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-4">
                <button
                  type="button"
                  onClick={() => handleBannerAction(activeBanner, true)}
                  className="py-3 px-5 sm:px-7 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>{activeBanner.ctaText || 'สั่งซื้อทันที'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBannerAction(activeBanner, false)}
                  className="py-3 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/15 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <span>{activeBanner.secondaryCtaText || 'ดูรายละเอียด'}</span>
                  <ArrowRight className="w-4 h-4 text-purple-300" />
                </button>

                {onOpenCalculator && (
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      onOpenCalculator();
                    }}
                    className="py-3 px-3.5 rounded-xl sm:rounded-2xl bg-[#141422] hover:bg-[#1E1E2E] border border-purple-500/30 text-purple-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer hidden sm:flex"
                    title="เครื่องคำนวณราคาเทรด Blox Fruits (W/F/L)"
                  >
                    <Calculator className="w-4 h-4 text-purple-400" />
                    <span>คำนวณราคาเทรด</span>
                  </button>
                )}
              </div>

            </div>

            {/* Right Column: Promotional Blox Fruits Hero Asset */}
            <div className="lg:col-span-5 flex items-center justify-center py-2 sm:py-0">
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 flex items-center justify-center">
                
                {/* Rotating Aura Ring */}
                <div 
                  className="absolute inset-0 rounded-full border border-purple-500/20 bg-gradient-to-tr from-purple-600/10 via-transparent to-cyan-500/10 animate-[spin_24s_linear_infinite]" 
                  aria-hidden="true"
                />
                
                {/* Pulsing Core Glow */}
                <div 
                  className="absolute inset-4 rounded-full bg-purple-600/20 blur-[50px] animate-pulse pointer-events-none" 
                  aria-hidden="true"
                />

                {/* Hero Product BloxImage */}
                <div className="relative z-10 w-full h-full p-4 flex items-center justify-center group cursor-pointer"
                  onClick={() => handleBannerAction(activeBanner, false)}
                >
                  <BloxImage
                    src={activeBanner.imageUrl}
                    alt={activeBanner.title}
                    productName={activeBanner.title}
                    className="max-w-full max-h-full object-contain drop-shadow-[0_12px_28px_rgba(168,85,247,0.45)] hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Floating Corner Badges */}
                <div className="absolute -bottom-2 -left-2 sm:bottom-2 sm:left-2 z-20 px-3 py-1 rounded-xl bg-[#0F0F1A]/90 border border-purple-500/30 backdrop-blur-md shadow-xl flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-zinc-200">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ส่งไวใน 3 นาที</span>
                </div>

                <div className="absolute -top-2 -right-2 sm:top-2 sm:right-2 z-20 px-3 py-1 rounded-xl bg-purple-600/90 border border-purple-400/40 backdrop-blur-md shadow-xl flex items-center gap-1 text-[10px] sm:text-xs font-black text-white">
                  <Flame className="w-3.5 h-3.5 text-amber-300" />
                  <span>ของแท้ 100%</span>
                </div>
              </div>
            </div>

          </div>

          {/* Banner Carousel Controls & Indicator Strip */}
          <div className="relative z-20 px-5 sm:px-8 py-3 bg-black/40 border-t border-white/5 flex items-center justify-between gap-3">
            
            {/* Slide Index Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 max-w-[120px] xs:max-w-[180px] sm:max-w-none overflow-x-auto no-scrollbar py-0.5">
              {banners.map((b, idx) => (
                <button
                  key={b.id || idx}
                  onClick={() => {
                    playClickSound();
                    setCurrentIndex(idx);
                  }}
                  className={`h-2 sm:h-2.5 rounded-full transition-all cursor-pointer shrink-0 ${
                    currentIndex === idx 
                      ? 'w-6 sm:w-9 bg-gradient-to-r from-purple-400 to-cyan-400 shadow-sm shadow-purple-500/50' 
                      : 'w-2 sm:w-2.5 bg-white/20 hover:bg-white/40'
                  }`}
                  title={b.title}
                />
              ))}
              <span className="text-[10px] sm:text-xs font-bold text-zinc-400 ml-1.5 shrink-0 hidden sm:inline">
                {currentIndex + 1} / {banners.length}
              </span>
            </div>

            {/* Quick Carousel Thumbnail Switcher on Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {banners.map((b, idx) => (
                <button
                  key={b.id || idx}
                  onClick={() => {
                    playClickSound();
                    setCurrentIndex(idx);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    currentIndex === idx
                      ? 'bg-purple-600/30 border-purple-400 text-white'
                      : 'bg-[#12121E]/60 border-white/5 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span className="max-w-[110px] truncate">{b.title.split('(')[0].trim()}</span>
                </button>
              ))}
            </div>

            {/* Prev / Next Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  goToPrev();
                }}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#151524] hover:bg-[#1E1E32] border border-white/10 hover:border-purple-500/40 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                title="ก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  goToNext();
                }}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#151524] hover:bg-[#1E1E32] border border-white/10 hover:border-purple-500/40 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                title="ถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
