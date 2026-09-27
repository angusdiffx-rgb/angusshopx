import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowUpDown, X, Sparkles, Flame, Check } from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { ProductCard } from '../components/ProductCard';

interface ShopViewProps {
  products: Product[];
  initialCategory?: string;
  initialSearch?: string;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const ShopView: React.FC<ShopViewProps> = ({
  products,
  initialCategory,
  initialSearch,
  onSelectProduct,
  onBuyNow,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'ทั้งหมด');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'bestseller'>('price-desc');
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  useEffect(() => {
    setSelectedCategory(initialCategory || 'ทั้งหมด');
    setSearchTerm(initialSearch || '');
  }, [initialCategory, initialSearch]);

  const categories: (string | ProductCategory)[] = [
    'ทั้งหมด',
    'ผลปีศาจ',
    'สกินผล',
    'Gamepass',
    'ไอเทม',
    'บริการ',
    'อื่นๆ',
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category match
      if (selectedCategory !== 'ทั้งหมด' && p.category !== selectedCategory) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchDesc = p.description.toLowerCase().includes(query);
        const matchCategory = p.category.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchCategory) return false;
      }
      // Price limit
      if (p.price > maxPrice) return false;
      // In stock
      if (inStockOnly && p.stock <= 0) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'bestseller') return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [products, selectedCategory, searchTerm, maxPrice, inStockOnly, sortBy]);

  return (
    <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8 overflow-x-hidden [overscroll-behavior-x:none] [touch-action:pan-y_pinch-zoom]">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7] shadow-[0_0_12px_#A855F7]"></span>
          ร้านค้า AngusShop
        </h1>
        <p className="text-xs sm:text-sm text-[#B8AEC9] mt-1">
          ผลปีศาจ Blox Fruits และสินค้าเกม Roblox ครบครัน พร้อมส่งมอบทันทีด้วยระบบอัตโนมัติ
        </p>
      </div>

      {/* Category Pills Bar (Horizontal Scrollable on Mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar w-full max-w-full touch-pan-x">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-300 cursor-pointer shrink-0 ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#A855F7] text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-[rgba(192,132,252,0.4)]'
                : 'bg-[rgba(255,255,255,0.04)] text-[#B8AEC9] hover:text-white hover:bg-[rgba(139,92,246,0.12)] border border-[rgba(168,85,247,0.18)] hover:border-[rgba(192,132,252,0.4)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 sm:p-5 rounded-3xl bg-[rgba(255,255,255,0.04)] backdrop-blur-[18px] border border-[rgba(168,85,247,0.20)] shadow-[0_8px_32px_rgba(7,5,15,0.6)] space-y-3 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3 items-center w-full max-w-full">
        {/* Search input */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-[#C084FC] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อสินค้า เช่น คิตสึเนะ, โยรุ, โมจิ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#07050F]/70 border border-[rgba(168,85,247,0.25)] rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-[#B8AEC9]/60 focus:outline-none focus:border-[#C084FC] focus:ring-1 focus:ring-[#C084FC]/40 transition-all shadow-inner"
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

        {/* Sort Select */}
        <div className="sm:col-span-3 flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#C084FC] shrink-0" />
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="w-full bg-[#07050F]/70 border border-[rgba(168,85,247,0.25)] rounded-2xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-[#C084FC] focus:ring-1 focus:ring-[#C084FC]/40 transition-all cursor-pointer"
          >
            <option value="newest">มาใหม่ล่าสุด</option>
            <option value="bestseller">สินค้าขายดี</option>
            <option value="price-asc">ราคา: ต่ำไปสูง</option>
            <option value="price-desc">ราคา: สูงไปต่ำ</option>
          </select>
        </div>

        {/* In Stock toggle */}
        <div className="sm:col-span-3 flex items-center justify-between sm:justify-end">
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded-lg border-[rgba(168,85,247,0.30)] bg-[#07050F] text-[#8B5CF6] focus:ring-[#A855F7] w-4 h-4"
            />
            <span className="text-[11px] sm:text-xs text-[#B8AEC9]">เฉพาะที่มีสินค้า ({products.filter(p => p.stock > 0).length})</span>
          </label>
        </div>
      </div>

      {/* Product count stats */}
      <div className="flex items-center justify-between text-xs text-[#B8AEC9] px-1">
        <span>พบสินค้า <strong className="text-white font-bold">{filteredProducts.length}</strong> รายการ</span>
        {selectedCategory !== 'ทั้งหมด' && (
          <span className="text-[#C084FC] font-semibold">หมวดหมู่: {selectedCategory}</span>
        )}
      </div>

      {/* Products Grid (2 columns on mobile!) */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-[#11111A] border border-[#212133] p-6">
          <div className="w-14 h-14 rounded-2xl bg-[#181826] flex items-center justify-center text-zinc-500 mx-auto mb-3">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white">ไม่พบสินค้าที่ตรงกับการค้นหา</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองหมวดหมู่เพื่อดูสินค้าอื่นๆ
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('ทั้งหมด');
              setInStockOnly(false);
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold cursor-pointer hover:bg-purple-700"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-4 md:gap-6 w-full max-w-full">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.productId}
              product={product}
              onSelect={onSelectProduct}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      )}
    </div>
  );
};
