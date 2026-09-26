import React, { useState } from 'react';
import { 
  X, 
  Calculator, 
  Plus, 
  Trash2, 
  ArrowRightLeft, 
  Flame, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  ShoppingBag,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { BloxImage } from './BloxImage';
import { playClickSound } from '../lib/sound';

interface FruitValueItem {
  id: string;
  name: string;
  th: string;
  value: number; // Trading value in Millions
  beliPrice: string;
  demand: 'Very High' | 'High' | 'Medium' | 'Low';
  rarity: 'Mythical' | 'Legendary' | 'Rare' | 'Uncommon' | 'Common';
  img: string;
  shopMatch?: string; // Query keyword to find in shop
}

const BLOX_FRUITS_VALUES: FruitValueItem[] = [
  { id: 'kitsune', name: 'Kitsune', th: 'ผลคิตสึเนะ', value: 120_000_000, beliPrice: '8,000,000', demand: 'Very High', rarity: 'Mythical', img: '/images/blox/kitsune.png', shopMatch: 'คิตสึเนะ' },
  { id: 'dragon', name: 'Dragon (Rework)', th: 'ผลมังกร', value: 180_000_000, beliPrice: '10,000,000', demand: 'Very High', rarity: 'Mythical', img: '/images/blox/dragon.png', shopMatch: 'มังกร' },
  { id: 'leopard', name: 'Leopard', th: 'ผลเสือดาว', value: 45_000_000, beliPrice: '5,000,000', demand: 'Very High', rarity: 'Mythical', img: '/images/blox/leopard.png', shopMatch: 'เสือดาว' },
  { id: 'dough', name: 'Dough', th: 'ผลโมจิ', value: 25_000_000, beliPrice: '2,800,000', demand: 'Very High', rarity: 'Mythical', img: '/images/blox/dough.png', shopMatch: 'โมจิ' },
  { id: 'trex', name: 'T-Rex', th: 'ผลทีเร็กซ์', value: 20_000_000, beliPrice: '2,700,000', demand: 'High', rarity: 'Mythical', img: '/images/blox/trex.png', shopMatch: 'ทีเร็กซ์' },
  { id: 'mammoth', name: 'Mammoth', th: 'ผลช้างแมมมอธ', value: 12_500_000, beliPrice: '2,700,000', demand: 'Medium', rarity: 'Mythical', img: '/images/blox/mammoth.png', shopMatch: 'แมมมอธ' },
  { id: 'spirit', name: 'Spirit', th: 'ผลสปิริต', value: 9_500_000, beliPrice: '3,400,000', demand: 'Medium', rarity: 'Mythical', img: '/images/blox/spirit.png', shopMatch: 'สปิริต' },
  { id: 'venom', name: 'Venom', th: 'ผลเวน่อม (พิษ)', value: 9_000_000, beliPrice: '3,000,000', demand: 'Medium', rarity: 'Mythical', img: '/images/blox/venom.png', shopMatch: 'เวน่อม' },
  { id: 'shadow', name: 'Shadow', th: 'ผลเงา', value: 6_000_000, beliPrice: '2,900,000', demand: 'Medium', rarity: 'Mythical', img: '/images/blox/shadow.png', shopMatch: 'เงา' },
  { id: 'buddha', name: 'Buddha', th: 'ผลพระพุทธ', value: 8_500_000, beliPrice: '1,200,000', demand: 'Very High', rarity: 'Legendary', img: '/images/blox/buddha.png', shopMatch: 'พระ' },
  { id: 'portal', name: 'Portal', th: 'ผลประตู (พอร์ทัล)', value: 6_500_000, beliPrice: '1,900,000', demand: 'Very High', rarity: 'Legendary', img: '/images/blox/portal.png', shopMatch: 'ประตู' },
  { id: 'blizzard', name: 'Blizzard', th: 'ผลหิมะบลิซซาร์ด', value: 5_000_000, beliPrice: '2,400,000', demand: 'Medium', rarity: 'Legendary', img: '/images/blox/blizzard.png', shopMatch: 'บลิซซาร์ด' },
  { id: 'rumble', name: 'Rumble', th: 'ผลสายฟ้า', value: 5_500_000, beliPrice: '2,100,000', demand: 'High', rarity: 'Legendary', img: '/images/blox/rumble.png', shopMatch: 'สายฟ้า' },
  { id: 'sound', name: 'Sound', th: 'ผลเสียง', value: 4_000_000, beliPrice: '1,700,000', demand: 'Medium', rarity: 'Legendary', img: '/images/blox/sound.png', shopMatch: 'เสียง' },
  { id: 'phoenix', name: 'Phoenix', th: 'ผลฟีนิกซ์', value: 3_500_000, beliPrice: '1,800,000', demand: 'Low', rarity: 'Legendary', img: '/images/blox/phoenix.png', shopMatch: 'ฟีนิกซ์' },
  { id: 'magma', name: 'Magma', th: 'ผลแมกม่า', value: 2_000_000, beliPrice: '850,000', demand: 'High', rarity: 'Rare', img: '/images/blox/magma.png', shopMatch: 'แมกม่า' },
  { id: 'light', name: 'Light', th: 'ผลแสง', value: 1_800_000, beliPrice: '650,000', demand: 'Medium', rarity: 'Rare', img: '/images/blox/light.png', shopMatch: 'แสง' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onShopSearch?: (keyword: string) => void;
}

export const BloxValueCalculatorModal: React.FC<Props> = ({ isOpen, onClose, onShopSearch }) => {
  const [myFruits, setMyFruits] = useState<FruitValueItem[]>([BLOX_FRUITS_VALUES[0]]); // default Kitsune
  const [theirFruits, setTheirFruits] = useState<FruitValueItem[]>([BLOX_FRUITS_VALUES[1]]); // default Dragon
  const [activeSide, setActiveSide] = useState<'my' | 'their'>('my');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const myTotal = myFruits.reduce((sum, f) => sum + f.value, 0);
  const theirTotal = theirFruits.reduce((sum, f) => sum + f.value, 0);

  // Trade difference calculation
  const diff = theirTotal - myTotal;
  const percentDiff = myTotal > 0 ? (diff / myTotal) * 100 : 0;

  // Trade verdict (Blox Fruits Trade Rule: within 40% Beli price in-game, but value trading is based on community value)
  let verdict: { title: string; desc: string; color: string; badge: string } = {
    title: 'FAIR TRADE (สมดุล)',
    desc: 'มูลค่าการเทรดใกล้เคียงกัน ยุติธรรมทั้งสองฝ่าย',
    color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    badge: '⚖️ FAIR'
  };

  if (percentDiff > 15) {
    verdict = {
      title: 'BIG WIN (กำไรเยอะมาก! W)',
      desc: 'คุณได้ผลที่มูลค่าสูงกว่าผลของคุณ คุ้มค่ามากๆ แนะนำให้เทรด',
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
      badge: '🔥 BIG W'
    };
  } else if (percentDiff > 5) {
    verdict = {
      title: 'SMALL WIN (กำไรเล็กน้อย W)',
      desc: 'คุณได้กำไรเล็กน้อย ถือว่าการเทรดนี้ได้เปรียบ',
      color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
      badge: '✨ WIN'
    };
  } else if (percentDiff < -15) {
    verdict = {
      title: 'BIG LOSE (ขาดทุนหนัก! L)',
      desc: 'คุณให้ของมูลค่าแพงกว่าที่ได้รับมาก ไม่แนะนำให้เทรดข้อเสนอนี้',
      color: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
      badge: '⚠️ BIG L'
    };
  } else if (percentDiff < -5) {
    verdict = {
      title: 'SMALL LOSE (ขาดทุนเล็กน้อย L)',
      desc: 'มูลค่าที่คุณให้มากกว่าที่ได้เล็กน้อย ควรพิจารณา',
      color: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
      badge: '📉 SMALL L'
    };
  }

  const handleAddFruit = (fruit: FruitValueItem) => {
    playClickSound();
    if (activeSide === 'my') {
      if (myFruits.length < 4) {
        setMyFruits([...myFruits, fruit]);
      }
    } else {
      if (theirFruits.length < 4) {
        setTheirFruits([...theirFruits, fruit]);
      }
    }
    setPickerOpen(false);
  };

  const handleRemoveFruit = (index: number, side: 'my' | 'their') => {
    playClickSound();
    if (side === 'my') {
      setMyFruits(myFruits.filter((_, i) => i !== index));
    } else {
      setTheirFruits(theirFruits.filter((_, i) => i !== index));
    }
  };

  const formatMillions = (val: number) => {
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(1).replace('.0', '')}M`;
    }
    return val.toLocaleString();
  };

  const filteredPickerFruits = BLOX_FRUITS_VALUES.filter(f => 
    f.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
    f.th.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn max-w-[100vw] overflow-x-hidden [overscroll-behavior-x:none] [touch-action:pan-y_pinch-zoom]">
      <div className="relative w-full max-w-4xl bg-[#0D0D16] border border-purple-500/30 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] [overscroll-behavior-x:none]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 bg-[#12121E]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 truncate">
                <h3 className="text-sm sm:text-lg font-black text-white truncate">Blox Fruits Trade Calculator</h3>
                <span className="text-[9px] sm:text-[10px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                  Update 2026
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">เครื่องคำนวณและประเมินราคากลางผลปีศาจ เทียบข้อเสนอ W/F/L</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 sm:p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Verdict Banner */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border ${verdict.color} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2 py-0.5 rounded-md bg-black/40">
                  {verdict.badge}
                </span>
                <span className="text-sm sm:text-base font-black">
                  {verdict.title}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1">{verdict.desc}</p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="text-xs text-zinc-400 block">ส่วนต่างมูลค่า:</span>
              <span className={`text-base sm:text-lg font-black ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {diff >= 0 ? '+' : ''}{formatMillions(diff)} ({percentDiff > 0 ? '+' : ''}{percentDiff.toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Trade Sides Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            
            {/* Left: You Offer */}
            <div className="p-3.5 sm:p-5 rounded-2xl bg-[#11111C] border border-purple-500/20 flex flex-col justify-between space-y-4 min-w-0">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <h4 className="text-xs sm:text-sm font-bold text-white">ข้อเสนอของคุณ (You Offer)</h4>
                    <span className="text-xs text-zinc-500">({myFruits.length}/4)</span>
                  </div>
                  <span className="text-xs font-bold text-purple-400">
                    มูลค่า: <strong>{formatMillions(myTotal)}</strong>
                  </span>
                </div>

                {/* Fruit Slots */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-2.5">
                  {myFruits.map((fruit, idx) => (
                    <div 
                      key={idx}
                      className="relative p-2 sm:p-2.5 rounded-xl bg-[#171726] border border-white/10 flex items-center gap-2 group min-w-0 overflow-hidden"
                    >
                      <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0">
                        <BloxImage
                          src={fruit.img}
                          alt={fruit.name}
                          productName={fruit.th}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{fruit.th}</p>
                        <p className="text-[10px] text-purple-300 font-extrabold">{formatMillions(fruit.value)}</p>
                        <span className="text-[9px] text-zinc-500 block truncate">Demand: {fruit.demand}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveFruit(idx, 'my')}
                        className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer shrink-0"
                        title="ลบออก"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Slot Button */}
                  {myFruits.length < 4 && (
                    <button
                      onClick={() => {
                        setActiveSide('my');
                        setPickerOpen(true);
                      }}
                      className="p-2.5 sm:p-3 rounded-xl border border-dashed border-white/20 hover:border-purple-400/60 bg-white/5 hover:bg-purple-900/20 flex flex-col items-center justify-center text-zinc-400 hover:text-purple-300 transition-all cursor-pointer min-h-[64px]"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1" />
                      <span className="text-[11px] font-semibold">+ เพิ่มผลปีศาจ</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-400">
                <span>ราคา Beli รวมในเกม:</span>
                <span className="text-zinc-200 font-bold">
                  ฿{myFruits.reduce((acc, f) => acc + parseInt(f.beliPrice.replace(/,/g, '')), 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Right: They Offer */}
            <div className="p-3.5 sm:p-5 rounded-2xl bg-[#11111C] border border-cyan-500/20 flex flex-col justify-between space-y-4 min-w-0">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <h4 className="text-xs sm:text-sm font-bold text-white">ข้อเสนอของอีกฝ่าย (They Offer)</h4>
                    <span className="text-xs text-zinc-500">({theirFruits.length}/4)</span>
                  </div>
                  <span className="text-xs font-bold text-cyan-400">
                    มูลค่า: <strong>{formatMillions(theirTotal)}</strong>
                  </span>
                </div>

                {/* Fruit Slots */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-2.5">
                  {theirFruits.map((fruit, idx) => (
                    <div 
                      key={idx}
                      className="relative p-2 sm:p-2.5 rounded-xl bg-[#171726] border border-white/10 flex items-center gap-2 group min-w-0 overflow-hidden"
                    >
                      <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0">
                        <BloxImage
                          src={fruit.img}
                          alt={fruit.name}
                          productName={fruit.th}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{fruit.th}</p>
                        <p className="text-[10px] text-cyan-300 font-extrabold">{formatMillions(fruit.value)}</p>
                        <span className="text-[9px] text-zinc-500 block truncate">Demand: {fruit.demand}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveFruit(idx, 'their')}
                        className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer shrink-0"
                        title="ลบออก"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Slot Button */}
                  {theirFruits.length < 4 && (
                    <button
                      onClick={() => {
                        setActiveSide('their');
                        setPickerOpen(true);
                      }}
                      className="p-2.5 sm:p-3 rounded-xl border border-dashed border-white/20 hover:border-cyan-400/60 bg-white/5 hover:bg-cyan-900/20 flex flex-col items-center justify-center text-zinc-400 hover:text-cyan-300 transition-all cursor-pointer min-h-[64px]"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1" />
                      <span className="text-[11px] font-semibold">+ เพิ่มผลปีศาจ</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                <span>ราคา Beli รวมในเกม:</span>
                <span className="text-zinc-200 font-bold">
                  ฿{theirFruits.reduce((acc, f) => acc + parseInt(f.beliPrice.replace(/,/g, '')), 0).toLocaleString()}
                </span>
              </div>
            </div>

          </div>

          {/* Quick Shop Action Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-[#141026] to-indigo-950/60 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/30 flex items-center justify-center text-purple-300 shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-white">ต้องการผลที่ขาดอยู่สำหรับเทรด?</h5>
                <p className="text-[11px] text-zinc-300 mt-0.5">ซื้อผลปีศาจแท้จาก AngusShop ส่งมอบไวใน 3 นาที เข้าเซิร์ฟเวอร์ VIP เทรดได้ทันที</p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                if (onShopSearch) onShopSearch('ผลปีศาจ');
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs whitespace-nowrap shadow-lg shadow-purple-600/30 cursor-pointer transition-all active:scale-95"
            >
              ไปหน้าร้านซื้อผลปีศาจ
            </button>
          </div>

        </div>

        {/* Fruit Picker Sub-Modal */}
        {pickerOpen && (
          <div className="absolute inset-0 z-20 bg-[#090910]/95 backdrop-blur-md p-4 sm:p-6 flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  เลือกผลปีศาจสำหรับ {activeSide === 'my' ? 'ข้อเสนอของคุณ' : 'ข้อเสนออีกฝ่าย'}
                </h4>
                <p className="text-xs text-zinc-400">คลิกที่ผลปีศาจเพื่อเพิ่มลงในช่องเทรด</p>
              </div>
              <button
                onClick={() => setPickerOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-3">
              <input
                type="text"
                placeholder="ค้นหาชื่อผลปีศาจ เช่น คิตสึเนะ, โมจิ, มังกร, พระ..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-[#12121E] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pr-1">
              {filteredPickerFruits.map((fruit) => (
                <div
                  key={fruit.id}
                  onClick={() => handleAddFruit(fruit)}
                  className="p-2.5 rounded-xl bg-[#141422] hover:bg-purple-900/30 border border-white/5 hover:border-purple-500/50 transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <div className="w-10 h-10 shrink-0">
                    <BloxImage
                      src={fruit.img}
                      alt={fruit.name}
                      productName={fruit.th}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white group-hover:text-purple-300 truncate">{fruit.th}</p>
                    <p className="text-[10px] text-amber-400 font-black">{formatMillions(fruit.value)}</p>
                    <span className="text-[9px] text-zinc-400 truncate block">Beli: {fruit.beliPrice}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
