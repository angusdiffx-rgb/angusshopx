import React from 'react';
import { ShoppingBag } from 'lucide-react';
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
      className="group relative bg-[#0E0C16] hover:bg-[#131020] border border-white/[0.07] hover:border-purple-500/40 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col cursor-pointer shadow-sm hover:shadow-xl hover:shadow-purple-950/20 hover:-translate-y-1 active:scale-[0.99] w-full min-w-0"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square sm:aspect-4/3 w-full bg-[#080610] overflow-hidden flex items-center justify-center p-3 sm:p-4">
        <BloxImage
          src={product.image}
          alt={product.name}
          productName={product.name}
          className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Minimal, High-Contrast Tag (At most 1 quiet tag) */}
        {discountPercent > 0 ? (
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
            <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-mono text-[10px] sm:text-[11px] font-black tracking-tight shadow-md">
              -{discountPercent}%
            </span>
          </div>
        ) : product.isBestSeller ? (
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold tracking-wider uppercase">
              HOT
            </span>
          </div>
        ) : null}

        {/* Sold Out Overlay if stock is 0 */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex items-center justify-center z-10 pointer-events-none">
            <span className="px-3 py-1 rounded-lg bg-zinc-900/90 border border-zinc-700 text-zinc-300 text-xs font-bold">
              สินค้าหมดชั่วคราว
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Metadata Row: Category & Stock State as clean unboxed text */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
            <span className="text-purple-400 font-semibold tracking-wide uppercase text-[10px] sm:text-[11px]">
              {product.category}
            </span>
            {product.stock > 0 && product.stock <= 3 ? (
              <span className="text-amber-400 text-[10px] font-medium">เหลือ {product.stock} ชิ้น</span>
            ) : product.stock > 0 ? (
              <span className="text-zinc-500 text-[10px]">พร้อมส่ง</span>
            ) : null}
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-[11px] sm:text-xs text-zinc-400 line-clamp-1 mt-1 leading-normal">
            {product.shortDescription}
          </p>
        </div>

        {/* Price & Actions Row */}
        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 truncate">
              {isMultiTierBountyService ? (
                <>
                  <span className="text-sm sm:text-base font-black text-amber-300 font-mono tabular-nums">฿500 - ฿1,500</span>
                  <span className="text-[10px] text-amber-400 font-medium">10M-30M</span>
                </>
              ) : (
                <>
                  <span className="text-sm sm:text-base font-black text-white font-mono tabular-nums group-hover:text-purple-300 transition-colors">
                    ฿{(product.price || 0).toLocaleString()}
                  </span>
                  {product.name.includes('เลเวล') || product.name.includes('Level') ? (
                    <span className="text-[10px] sm:text-xs text-cyan-400 font-medium">/ 100 Lv</span>
                  ) : product.name.includes('เงินม่วง') || product.name.includes('Fragment') ? (
                    <span className="text-[10px] sm:text-xs text-purple-400 font-medium">/ 10k</span>
                  ) : product.name.includes('เงินเขียว') || product.name.includes('Beli') ? (
                    <span className="text-[10px] sm:text-xs text-emerald-400 font-medium">/ 1M</span>
                  ) : product.name.includes('มาสเตอร์') || product.name.includes('มาส') || product.name.includes('Mastery') ? (
                    <span className="text-[10px] sm:text-xs text-amber-400 font-medium">/ 100 มาส</span>
                  ) : Boolean(product.oldPrice && product.oldPrice > product.price) ? (
                    <span className="text-[10px] sm:text-xs text-zinc-500 line-through font-mono tabular-nums">
                      ฿{(product.oldPrice || 0).toLocaleString()}
                    </span>
                  ) : null}
                </>
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] text-zinc-500 hidden sm:block truncate mt-0.5">
              {product.category === 'บริการ' || product.deliveryType === 'service' || product.deliveryType === 'manual_service'
                ? 'บริการฟาร์มในเกม'
                : product.category === 'Gamepass'
                ? 'ของขวัญ Gamepass'
                : product.category === 'สกินผล'
                ? 'สกินผล Chromatic'
                : 'ส่งมอบผ่านเซิร์ฟ VIP'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleAdd}
              disabled={product.stock <= 0}
              className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-purple-400/40 text-zinc-300 hover:text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              title="เพิ่มลงตะกร้า"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300" />
            </button>
            <button
              onClick={handleBuy}
              disabled={product.stock <= 0}
              className="h-8 sm:h-8.5 px-3 sm:px-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm shadow-purple-900/30"
            >
              <span>ซื้อ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
