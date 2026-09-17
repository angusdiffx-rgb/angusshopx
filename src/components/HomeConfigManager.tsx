import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Gamepad2, 
  ShoppingBag, 
  CheckCircle2, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Search, 
  ExternalLink, 
  Eye, 
  Sliders, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  Layers, 
  X,
  RefreshCw,
  Upload
} from 'lucide-react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from '../context/ToastContext';
import { HomeConfig, TrendingFruitItem, PromoShowcaseCard } from '../types';
import { BLOX_FRUITS_PRESETS, DEFAULT_HOME_CONFIG, BloxPreset } from '../data/bloxPresets';
import { BloxImage } from './BloxImage';

export const HomeConfigManager: React.FC = () => {
  const { success, error: toastError } = useToast();
  
  const [config, setConfig] = useState<HomeConfig>(DEFAULT_HOME_CONFIG);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'logo' | 'hero' | 'trending' | 'promo'>('all');

  // Preset picker modal state
  const [presetModalTarget, setPresetModalTarget] = useState<{
    type: 'trending' | 'promoCard1' | 'promoCard2';
    index?: number;
  } | null>(null);
  const [presetSearch, setPresetSearch] = useState('');
  const [presetFilterCategory, setPresetFilterCategory] = useState<'all' | 'fruit' | 'gamepass' | 'sword' | 'style'>('all');

  // Load from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'homeConfig'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as HomeConfig;
        setConfig({
          ...DEFAULT_HOME_CONFIG,
          ...data,
          trendingItems: data.trendingItems?.length ? data.trendingItems : DEFAULT_HOME_CONFIG.trendingItems,
          promoCard1: data.promoCard1 || DEFAULT_HOME_CONFIG.promoCard1,
          promoCard2: data.promoCard2 || DEFAULT_HOME_CONFIG.promoCard2,
        });
      }
      setLoading(false);
    }, (err) => {
      console.warn('Error loading homeConfig:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Save changes to Firestore
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Also call server API as fallback/logging
      const res = await fetch('/api/admin/update-home-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });

      if (!res.ok) {
        // Direct setDoc fallback if API had issue
        await setDoc(doc(db, 'settings', 'homeConfig'), {
          ...config,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      success('บันทึกการตกแต่งหน้าแรกและแบนเนอร์เรียบร้อยแล้ว! หน้าเว็บอัปเดตทันที');
    } catch (err: any) {
      console.error('Save Home Config Error:', err);
      try {
        await setDoc(doc(db, 'settings', 'homeConfig'), {
          ...config,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        success('บันทึกข้อมูลหน้าแรกเรียบร้อยแล้ว');
      } catch (innerErr: any) {
        toastError('ไม่สามารถบันทึกข้อมูลได้: ' + (innerErr.message || 'โปรดลองใหม่อีกครั้ง'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldUpdater: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toastError('ขนาดไฟล์เริ่มต้นต้องไม่เกิน 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // ย่อขนาดรูปภาพให้กว้าง/ยาวสูงสุด 400px เพื่อประหยัดพื้นที่ฐานข้อมูล
        const MAX_DIMENSION = 400; 
        
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // บีบอัดเป็น WebP (คุณภาพ 80%) เพื่อให้ขนาดเล็กลงมากที่สุด
          const dataUrl = canvas.toDataURL('image/webp', 0.8);
          
          if (dataUrl.length > 800 * 1024) {
             toastError('รูปภาพมีขนาดใหญ่เกินไปแม้จะบีบอัดแล้ว กรุณาใช้รูปภาพที่รายละเอียดน้อยกว่านี้');
             return;
          }
          
          fieldUpdater(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลหน้าแรกและแบนเนอร์กลับเป็นค่าเริ่มต้นหรือไม่?')) {
      setConfig(DEFAULT_HOME_CONFIG);
      success('รีเซ็ตกลับเป็นค่าเริ่มต้นแล้ว (อย่าลืมกดบันทึก)');
    }
  };

  // Trending items handlers
  const handleUpdateTrendingItem = (index: number, field: keyof TrendingFruitItem, value: string) => {
    setConfig(prev => {
      const items = [...prev.trendingItems];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, trendingItems: items };
    });
  };

  const handleAddTrendingItem = () => {
    if (config.trendingItems.length >= 12) {
      toastError('สามารถเพิ่มได้สูงสุด 12 รายการ');
      return;
    }
    const newItem: TrendingFruitItem = {
      id: 'trend-' + Date.now(),
      name: 'New Fruit',
      th: 'ผลใหม่',
      price: '฿199',
      img: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/6/65/Kitsune_Fruit.png/revision/latest',
      rarity: 'Mythical'
    };
    setConfig(prev => ({
      ...prev,
      trendingItems: [...prev.trendingItems, newItem]
    }));
  };

  const handleRemoveTrendingItem = (index: number) => {
    if (config.trendingItems.length <= 1) {
      toastError('ต้องมีอย่างน้อย 1 รายการ');
      return;
    }
    setConfig(prev => ({
      ...prev,
      trendingItems: prev.trendingItems.filter((_, i) => i !== index)
    }));
  };

  const handleMoveTrendingItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.trendingItems.length) return;

    setConfig(prev => {
      const items = [...prev.trendingItems];
      const temp = items[index];
      items[index] = items[targetIndex];
      items[targetIndex] = temp;
      return { ...prev, trendingItems: items };
    });
  };

  // Apply chosen preset to target
  const handleSelectPreset = (preset: BloxPreset) => {
    if (!presetModalTarget) return;

    if (presetModalTarget.type === 'trending' && presetModalTarget.index !== undefined) {
      handleUpdateTrendingItem(presetModalTarget.index, 'name', preset.name);
      handleUpdateTrendingItem(presetModalTarget.index, 'th', preset.th.replace(/\s*\(.*?\)/, ''));
      handleUpdateTrendingItem(presetModalTarget.index, 'img', preset.url);
      if (preset.rarity) {
        handleUpdateTrendingItem(presetModalTarget.index, 'rarity', preset.rarity);
      }
    } else if (presetModalTarget.type === 'promoCard1') {
      setConfig(prev => ({
        ...prev,
        promoCard1: {
          ...prev.promoCard1,
          name: preset.th.replace(/\s*\(.*?\)/, ''),
          tag: `${preset.rarity || 'Mythical'} • ฿299`,
          img: preset.url,
          keyword: preset.th.replace(/\s*\(.*?\)/, '')
        }
      }));
    } else if (presetModalTarget.type === 'promoCard2') {
      setConfig(prev => ({
        ...prev,
        promoCard2: {
          ...prev.promoCard2,
          name: preset.th.replace(/\s*\(.*?\)/, ''),
          tag: `${preset.rarity || 'Mythical'} • ฿249`,
          img: preset.url,
          keyword: preset.th.replace(/\s*\(.*?\)/, '')
        }
      }));
    }

    setPresetModalTarget(null);
    success(`เลือกรูป ${preset.th} เรียบร้อยแล้ว`);
  };

  // Filter presets
  const filteredPresets = BLOX_FRUITS_PRESETS.filter(p => {
    const matchesSearch = presetSearch.trim() === '' || 
      p.name.toLowerCase().includes(presetSearch.toLowerCase()) || 
      p.th.toLowerCase().includes(presetSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (presetFilterCategory === 'fruit') return p.category === 'ผลปีศาจ';
    if (presetFilterCategory === 'gamepass') return p.category === 'Gamepass';
    if (presetFilterCategory === 'sword') return p.subType === 'Sword' || p.subType === 'Gun' || p.category === 'ไอเทม';
    if (presetFilterCategory === 'style') return p.subType === 'FightingStyle' || p.category === 'บริการ';
    return true;
  });

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-400 mb-3" />
        <p className="text-xs">กำลังโหลดข้อมูลการตั้งค่าหน้าแรก...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header & Save Button Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#131024] to-[#10101C] border border-purple-500/30 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>CUSTOM HOME & HERO SETTINGS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">จัดการข้อมูลหน้าแรกและแบนเนอร์</h2>
          <p className="text-xs text-zinc-400 mt-1">
            ปรับเปลี่ยนข้อความ ราคา รูปภาพแถบผลยอดนิยม และแบนเนอร์จัดส่งด่วน Blox Fruits ได้ตามต้องการ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="รีเซ็ตกลับเป็นค่าเริ่มต้น"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">รีเซ็ตเริ่มต้น</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:brightness-110 active:scale-95 text-white text-xs font-bold shadow-lg shadow-purple-600/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>บันทึกการตั้งค่าหน้าแรก</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub Tabs Selection */}
      <div className="flex items-center gap-2 border-b border-[#212133] pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'all'
              ? 'bg-[#1C1C2C] text-purple-300 border border-purple-500/40'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          แก้ไขทั้งหมด (All Sections)
        </button>
        <button
          onClick={() => setActiveSubTab('logo')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'logo'
              ? 'bg-[#1C1C2C] text-purple-300 border border-purple-500/40'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
          <span>โลโก้เว็บไซต์</span>
        </button>
        <button
          onClick={() => setActiveSubTab('hero')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'hero'
              ? 'bg-[#1C1C2C] text-purple-300 border border-purple-500/40'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>ข้อความส่วนบน (Hero & Stats)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('trending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'trending'
              ? 'bg-[#1C1C2C] text-purple-300 border border-purple-500/40'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>แถบผลปีศาจยอดนิยมประจำสัปดาห์</span>
        </button>
        <button
          onClick={() => setActiveSubTab('promo')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'promo'
              ? 'bg-[#1C1C2C] text-purple-300 border border-purple-500/40'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>แบนเนอร์ไฮไลท์ส่งมอบไว (Hero Promo)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SECTION 0: โลโก้เว็บไซต์ (Site Logo) */}
      {/* ======================================================== */}
      {(activeSubTab === 'all' || activeSubTab === 'logo') && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#11111A] border border-[#212133] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E1E2E]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">โลโก้เว็บไซต์</h3>
                <p className="text-xs text-zinc-400">เปลี่ยนรูปโลโก้ที่แสดงบนแถบเมนูด้านบน</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              URL รูปภาพโลโก้
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-[#0A0A14] border border-[#2C2C40] shrink-0 p-1 flex items-center justify-center overflow-hidden">
                <img
                  src={config.siteLogo || DEFAULT_HOME_CONFIG.siteLogo}
                  alt="Site Logo"
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://tr.rbxcdn.com/180DAY-774ec14539b264f85fdb6e8a34dfa344/512/512/Image/Png/noFilter';
                  }}
                />
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={config.siteLogo || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, siteLogo: e.target.value }))}
                  placeholder="https://... หรืออัปโหลดจากเครื่อง"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#161624] border border-[#25253A] text-white text-xs focus:outline-none focus:border-purple-500"
                />
                <label className="shrink-0 px-3.5 py-2.5 bg-[#2A2A40] hover:bg-[#3A3A50] border border-[#3A3A50] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-2 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>อัปโหลด</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, (base64) => setConfig(prev => ({ ...prev, siteLogo: base64 })))}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 1.5: Hero & Stats */}
      {/* ======================================================== */}
      {(activeSubTab === 'all' || activeSubTab === 'hero') && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#11111A] border border-[#212133] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E1E2E]">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                ข้อความส่วนบนและสถิติ (Hero & Stats)
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1">ปรับเปลี่ยนข้อความต้อนรับและสถิติใต้ปุ่มเติมเงิน</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-300">ส่วนหัว (Hero Text)</h4>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Hero Title (ข้อความหลัก)
                </label>
                <input
                  type="text"
                  value={config.heroTitle ?? DEFAULT_HOME_CONFIG.heroTitle}
                  onChange={(e) => setConfig(prev => ({ ...prev, heroTitle: e.target.value }))}
                  placeholder="ANGUS SHOP"
                  className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-[#25253A] text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Hero Subtitle (รายละเอียด)
                </label>
                <textarea
                  value={config.heroSubtitle ?? DEFAULT_HOME_CONFIG.heroSubtitle}
                  onChange={(e) => setConfig(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-[#25253A] text-white text-xs focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Top Status Tag (ข้อความด้านบนสุด)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.heroBadgeText ?? DEFAULT_HOME_CONFIG.heroBadgeText}
                    onChange={(e) => setConfig(prev => ({ ...prev, heroBadgeText: e.target.value }))}
                    placeholder="ROBLOX VERIFIED"
                    className="w-1/3 px-3 py-2 rounded-xl bg-[#161624] border border-[#25253A] text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    value={config.heroStatusText ?? DEFAULT_HOME_CONFIG.heroStatusText}
                    onChange={(e) => setConfig(prev => ({ ...prev, heroStatusText: e.target.value }))}
                    placeholder="ร้านผลปีศาจ Blox Fruits อัตโนมัติ 24 ชม."
                    className="w-2/3 px-3 py-2 rounded-xl bg-[#161624] border border-[#25253A] text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Button Text (ข้อความปุ่มซื้อ)
                </label>
                <input
                  type="text"
                  value={config.heroButtonText ?? DEFAULT_HOME_CONFIG.heroButtonText}
                  onChange={(e) => setConfig(prev => ({ ...prev, heroButtonText: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-[#25253A] text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-300">สถิติ (Stats Bar)</h4>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Stat 1 Label (เช่น ลูกค้าไว้วางใจ)
                </label>
                <input
                  type="text"
                  value={config.stat1Label ?? DEFAULT_HOME_CONFIG.stat1Label}
                  onChange={(e) => setConfig(prev => ({ ...prev, stat1Label: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-[#25253A] text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Stat 2 Label (เช่น สินค้าคุณภาพ)
                </label>
                <input
                  type="text"
                  value={config.stat2Label ?? DEFAULT_HOME_CONFIG.stat2Label}
                  onChange={(e) => setConfig(prev => ({ ...prev, stat2Label: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-[#25253A] text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Stat 3 Label (เช่น รับประกัน)
                </label>
                <input
                  type="text"
                  value={config.stat3Label ?? DEFAULT_HOME_CONFIG.stat3Label}
                  onChange={(e) => setConfig(prev => ({ ...prev, stat3Label: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-[#25253A] text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Stat 4 Label (เช่น บริการ 24 ชม.)
                </label>
                <input
                  type="text"
                  value={config.stat4Label ?? DEFAULT_HOME_CONFIG.stat4Label}
                  onChange={(e) => setConfig(prev => ({ ...prev, stat4Label: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-[#25253A] text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 1: แถบผลปีศาจยอดนิยมประจำสัปดาห์ (Trending Ribbon) */}
      {/* ======================================================== */}
      {(activeSubTab === 'all' || activeSubTab === 'trending') && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#11111A] border border-[#212133] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E1E2E]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">แถบผลปีศาจยอดนิยมประจำสัปดาห์</h3>
                <p className="text-xs text-zinc-400">แก้ไขหัวข้อ ป้ายกำกับ และผลไม้ที่แสดงในแถบยอดนิยม 6 ชิ้นหน้าแรก</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddTrendingItem}
              className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มสินค้าในแถบ</span>
            </button>
          </div>

          {/* Section Titles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                ข้อความหัวข้อแถบ (Section Title)
              </label>
              <input
                type="text"
                value={config.trendingTitle}
                onChange={(e) => setConfig(prev => ({ ...prev, trendingTitle: e.target.value }))}
                placeholder="ผลปีศาจยอดนิยมประจำสัปดาห์ (ยอดสั่งซื้อสูงสุด)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#161624] border border-[#25253A] text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                ข้อความป้ายมุมขวา (Badge Tag)
              </label>
              <input
                type="text"
                value={config.trendingBadge}
                onChange={(e) => setConfig(prev => ({ ...prev, trendingBadge: e.target.value }))}
                placeholder="VIP Server พร้อมเทรด"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#161624] border border-[#25253A] text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Trending Items List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-300">
                รายการสินค้าในแถบ ({config.trendingItems.length} รายการ)
              </span>
              <span className="text-[11px] text-zinc-400">
                *คลิกที่ปุ่ม <span className="text-purple-400 font-bold">"เลือกรูปจากเกม"</span> เพื่อเลือกผลปีศาจและดาบที่มีในเกมทั้งหมด
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {config.trendingItems.map((item, idx) => (
                <div 
                  key={item.id || idx}
                  className="p-3.5 rounded-xl bg-[#151522] border border-[#232338] space-y-3 relative group"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-[140px]">{item.th || item.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveTrendingItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-[#202032] text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="ย้ายขึ้น"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveTrendingItem(idx, 'down')}
                        disabled={idx === config.trendingItems.length - 1}
                        className="p-1 rounded bg-[#202032] text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="ย้ายลง"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveTrendingItem(idx)}
                        className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-xl bg-[#0D0D16] border border-white/10 shrink-0 p-1 flex items-center justify-center overflow-hidden">
                      <BloxImage
                        src={item.img}
                        alt={item.name}
                        productName={item.th || item.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div>
                        <input
                          type="text"
                          value={item.th}
                          onChange={(e) => handleUpdateTrendingItem(idx, 'th', e.target.value)}
                          placeholder="ชื่อภาษาไทย เช่น คิตสึเนะ"
                          className="w-full px-2.5 py-1 rounded-lg bg-[#1D1D2E] border border-[#2B2B42] text-white text-xs font-bold"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.price}
                          onChange={(e) => handleUpdateTrendingItem(idx, 'price', e.target.value)}
                          placeholder="ราคา เช่น ฿299"
                          className="w-24 px-2 py-1 rounded-lg bg-[#1D1D2E] border border-[#2B2B42] text-cyan-400 text-xs font-black"
                        />
                        <button
                          type="button"
                          onClick={() => setPresetModalTarget({ type: 'trending', index: idx })}
                          className="flex-1 px-2 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-[11px] font-bold truncate flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ImageIcon className="w-3 h-3" />
                          <span>เลือกรูปผลไม้</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-0.5">ลิงก์ URL รูปภาพโดยตรง:</label>
                    <input
                      type="text"
                      value={item.img}
                      onChange={(e) => handleUpdateTrendingItem(idx, 'img', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2 py-1 rounded-lg bg-[#101018] border border-white/5 text-[10px] text-zinc-300 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: แบนเนอร์ไฮไลท์ส่งมอบไว (Hero Promo Delivery Banner) */}
      {/* ======================================================== */}
      {(activeSubTab === 'all' || activeSubTab === 'promo') && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#11111A] border border-[#212133] space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#1E1E2E]">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">แบนเนอร์ไฮไลท์ส่งมอบไว (Fast & Secure Delivery)</h3>
              <p className="text-xs text-zinc-400">แก้ไขข้อความพาดหัว คำบรรยาย ปุ่มกด และการ์ดโชว์ผลไม้ 2 ชิ้นด้านขวา</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left side text config */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                ข้อความด้านซ้าย (Headline & Details)
              </h4>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ป้ายด้านบน (Badge Pill)
                </label>
                <input
                  type="text"
                  value={config.promoBadge}
                  onChange={(e) => setConfig(prev => ({ ...prev, promoBadge: e.target.value }))}
                  placeholder="FAST & SECURE ROBLOX DELIVERY"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#161624] border border-[#25253A] text-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  หัวข้อหลัก (Main Heading Title)
                </label>
                <textarea
                  rows={2}
                  value={config.promoTitle}
                  onChange={(e) => setConfig(prev => ({ ...prev, promoTitle: e.target.value }))}
                  placeholder="รับผลปีศาจและ Gamepass แท้ 100% ส่งมอบรวดเร็วใน 3 นาที"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#161624] border border-[#25253A] text-white text-xs font-bold leading-relaxed resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  คำบรรยายย่อย (Description)
                </label>
                <textarea
                  rows={3}
                  value={config.promoDescription}
                  onChange={(e) => setConfig(prev => ({ ...prev, promoDescription: e.target.value }))}
                  placeholder="ระบบส่งมอบอัตโนมัติ 24 ชั่วโมง..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#161624] border border-[#25253A] text-zinc-300 text-xs leading-relaxed resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    ข้อความปุ่ม 1 (ปุ่มหลัก)
                  </label>
                  <input
                    type="text"
                    value={config.promoButtonText}
                    onChange={(e) => setConfig(prev => ({ ...prev, promoButtonText: e.target.value }))}
                    placeholder="ช้อปผลปีศาจตอนนี้เลย"
                    className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-[#25253A] text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    ข้อความปุ่ม 2 (ปุ่มรอง)
                  </label>
                  <input
                    type="text"
                    value={config.promoSecondaryButtonText}
                    onChange={(e) => setConfig(prev => ({ ...prev, promoSecondaryButtonText: e.target.value }))}
                    placeholder="ดูเฉพาะผลปีศาจ"
                    className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-[#25253A] text-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Right side showcase cards config */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                การ์ดโชว์ผลไม้ 2 ชิ้นด้านขวา (Showcase Cards)
              </h4>

              {/* Card 1 */}
              <div className="p-4 rounded-xl bg-[#151524] border border-[#26263D] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300">การ์ดที่ 1 (ซ้าย)</span>
                  <button
                    type="button"
                    onClick={() => setPresetModalTarget({ type: 'promoCard1' })}
                    className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>เลือกผลไม้/ไอเทม</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">ชื่อที่แสดง</label>
                    <input
                      type="text"
                      value={config.promoCard1?.name || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        promoCard1: { ...prev.promoCard1, name: e.target.value }
                      }))}
                      placeholder="ผลคิตสึเนะ"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#1C1C2C] border border-[#2A2A40] text-white text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">ป้ายกำกับ/ราคา</label>
                    <input
                      type="text"
                      value={config.promoCard1?.tag || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        promoCard1: { ...prev.promoCard1, tag: e.target.value }
                      }))}
                      placeholder="Mythical • ฿299"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#1C1C2C] border border-[#2A2A40] text-amber-400 text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">URL รูปภาพ</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={config.promoCard1?.img || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        promoCard1: { ...prev.promoCard1, img: e.target.value }
                      }))}
                      placeholder="https://... หรืออัปโหลด"
                      className="w-full px-2.5 py-1 rounded-lg bg-[#101018] border border-white/5 text-[10px] text-zinc-300 font-mono"
                    />
                    <label className="shrink-0 px-2 py-1 bg-[#2A2A40] hover:bg-[#3A3A50] text-white text-[10px] font-bold rounded-lg cursor-pointer flex items-center justify-center transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, (base64) => setConfig(prev => ({
                          ...prev,
                          promoCard1: { ...prev.promoCard1, img: base64 }
                        })))}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-4 rounded-xl bg-[#151524] border border-[#26263D] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300">การ์ดที่ 2 (ขวา)</span>
                  <button
                    type="button"
                    onClick={() => setPresetModalTarget({ type: 'promoCard2' })}
                    className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>เลือกผลไม้/ไอเทม</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">ชื่อที่แสดง</label>
                    <input
                      type="text"
                      value={config.promoCard2?.name || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        promoCard2: { ...prev.promoCard2, name: e.target.value }
                      }))}
                      placeholder="ผลมังกร"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#1C1C2C] border border-[#2A2A40] text-white text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">ป้ายกำกับ/ราคา</label>
                    <input
                      type="text"
                      value={config.promoCard2?.tag || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        promoCard2: { ...prev.promoCard2, tag: e.target.value }
                      }))}
                      placeholder="Mythical • ฿249"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#1C1C2C] border border-[#2A2A40] text-amber-400 text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">URL รูปภาพ</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={config.promoCard2?.img || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        promoCard2: { ...prev.promoCard2, img: e.target.value }
                      }))}
                      placeholder="https://... หรืออัปโหลด"
                      className="w-full px-2.5 py-1 rounded-lg bg-[#101018] border border-white/5 text-[10px] text-zinc-300 font-mono"
                    />
                    <label className="shrink-0 px-2 py-1 bg-[#2A2A40] hover:bg-[#3A3A50] text-white text-[10px] font-bold rounded-lg cursor-pointer flex items-center justify-center transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, (base64) => setConfig(prev => ({
                          ...prev,
                          promoCard2: { ...prev.promoCard2, img: base64 }
                        })))}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Bottom footer badge inside card */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">แถบสถานะด้านล่างการ์ด</label>
                  <input
                    type="text"
                    value={config.promoFooterText}
                    onChange={(e) => setConfig(prev => ({ ...prev, promoFooterText: e.target.value }))}
                    placeholder="มีผลสต็อกพร้อมส่งในเซิร์ฟ VIP"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#161624] border border-[#25253A] text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">ข้อความยืนยัน</label>
                  <input
                    type="text"
                    value={config.promoFooterTag}
                    onChange={(e) => setConfig(prev => ({ ...prev, promoFooterTag: e.target.value }))}
                    placeholder="100% แท้"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#161624] border border-[#25253A] text-cyan-400 text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: คลังผลไม้และไอเทมในเกมทั้งหมด (Complete Blox Fruits Presets Modal) */}
      {/* ======================================================== */}
      {presetModalTarget && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md"
          onClick={() => setPresetModalTarget(null)}
        >
          <div 
            className="bg-[#12121E] border border-purple-500/40 rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl shadow-purple-950/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#212133] flex items-center justify-between bg-[#151524]">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>เลือกผลไม้ ดาบ หรือ Gamepass จากเกม Blox Fruits</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  มีรายการผลไม้ทุกระดับ (Mythical ถึง Common) และไอเทมยอดนิยมครบทั้งหมด
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPresetModalTarget(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Filters */}
            <div className="p-4 border-b border-[#212133] space-y-3 bg-[#0E0E18]">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  placeholder="พิมพ์ค้นหาผล เช่น คิตสึเนะ, มังกร, โมจิ, ดาบโยรุ, CDK, พระ..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#161626] border border-[#292942] text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: `ทั้งหมด (${BLOX_FRUITS_PRESETS.length})` },
                  { id: 'fruit', label: 'ผลปีศาจทั้งหมด' },
                  { id: 'gamepass', label: 'Gamepasses' },
                  { id: 'sword', label: 'ดาบ & อาวุธ' },
                  { id: 'style', label: 'หมัด & เผ่า V4' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPresetFilterCategory(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      presetFilterCategory === tab.id
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-[#181828] text-zinc-400 hover:text-white hover:bg-[#202035]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets Grid */}
            <div className="p-4 overflow-y-auto flex-1 max-h-[50vh]">
              {filteredPresets.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  ไม่พบผลไม้หรือไอเทมที่ค้นหา "{presetSearch}"
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {filteredPresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="p-2.5 rounded-xl bg-[#151524] hover:bg-purple-950/40 border border-[#242438] hover:border-purple-500/60 transition-all text-left group flex items-center gap-2.5 cursor-pointer active:scale-95"
                    >
                      <div className="w-12 h-12 rounded-lg bg-[#0C0C14] border border-white/5 p-1 shrink-0 flex items-center justify-center">
                        <BloxImage
                          src={preset.url}
                          alt={preset.name}
                          productName={preset.th || preset.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_2px_8px_rgba(168,85,247,0.3)]"
                        />
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
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-[#212133] bg-[#151524] text-right">
              <button
                type="button"
                onClick={() => setPresetModalTarget(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Button on Mobile */}
      <div className="fixed bottom-4 right-4 z-40 sm:hidden">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="p-3.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-2xl shadow-purple-600/50 flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
          title="บันทึกการตั้งค่าหน้าแรก"
        >
          <Save className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
