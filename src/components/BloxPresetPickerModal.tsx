import React, { useState } from 'react';
import { Search, Sparkles, X, Check } from 'lucide-react';
import { BLOX_FRUITS_PRESETS, BloxPreset } from '../data/bloxPresets';
import { BloxImage } from './BloxImage';

interface BloxPresetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (preset: BloxPreset) => void;
  onSelectPreset?: (preset: BloxPreset) => void;
  selectedUrl?: string;
  title?: string;
}

export const BloxPresetPickerModal: React.FC<BloxPresetPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onSelectPreset,
  selectedUrl,
  title
}) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'fruit' | 'skin' | 'gamepass' | 'sword' | 'style' | 'service'>('all');

  if (!isOpen) return null;

  const handleSelectInternal = (preset: BloxPreset) => {
    if (typeof onSelect === 'function') {
      onSelect(preset);
    } else if (typeof onSelectPreset === 'function') {
      onSelectPreset(preset);
    }
    onClose();
  };

  const filtered = BLOX_FRUITS_PRESETS.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchSearch = q === '' || p.name.toLowerCase().includes(q) || p.th.toLowerCase().includes(q);
    if (!matchSearch) return false;

    if (filterCategory === 'fruit') return p.category === 'ผลปีศาจ';
    if (filterCategory === 'skin') return p.category === 'สกินผล' || p.name.toLowerCase().includes('skin') || p.th.includes('สกิน');
    if (filterCategory === 'gamepass') return p.category === 'Gamepass';
    if (filterCategory === 'sword') return p.subType === 'Sword' || p.subType === 'Gun' || p.category === 'ไอเทม';
    if (filterCategory === 'style') return p.subType === 'FightingStyle';
    if (filterCategory === 'service') return p.category === 'บริการ' || p.name.toLowerCase().includes('bounty') || p.th.includes('ค่าหัว');
    return true;
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="bg-[#12121E] border border-purple-500/40 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl shadow-purple-950/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#212133] flex items-center justify-between bg-[#151524]">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{title || 'คลังรูปผลไม้และไอเทม Blox Fruits ในเกมทั้งหมด'}</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              เลือกเพื่อนำรูป ชื่อ หมวดหมู่ และระดับความหายากไปกรอกในฟอร์มอัตโนมัติ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter controls */}
        <div className="p-4 border-b border-[#212133] space-y-3 bg-[#0E0E18]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อผลหรือไอเทม เช่น คิตสึเนะ, เสือ, โมจิ, โยรุ, บัวหิมะ, ผลเสือ..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#161626] border border-[#292942] text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: `ทั้งหมด (${BLOX_FRUITS_PRESETS.length})` },
              { id: 'fruit', label: 'ผลปีศาจทั้งหมด' },
              { id: 'skin', label: 'สกินผล (ล่าสุด)' },
              { id: 'gamepass', label: 'Gamepasses' },
              { id: 'sword', label: 'ดาบ & อาวุธ' },
              { id: 'style', label: 'หมัด & เผ่า V4' },
              { id: 'service', label: 'บริการ & ล่าค่าหัว' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterCategory(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterCategory === tab.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-[#181828] text-zinc-400 hover:text-white hover:bg-[#202035]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="p-4 overflow-y-auto flex-1 max-h-[50vh]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              ไม่พบผลไม้หรือไอเทมที่ค้นหา "{search}"
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filtered.map((preset) => {
                const isSelected = selectedUrl === preset.url;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectInternal(preset)}
                    className={`p-2.5 rounded-xl border text-left group flex items-center gap-2.5 cursor-pointer transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-purple-900/50 border-purple-400 shadow-md shadow-purple-500/20'
                        : 'bg-[#151524] hover:bg-purple-950/40 border-[#242438] hover:border-purple-500/60'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#0C0C14] border border-white/5 p-1 shrink-0 flex items-center justify-center relative">
                      <BloxImage
                        src={preset.url}
                        alt={preset.name}
                        productName={preset.th || preset.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_2px_8px_rgba(168,85,247,0.3)]"
                      />
                      {isSelected && (
                        <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white group-hover:text-purple-300 truncate">
                        {preset.th}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          preset.rarity === 'Mythical' ? 'bg-amber-500/20 text-amber-400' :
                          preset.rarity === 'Legendary' ? 'bg-purple-500/20 text-purple-400' :
                          preset.rarity === 'Rare' ? 'bg-cyan-500/20 text-cyan-400' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {preset.rarity || preset.category}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#212133] bg-[#151524] text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
