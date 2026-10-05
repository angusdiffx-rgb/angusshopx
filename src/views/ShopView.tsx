import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  X, 
  Sparkles, 
  Flame, 
  Check, 
  Grid, 
  List, 
  Calculator, 
  Package, 
  SlidersHorizontal, 
  Percent, 
  Layers,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { ProductCard } from '../components/ProductCard';
import { VisualCategorySelector } from '../components/VisualCategorySelector';
import { playClickSound } from '../lib/sound';

interface ShopViewProps {
  products: Product[];
  initialCategory?: string;
  initialSearch?: string;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onOpenCalculator?: () => void;
}

export const ShopView: React.FC<ShopViewProps> = ({
  products,
  initialCategory,
  initialSearch,
  onSelectProduct,
  onBuyNow,
  onOpenCalculator,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'ทั้งหมด');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'bestseller' | 'discount'>('bestseller');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [saleOnly, setSaleOnly] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    setSelectedCategory(initialCategory || 'ทั้งหมด');
    setSearchTerm(initialSearch || '');
  }, [initialCategory, initialSearch]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category match
      if (selectedCategory !== 'ทั้งหมด') {
        if (selectedCategory === 'ไอดี') {
          const isAccount = p.category === 'ไอดี' || (p.category as string) === 'ไอเทม' || p.deliveryType === 'account_code' || p.name.includes('ไก่ตัน') || p.name.includes('สุ่ม');
          if (!isAccount) return false;
        } else if (p.category !== selectedCategory) {
          return false;
        }
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchDesc = p.description?.toLowerCase().includes(query);
        const matchCategory = p.category?.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchCategory) return false;
      }
      // In stock only
      if (inStockOnly && p.stock <= 0) return false;
      // Sale only
      if (saleOnly && (!p.oldPrice || p.oldPrice <= p.price)) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'bestseller') return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      if (sortBy === 'discount') {
        const discA = a.oldPrice && a.oldPrice > a.price ? (a.oldPrice - a.price) / a.oldPrice : 0;
        const discB = b.oldPrice && b.oldPrice > b.price ? (b.oldPrice - b.price) / b.oldPrice : 0;
        return discB - discA;
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [products, selectedCategory, searchTerm, inStockOnly, saleOnly, sortBy]);

  const totalInStock = useMemo(() => products.filter(p => p.stock > 0).length, [products]);
  const totalOnSale = useMemo(() => products.filter(p => p.oldPrice && p.oldPrice > p.price).length, [products]);

  return (
    <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-28 sm:pb-12 space-y-4 sm:space-y-6 overflow-x-hidden [overscroll-behavior-x:none] [touch-action:pan-y_pinch-zoom]">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-3 sm:pb-4 border-b border-[rgba(168,85,247,0.20)]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-[#C084FC] text-[11px] sm:text-xs font-bold mb-1.5 sm:mb-2 backdrop-blur-md">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
            <span>ศูนย์รวมผลปีศาจและไอเทมแท้ 100% พร้อมส่งในเกม</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#A855F7] shadow-[0_0_15px_#A855F7]"></span>
            <span>ร้านค้า Blox Fruits</span>
          </h1>
          <p className="text-[11px] sm:text-sm text-[#B8AEC9] mt-1 max-w-2xl leading-relaxed">
            เลือกช้อปผลปีศาจถาวร ผลดอง สกินผลลิมิเต็ด ดาบโยรุ คูณเงิน คูณชำนาญ และบริการฟาร์มระดับโปร ส่งมอบผ่านระบบ VIP อัตโนมัติ 24 ชม.
          </p>
        </div>

        {/* Quick Utility Action Buttons */}
        {onOpenCalculator && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                playClickSound();
                onOpenCalculator();
              }}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-[#140C29] hover:bg-[#1E123D] border border-purple-500/35 hover:border-[#C084FC] text-purple-200 hover:text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C084FC]" />
              <span>คำนวณ Trade Value (W/F/L)</span>
            </button>
          </div>
        )}
      </div>

      {/* Visual Category Selector (แยกหมวดหมู่สินค้าแบบรูปภาพสวยๆ ทันสมัย) */}
      <VisualCategorySelector
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        products={products}
        initialMode="cards"
        showModeToggle={true}
      />

      {/* Modern Filter, Search & Sort Control Bar */}
      <div className="p-3.5 sm:p-5 rounded-3xl bg-[rgba(255,255,255,0.03)] backdrop-blur-[20px] border border-[rgba(168,85,247,0.22)] shadow-[0_8px_32px_rgba(7,5,15,0.6)] space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4 w-full">
        
        {/* Search input */}
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 text-[#C084FC] absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อสินค้า เช่น คิตสึเนะ, มังกร, โยรุ, โมจิ, ผลแก๊ส..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#080414]/80 border border-[rgba(168,85,247,0.25)] rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-[#B8AEC9]/60 focus:outline-none focus:border-[#C084FC] focus:ring-1 focus:ring-[#C084FC]/40 transition-all shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-[#B8AEC9] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Badges & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sale Only Toggle */}
          <button
            onClick={() => {
              playClickSound();
              setSaleOnly(!saleOnly);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
              saleOnly
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.35)]'
                : 'bg-[#0B0617]/80 text-[#B8AEC9] hover:text-white border border-[rgba(168,85,247,0.25)]'
            }`}
          >
            <Percent className="w-3.5 h-3.5 text-rose-400" />
            <span>เฉพาะลดราคา ({totalOnSale})</span>
          </button>

          {/* In Stock Toggle */}
          <button
            onClick={() => {
              playClickSound();
              setInStockOnly(!inStockOnly);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
              inStockOnly
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                : 'bg-[#0B0617]/80 text-[#B8AEC9] hover:text-white border border-[rgba(168,85,247,0.25)]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${inStockOnly ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
            <span>เฉพาะพร้อมส่ง ({totalInStock})</span>
          </button>

          {/* Sort Select */}
          <div className="flex items-center gap-1.5 bg-[#0B0617]/80 border border-[rgba(168,85,247,0.25)] rounded-2xl px-3 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#C084FC] shrink-0" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-zinc-200 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="bestseller" className="bg-[#0F0A1E] text-white">ยอดนิยม (Best Seller)</option>
              <option value="newest" className="bg-[#0F0A1E] text-white">มาใหม่ล่าสุด</option>
              <option value="discount" className="bg-[#0F0A1E] text-white">ลดราคามากที่สุด</option>
              <option value="price-asc" className="bg-[#0F0A1E] text-white">ราคา: ต่ำไปสูง</option>
              <option value="price-desc" className="bg-[#0F0A1E] text-white">ราคา: สูงไปต่ำ</option>
            </select>
          </div>

          {/* Layout Mode Switcher (Grid vs List) */}
          <div className="flex items-center bg-[#080414] border border-[rgba(168,85,247,0.25)] rounded-xl p-0.5">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                layoutMode === 'grid'
                  ? 'bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#B8AEC9] hover:text-white'
              }`}
              title="แสดงแบบการ์ดตาราง"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                layoutMode === 'list'
                  ? 'bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#B8AEC9] hover:text-white'
              }`}
              title="แสดงแบบรายการแถวยาว"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Results Header */}
      <div className="flex flex-wrap items-center justify-between text-xs text-[#B8AEC9] px-1 gap-2">
        <div className="flex items-center gap-2">
          <span>พบสินค้า <strong className="text-white font-black text-sm">{filteredProducts.length}</strong> รายการ</span>
          {selectedCategory !== 'ทั้งหมด' && (
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-[#C084FC] font-bold">
              หมวดหมู่: {selectedCategory}
            </span>
          )}
          {(inStockOnly || saleOnly || searchTerm) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('ทั้งหมด');
                setInStockOnly(false);
                setSaleOnly(false);
              }}
              className="text-xs text-rose-400 hover:underline cursor-pointer font-bold"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>

        <div className="text-[11px] text-zinc-400">
          ส่งมอบด้วยบอทและแอดมินผ่าน VIP Server ตลอด 24 ชม.
        </div>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-[#0F0A1E]/80 border border-purple-500/20 p-8 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-[#C084FC] mx-auto shadow-inner">
            <Search className="w-8 h-8 opacity-70" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white">ไม่พบสินค้าที่ตรงกับการค้นหา</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              ลองพิมพ์คำค้นหาอื่น หรือเลือกหมวดหมู่อื่นเพื่อค้นหาผลปีศาจที่คุณต้องการ
            </p>
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('ทั้งหมด');
              setInStockOnly(false);
              setSaleOnly(false);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-purple-900/30 hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer"
          >
            รีเซ็ตตัวกรองทั้งหมด
          </button>
        </div>
      ) : layoutMode === 'grid' ? (
        /* Grid Display (2 cols on mobile, 4-5 on desktop) */
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-4 md:gap-5 w-full max-w-full">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.productId}
              product={product}
              onSelect={onSelectProduct}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      ) : (
        /* List Display for dense scanning */
        <div className="space-y-2.5">
          {filteredProducts.map((product) => (
            <div
              key={product.productId}
              onClick={() => onSelectProduct(product)}
              className="p-3 sm:p-4 rounded-2xl bg-[#0D071B]/90 hover:bg-[#160D2E] border border-purple-500/25 hover:border-[#C084FC]/50 transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-md"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#070311] border border-purple-500/20 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-white group-hover:text-[#C084FC] transition-colors truncate">
                      {product.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/30 text-[#C084FC] font-semibold shrink-0">
                      {product.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                    {product.shortDescription || product.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px]">
                    {product.stock > 0 ? (
                      <span className="text-emerald-400 font-bold">สต็อก: เหลือ {product.stock} ชิ้น</span>
                    ) : (
                      <span className="text-rose-400 font-bold">สินค้าหมดชั่วคราว</span>
                    )}
                    {product.isBestSeller && (
                      <span className="text-amber-400 font-bold">• สินค้าขายดี</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-white/5 shrink-0">
                <div className="text-left sm:text-right">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base sm:text-lg font-black text-cyan-400 tabular-nums">
                      ฿{product.price.toLocaleString()}
                    </span>
                    {product.oldPrice && product.oldPrice > product.price && (
                      <span className="text-xs text-zinc-500 line-through tabular-nums">
                        ฿{product.oldPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {product.oldPrice && product.oldPrice > product.price && (
                    <span className="text-[10px] text-rose-400 font-bold">
                      ประหยัด ฿{(product.oldPrice - product.price).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playClickSound();
                      onBuyNow(product);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-900/30 transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    ซื้อทันที
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
