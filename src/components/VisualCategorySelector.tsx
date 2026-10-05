import React, { useState } from 'react';
import { Sparkles, Grid, Layers, Check } from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { BloxImage } from './BloxImage';
import { playClickSound } from '../lib/sound';

export interface CategoryInfo {
  name: string | ProductCategory;
  enName: string;
  desc: string;
  image: string;
  gradient: string;
  borderColor: string;
  accentColor: string;
  glow: string;
}

export const CATEGORY_DEFINITIONS: CategoryInfo[] = [
  {
    name: 'ทั้งหมด',
    enName: 'All Items',
    desc: 'รวมสินค้าทั้งหมดในร้าน พร้อมส่งทันที',
    image: '/images/blox/kitsune.png',
    gradient: 'from-[#6D28D9]/40 via-[#4C1D95]/20 to-[#1E113A]/50',
    borderColor: 'border-[#A855F7]/40 hover:border-[#C084FC]',
    accentColor: '#C084FC',
    glow: 'rgba(168, 85, 247, 0.35)'
  },
  {
    name: 'ไอดี',
    enName: 'Roblox Accounts',
    desc: 'สุ่มไก่ตันดาบคู่ CDK เลเวล Max 2550 สเตตัสตัน พร้อมเล่นทันที',
    image: '/images/blox/cursed_dual_katana.png',
    gradient: 'from-amber-600/30 via-orange-600/20 to-[#2A1508]/60',
    borderColor: 'border-amber-500/40 hover:border-amber-400',
    accentColor: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.35)'
  },
  {
    name: 'ผลปีศาจ',
    enName: 'Devil Fruits',
    desc: 'คิตสึเนะ มังกร โมจิ ถาวร & กล่องผล',
    image: '/images/blox/category_devil_fruit.jpg',
    gradient: 'from-amber-600/30 via-orange-600/20 to-[#2A1508]/60',
    borderColor: 'border-amber-500/40 hover:border-amber-400',
    accentColor: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.35)'
  },
  {
    name: 'สกินผล',
    enName: 'Fruit Skins',
    desc: 'สกินผลระดับ Mythical ลายลิมิเต็ดสุดแรร์',
    image: '/images/blox/skin_galaxy_kitsune.png',
    gradient: 'from-fuchsia-600/30 via-pink-600/20 to-[#2E0B2B]/60',
    borderColor: 'border-fuchsia-500/40 hover:border-fuchsia-400',
    accentColor: '#E879F9',
    glow: 'rgba(217, 70, 239, 0.35)'
  },
  {
    name: 'บริการ',
    enName: 'Services & Raids',
    desc: 'ล่าค่าหัว 10M-30M อเวค V4 ฟาร์มเวลทันใจ',
    image: '/images/blox/service_bounty_hunt.jpg',
    gradient: 'from-rose-600/30 via-pink-600/20 to-[#2A0A14]/60',
    borderColor: 'border-rose-500/40 hover:border-rose-400',
    accentColor: '#FB7185',
    glow: 'rgba(244, 63, 94, 0.35)'
  },
  {
    name: 'Gamepass',
    enName: 'Gamepasses',
    desc: 'ดาบโยรุ คูณเงิน คูณชำนาญ เรือเร็ว สล็อตผล',
    image: '/images/blox/category_gamepass_vip.jpg',
    gradient: 'from-blue-600/30 via-indigo-600/20 to-[#0A1633]/60',
    borderColor: 'border-blue-500/40 hover:border-blue-400',
    accentColor: '#60A5FA',
    glow: 'rgba(59, 130, 246, 0.35)'
  },
  {
    name: 'อื่นๆ',
    enName: 'Others',
    desc: 'วัตถุดิบตีบวก หัวใจเลเวียธาน และสินค้าเบ็ดเตล็ด',
    image: '/images/blox/leviathan_heart.png',
    gradient: 'from-cyan-600/30 via-sky-600/20 to-[#07202B]/60',
    borderColor: 'border-cyan-500/40 hover:border-cyan-400',
    accentColor: '#22D3EE',
    glow: 'rgba(6, 182, 212, 0.35)'
  }
];

interface VisualCategorySelectorProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  products: Product[];
  initialMode?: 'cards' | 'strip';
  showModeToggle?: boolean;
  className?: string;
}

export const VisualCategorySelector: React.FC<VisualCategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory,
  products,
  initialMode = 'cards',
  showModeToggle = true,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'strip'>(initialMode);

  // Compute live product counts per category
  const counts = React.useMemo(() => {
    const map: Record<string, number> = {
      'ทั้งหมด': products.length
    };
    products.forEach((p) => {
      const isAccount = p.category === 'ไอดี' || (p.category as string) === 'ไอเทม' || p.deliveryType === 'account_code' || p.name.includes('ไก่ตัน') || p.name.includes('สุ่ม');
      const catKey = isAccount ? 'ไอดี' : p.category;
      map[catKey] = (map[catKey] || 0) + 1;
    });
    return map;
  }, [products]);

  const handleSelect = (catName: string) => {
    playClickSound();
    onSelectCategory(catName);
  };

  return (
    <div className={`space-y-2 sm:space-y-3 ${className}`}>
      
      {/* Category Header with Title & Mode Switcher (Desktop only) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C084FC] shadow-[0_0_8px_#C084FC]" />
          <h2 className="text-xs sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <span>หมวดหมู่สินค้า</span>
            <span className="text-[11px] font-normal text-[#B8AEC9] hidden sm:inline">• เลื่อนเพื่อเลือกประเภท</span>
          </h2>
        </div>

        {/* Mode toggle (Only visible on tablet & desktop) */}
        {showModeToggle && (
          <div className="hidden sm:flex items-center bg-[#0E0A1E]/80 border border-[rgba(168,85,247,0.25)] rounded-xl p-0.5 shadow-inner">
            <button
              onClick={() => {
                playClickSound();
                setViewMode('cards');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#B8AEC9] hover:text-white'
              }`}
              title="แสดงการ์ดรูปภาพใหญ่"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>การ์ดรูปภาพ</span>
            </button>
            <button
              onClick={() => {
                playClickSound();
                setViewMode('strip');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'strip'
                  ? 'bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#B8AEC9] hover:text-white'
              }`}
              title="แสดงแถบกะทัดรัด"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>แถบกะทัดรัด</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 📱 MOBILE VIEW: Compact Swipeable Horizontal Carousel (Height ~84px)      */}
      {/* Takes minimal vertical space so products are immediately visible on phone */}
      {/* ========================================================================= */}
      <div className="sm:hidden -mx-3 px-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar touch-pan-x [overscroll-behavior-x:contain]">
          {CATEGORY_DEFINITIONS.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            const count = counts[cat.name] || 0;

            return (
              <button
                key={cat.name}
                onClick={() => handleSelect(cat.name as string)}
                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-2xl border transition-all duration-200 cursor-pointer shrink-0 select-none active:scale-95 ${
                  isSelected
                    ? `bg-gradient-to-r ${cat.gradient} border-[${cat.accentColor}] ring-1 ring-[${cat.accentColor}]/50 shadow-[0_0_16px_${cat.glow}]`
                    : 'bg-[#0E0820]/90 border-[rgba(168,85,247,0.22)] text-zinc-300 hover:text-white'
                }`}
              >
                {/* 3D Category Thumbnail Icon */}
                <div className="relative w-9 h-9 rounded-xl bg-black/40 border border-white/10 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                  <BloxImage
                    src={cat.image}
                    alt={cat.name as string}
                    productName={cat.name as string}
                    className="w-full h-full object-contain drop-shadow"
                  />
                </div>

                {/* Text & Count */}
                <div className="text-left min-w-0 pr-1">
                  <div className={`text-xs font-black truncate leading-tight ${
                    isSelected ? 'text-white' : 'text-zinc-200'
                  }`}>
                    {cat.name}
                  </div>
                  <div className={`text-[10px] font-bold mt-0.5 leading-none ${
                    isSelected ? 'text-white/90' : 'text-[#C084FC]'
                  }`}>
                    {count} รายการ
                  </div>
                </div>

                {/* Active Dot Pin */}
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 💻 DESKTOP VIEW: Sleek Grid Cards OR Compact Strip based on user choice   */}
      {/* ========================================================================= */}
      <div className="hidden sm:block">
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3 w-full">
            {CATEGORY_DEFINITIONS.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              const count = counts[cat.name] || 0;

              return (
                <div
                  key={cat.name}
                  onClick={() => handleSelect(cat.name as string)}
                  style={{
                    boxShadow: isSelected ? `0 0 25px ${cat.glow}` : undefined
                  }}
                  className={`group relative p-3 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between items-center text-center select-none active:scale-95 ${
                    isSelected
                      ? `bg-gradient-to-b ${cat.gradient} border-2 border-[${cat.accentColor}] ring-2 ring-[${cat.accentColor}]/40 shadow-xl`
                      : `bg-[#0B0617]/85 hover:bg-[#130B26] ${cat.borderColor} shadow-md`
                  }`}
                >
                  {/* Active Indicator Pin */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[10px] font-black shadow-md z-10 animate-in zoom-in-50">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  {/* Ambient Radial Glow */}
                  <div
                    className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-40 transition-opacity group-hover:opacity-75"
                    style={{ backgroundColor: cat.accentColor }}
                  />

                  {/* Category Thumbnail Image with 3D Float */}
                  <div className="relative w-14 h-14 my-1 flex items-center justify-center shrink-0">
                    <BloxImage
                      src={cat.image}
                      alt={cat.name as string}
                      productName={cat.name as string}
                      className="w-full h-full object-contain rounded-xl drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300"
                    />
                  </div>

                  {/* Text & Counter Details */}
                  <div className="w-full mt-1 space-y-0.5 min-w-0">
                    <div className={`text-xs lg:text-sm font-black truncate ${
                      isSelected ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                    }`}>
                      {cat.name}
                    </div>

                    <p className="text-[10px] text-[#B8AEC9]/80 font-medium truncate">
                      {cat.enName}
                    </p>

                    {/* Micro Count Pill */}
                    <div className="pt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider transition-colors ${
                        isSelected
                          ? 'bg-white/20 text-white border border-white/30 backdrop-blur-md'
                          : 'bg-[#05020A]/70 text-[#C084FC] border border-[rgba(168,85,247,0.25)]'
                      }`}>
                        {count} รายการ
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Mode B: Compact Horizontal Strip */
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar w-full max-w-full touch-pan-x">
            {CATEGORY_DEFINITIONS.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              const count = counts[cat.name] || 0;

              return (
                <button
                  key={cat.name}
                  onClick={() => handleSelect(cat.name as string)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-300 cursor-pointer shrink-0 select-none active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#A855F7] text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-[#C084FC]/60'
                      : 'bg-[#0B0617]/80 text-[#B8AEC9] hover:text-white hover:bg-[#160B29] border border-[rgba(168,85,247,0.20)] hover:border-[rgba(192,132,252,0.45)]'
                  }`}
                >
                  <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 overflow-hidden">
                    <BloxImage
                      src={cat.image}
                      alt={cat.name as string}
                      productName={cat.name as string}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-[#18112B] text-[#C084FC]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
