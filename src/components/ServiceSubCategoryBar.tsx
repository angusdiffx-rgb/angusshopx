import React from 'react';
import { Product, SERVICE_SUBCATEGORY_LIST, ServiceSubCategory } from '../types';
import { playClickSound } from '../lib/sound';
import { Sparkles, Layers } from 'lucide-react';

interface ServiceSubCategoryBarProps {
  selectedSubCategory: string;
  onSelectSubCategory: (subCat: string) => void;
  products: Product[];
  className?: string;
}

export const ServiceSubCategoryBar: React.FC<ServiceSubCategoryBarProps> = ({
  selectedSubCategory,
  onSelectSubCategory,
  products,
  className = ''
}) => {
  // Count items for each subcategory
  const serviceProducts = products.filter(p => p.category === 'บริการ');
  
  const getCount = (subCatId: string) => {
    if (subCatId === 'ทั้งหมด') return serviceProducts.length;
    return serviceProducts.filter(p => p.subCategory === subCatId).length;
  };

  return (
    <div className={`p-3 sm:p-4 rounded-3xl bg-[rgba(244,63,94,0.04)] border border-rose-500/25 backdrop-blur-xl shadow-lg space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
          <span className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-rose-400" />
            แยกหมวดหมู่บริการฟาร์ม Blox Fruits
          </span>
          <span className="text-[10px] sm:text-xs text-rose-300/80 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 font-medium hidden sm:inline-block">
            เลือกโลกหรือประเภทบริการที่ต้องการ
          </span>
        </div>
        <span className="text-[11px] text-zinc-400 font-medium">
          ทั้งหมด <strong className="text-rose-400 font-bold">{serviceProducts.length}</strong> รายการ
        </span>
      </div>

      {/* Pill buttons list */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none [touch-action:pan-x]">
        {/* All Services Tab */}
        <button
          type="button"
          onClick={() => {
            playClickSound();
            onSelectSubCategory('ทั้งหมด');
          }}
          className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            selectedSubCategory === 'ทั้งหมด'
              ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] border border-rose-400 scale-[1.02]'
              : 'bg-[#181122]/80 hover:bg-[#221633] text-zinc-300 hover:text-white border border-rose-500/20'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-rose-300" />
          <span>ทั้งหมดในบริการ</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
            selectedSubCategory === 'ทั้งหมด' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
          }`}>
            {getCount('ทั้งหมด')}
          </span>
        </button>

        {/* 7 World & Service Subcategories */}
        {SERVICE_SUBCATEGORY_LIST.map((meta) => {
          const isSelected = selectedSubCategory === meta.id;
          const count = getCount(meta.id);

          return (
            <button
              key={meta.id}
              type="button"
              onClick={() => {
                playClickSound();
                onSelectSubCategory(meta.id);
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] border border-rose-400 scale-[1.02]'
                  : 'bg-[#181122]/80 hover:bg-[#221633] text-zinc-300 hover:text-white border border-rose-500/20'
              }`}
            >
              <span>{meta.icon}</span>
              <span>{meta.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                isSelected ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Subcategory Note Banner */}
      {selectedSubCategory !== 'ทั้งหมด' && (() => {
        const meta = SERVICE_SUBCATEGORY_LIST.find(m => m.id === selectedSubCategory);
        if (!meta) return null;
        return (
          <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200">
            <span className="flex items-center gap-1.5 font-medium truncate">
              <span>{meta.icon}</span>
              <strong className="text-white font-bold">{meta.name} ({meta.enName}):</strong>
              <span className="text-zinc-300 truncate">{meta.description}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onSelectSubCategory('ทั้งหมด');
              }}
              className="text-[11px] text-rose-400 hover:text-rose-200 font-bold shrink-0 ml-2 underline cursor-pointer"
            >
              ดูบริการทั้งหมด
            </button>
          </div>
        );
      })()}
    </div>
  );
};
