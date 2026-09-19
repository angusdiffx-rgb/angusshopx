import React from 'react';
import { ShoppingBag, Zap, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { BloxImage } from './BloxImage';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect, onBuyNow }) => {
  const { addToCart } = useCart();
  const { success } = useToast();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    addToCart(product, 1);
    success('เพิ่มลงตะกร้าแล้ว', `${product.name} ถูกเพิ่มในตะกร้าเรียบร้อย`);
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    addToCart(product, 1);
    if (onBuyNow) {
      onBuyNow(product);
    }
  };

  const discountPercent = product.oldPrice && product.oldPrice > product.price 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) 
    : 0;

  return (
    <div 
      onClick={() => onSelect(product)}
      className="group relative bg-[#11111A] hover:bg-[#151522] border border-[#212133] hover:border-[#7C3AED]/60 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col cursor-pointer shadow-lg hover:shadow-purple-950/30 hover:-translate-y-1 active:scale-[0.98]"
    >
      {/* Image Container */}
      <div className="relative aspect-square sm:aspect-4/3 w-full bg-[#0A0A10] overflow-hidden flex items-center justify-center p-3">
        <BloxImage
          src={product.image}
          alt={product.name}
          productName={product.name}
          className="w-full h-full object-contain object-center group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_4px_12px_rgba(147,51,234,0.25)]"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 z-10">
          {product.isBestSeller && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-500/95 backdrop-blur-md text-amber-950 text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm">
              ขายดี
            </span>
          )}
          {product.isFeatured && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-purple-600/95 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold tracking-wider shadow-sm">
              แนะนำ
            </span>
          )}
          {discountPercent > 0 && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-rose-600/95 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-black tracking-wider shadow-sm">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Category Badge Right */}
        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10">
          <span className={`px-1.5 sm:px-2 py-0.5 rounded-md backdrop-blur-md text-[9px] sm:text-[10px] font-semibold border ${
            product.category === 'สกินผล'
              ? 'bg-gradient-to-r from-fuchsia-600/80 to-purple-600/80 border-fuchsia-400/40 text-fuchsia-100 shadow-sm shadow-fuchsia-500/20'
              : 'bg-black/70 border-white/10 text-zinc-300'
          }`}>
            {product.category}
          </span>
        </div>

        {/* Stock status indicator */}
        <div className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 z-10">
          {product.stock > 0 ? (
            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-950/85 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[9px] sm:text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              เหลือ {product.stock}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-rose-950/85 backdrop-blur-md border border-rose-500/30 text-rose-400 text-[9px] sm:text-[10px] font-medium">
              หมด
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-[11px] sm:text-xs text-zinc-400 line-clamp-1 sm:line-clamp-2 mt-0.5 sm:mt-1 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Price & Actions */}
        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-[#1F1F30] flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1 sm:gap-1.5 truncate">
              <span className="text-sm sm:text-base font-black text-purple-300">฿{(product.price || 0).toLocaleString()}</span>
              {product.name.includes('เลเวล') || product.name.includes('Level') ? (
                <span className="text-[10px] sm:text-xs text-cyan-400 font-bold">/ 100 Lv</span>
              ) : product.name.includes('เงินเขียว') || product.name.includes('Beli') ? (
                <span className="text-[10px] sm:text-xs text-emerald-400 font-bold">/ 1M</span>
              ) : product.name.includes('มาสเตอร์') || product.name.includes('มาส') || product.name.includes('Mastery') ? (
                <span className="text-[10px] sm:text-xs text-amber-400 font-bold">/ 100 มาส</span>
              ) : Boolean(product.oldPrice && product.oldPrice > product.price) ? (
                <span className="text-[10px] sm:text-xs text-zinc-500 line-through">฿{(product.oldPrice || 0).toLocaleString()}</span>
              ) : null}
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
              className="p-1.5 sm:p-2 rounded-xl bg-[#1C1C2C] hover:bg-purple-600/30 border border-[#2B2B40] hover:border-purple-500/50 text-zinc-300 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="เพิ่มลงตะกร้า"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={handleBuy}
              disabled={product.stock <= 0}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:brightness-110 text-white text-[11px] sm:text-xs font-bold shadow-md shadow-purple-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
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
