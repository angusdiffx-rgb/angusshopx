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
    <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">ร้านค้า AngusShop</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 sm:mt-1">
          ผลปีศาจ Blox Fruits และสินค้าเกม Roblox ครบครัน พร้อมส่งมอบทันที
        </p>
      </div>

      {/* Category Pills Bar (Horizontal Scrollable on Mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white shadow-md shadow-purple-500/30 ring-1 ring-purple-400/50'
                : 'bg-[#11111A] text-zinc-400 hover:text-white hover:bg-[#181826] border border-[#212133]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[#11111A] border border-[#212133] space-y-3 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3 items-center">
        {/* Search input */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อสินค้า เช่น คิตสึเนะ, โยรุ, โมจิ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0B0B12] border border-[#262638] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="sm:col-span-3 flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="w-full bg-[#0B0B12] border border-[#262638] rounded-xl px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
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
              className="rounded border-[#262638] bg-[#0B0B12] text-purple-600 focus:ring-purple-500 w-4 h-4"
            />
            <span className="text-[11px] sm:text-xs">เฉพาะที่มีสินค้า ({products.filter(p => p.stock > 0).length})</span>
          </label>
        </div>
      </div>

      {/* Product count stats */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>พบสินค้า <strong className="text-white">{filteredProducts.length}</strong> รายการ</span>
        {selectedCategory !== 'ทั้งหมด' && (
          <span className="text-purple-400 font-medium">หมวดหมู่: {selectedCategory}</span>
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-4 md:gap-6">
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
