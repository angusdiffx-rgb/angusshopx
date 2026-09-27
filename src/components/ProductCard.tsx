import React from 'react';
import { ShoppingBag, Zap, Sparkles, Flame, Clock } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { BloxImage } from './BloxImage';
import { playCartSound, playClickSound } from '../lib/sound';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect, onBuyNow }) => {
  const { addToCart } = useCart();
  const { success } = useToast();

  // Only the multi-tier bundle (prod_bounty_hunt / 10M-30M) displays a price range ฿500 - ฿1,500
  const isMultiTierBountyService = 
    product.productId === 'prod_bounty_hunt' || 
    (product.category === 'บริการ' && (
      product.name.includes('10M / 20M / 30M') || 
      product.name.includes('10M-30M') ||
      product.name.includes('(2.5M - 30M)')
    ));

  const handleCardClick = () => {
    playClickSound();
    onSelect(product);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    if (isMultiTierBountyService) {
      playClickSound();
      onSelect(product);
      return;
    }
    playCartSound();
    addToCart(product, 1);
    success('เพิ่มลงตะกร้าแล้ว', `${product.name} ถูกเพิ่มในตะกร้าเรียบร้อย`);
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    if (isMultiTierBountyService) {
      playClickSound();
      onSelect(product);
      return;
    }
    playClickSound();
    if (onBuyNow) {
      onBuyNow(product);
    } else {
      addToCart(product, 1);
    }
  };

  const discountPercent = product.oldPrice && product.oldPrice > product.price 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) 
    : 0;

  return (
    <div 
      onClick={handleCardClick}
      className="group relative bg-[rgba(255,255,255,0.04)] backdrop-blur-[18px] border border-[rgba(168,85,247,0.18)] hover:border-[rgba(192,132,252,0.50)] rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 flex flex-col cursor-pointer shadow-[0_8px_30px_rgba(7,5,15,0.6),0_0_15px_rgba(168,85,247,0.08)] hover:shadow-[0_16px_40px_rgba(7,5,15,0.8),0_0_30px_rgba(168,85,247,0.25)] hover:-translate-y-1.5 active:scale-[0.98] w-full min-w-0"
    >
      {/* Image Container */}
      <div className="relative aspect-square sm:aspect-4/3 w-full bg-[#0A0515]/90 overflow-hidden flex items-center justify-center p-2.5 sm:p-3">
        <BloxImage
          src={product.image}
          alt={product.name}
          productName={product.name}
          className="w-full h-full object-contain object-center group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_4px_18px_rgba(168,85,247,0.35)]"
          loading="lazy"
        />

        {/* Badges Overlay (Modern Luxury Glass Tags) */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex flex-wrap items-center gap-1 sm:gap-1.5 z-10 max-w-[calc(100%-4.5rem)] pointer-events-none">
          {product.isBestSeller ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1A0E05]/90 backdrop-blur-md border border-amber-400/60 text-amber-300 text-[9px] sm:text-[10px] font-black tracking-wider uppercase shadow-[0_0_12px_rgba(245,158,11,0.35)] shrink-0">
              <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400 animate-pulse" />
              HOT
            </span>
          ) : product.isFeatured ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#160B29]/90 backdrop-blur-md border border-[#C084FC]/60 text-[#E9D5FF] text-[9px] sm:text-[10px] font-black tracking-wider uppercase shadow-[0_0_12px_rgba(168,85,247,0.35)] shrink-0">
              <Sparkles className="w-2.5 h-2.5 text-[#C084FC]" />
              NEW
            </span>
          ) : null}

          {discountPercent > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-950/90 to-pink-950/90 backdrop-blur-md border border-rose-500/60 text-rose-200 text-[9px] sm:text-[10px] font-black tracking-wider uppercase shadow-[0_0_12px_rgba(244,63,94,0.40)] shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              -{discountPercent}%
            </span>
          )}

          {product.stock > 0 && product.stock <= 3 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#041620]/90 backdrop-blur-md border border-cyan-400/60 text-cyan-300 text-[9px] sm:text-[10px] font-black tracking-wider uppercase shadow-[0_0_12px_rgba(6,182,212,0.35)] shrink-0">
              <Clock className="w-2.5 h-2.5 text-cyan-400" />
              LIMITED
            </span>
          )}
        </div>

        {/* Category Badge Right */}
        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 max-w-[45%] pointer-events-none">
          <span className={`px-2 py-0.5 rounded-full backdrop-blur-md text-[9px] sm:text-[10px] font-bold border block truncate shadow-sm ${
            product.category === 'สกินผล'
              ? 'bg-fuchsia-950/80 border-fuchsia-400/50 text-fuchsia-200 shadow-[0_0_10px_rgba(217,70,239,0.3)]'
              : 'bg-[#07050F]/80 border-[rgba(168,85,247,0.30)] text-[#B8AEC9]'
          }`}>
            {product.category}
          </span>
        </div>

        {/* Stock status indicator */}
        <div className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 z-10 pointer-events-none">
          {product.stock > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#041A10]/85 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-[9px] sm:text-[10px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.25)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399]" />
              เหลือ {product.stock}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1C060B]/85 backdrop-blur-md border border-rose-500/40 text-rose-400 text-[9px] sm:text-[10px] font-bold shadow-[0_0_10px_rgba(244,63,94,0.25)]">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              หมด
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#C084FC] transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-[10px] sm:text-xs text-[#B8AEC9] line-clamp-1 sm:line-clamp-2 mt-0.5 sm:mt-1 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Price & Actions */}
        <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-[rgba(168,85,247,0.15)] flex items-center justify-between gap-1 sm:gap-2 min-w-0">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1 sm:gap-1.5 truncate">
              {isMultiTierBountyService ? (
                <>
                  <span className="text-sm sm:text-base font-black text-amber-300">฿500 - ฿1,500</span>
                  <span className="text-[10px] sm:text-xs text-amber-400 font-bold">10M-30M</span>
                </>
              ) : (
                <>
                  <span className="text-sm sm:text-base font-black text-white group-hover:text-[#C084FC] transition-colors">฿{(product.price || 0).toLocaleString()}</span>
                  {product.name.includes('เลเวล') || product.name.includes('Level') ? (
                    <span className="text-[10px] sm:text-xs text-cyan-400 font-bold">/ 100 Lv</span>
                  ) : product.name.includes('เงินม่วง') || product.name.includes('Fragment') ? (
                    <span className="text-[10px] sm:text-xs text-[#C084FC] font-bold">/ 10k</span>
                  ) : product.name.includes('เงินเขียว') || product.name.includes('Beli') ? (
                    <span className="text-[10px] sm:text-xs text-emerald-400 font-bold">/ 1M</span>
                  ) : product.name.includes('มาสเตอร์') || product.name.includes('มาส') || product.name.includes('Mastery') ? (
                    <span className="text-[10px] sm:text-xs text-amber-400 font-bold">/ 100 มาส</span>
                  ) : Boolean(product.oldPrice && product.oldPrice > product.price) ? (
                    <span className="text-[10px] sm:text-xs text-zinc-500 line-through">฿{(product.oldPrice || 0).toLocaleString()}</span>
                  ) : null}
                </>
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] text-zinc-500 hidden sm:block truncate">
              {product.category === 'บริการ' || product.deliveryType === 'service' || product.deliveryType === 'manual_service'
                ? 'บริการฟาร์มในเกม'
                : product.category === 'Gamepass'
                ? 'ของขวัญ Gamepass'
                : product.category === 'สกินผล'
                ? 'สกินผล Chromatic เทรดในเกม'
                : 'ส่งมอบผ่านเซิร์ฟ VIP'}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              onClick={handleAdd}
              disabled={product.stock <= 0}
              className="p-1.5 sm:p-2 rounded-xl bg-[#0F0A1A]/85 hover:bg-[#1A102E] border border-[rgba(168,85,247,0.25)] hover:border-[rgba(192,132,252,0.55)] text-zinc-300 hover:text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:shadow-[0_0_15px_rgba(168,85,247,0.25)] hover:-translate-y-0.5 active:translate-y-0"
              title="เพิ่มลงตะกร้า"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300" />
            </button>
            <button
              onClick={handleBuy}
              disabled={product.stock <= 0}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#C084FC] text-white text-[11px] sm:text-xs font-black shadow-[0_4px_15px_rgba(139,92,246,0.4),0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.6),0_0_25px_rgba(192,132,252,0.45)] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer active:scale-95 hover:-translate-y-0.5"
            >
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white" />
              <span className="hidden xs:inline">ซื้อ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
