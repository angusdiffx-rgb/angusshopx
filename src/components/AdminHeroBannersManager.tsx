import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Check, 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown, 
  Layers, 
  Wand2, 
  Zap, 
  Flame, 
  Tag, 
  ShoppingBag, 
  ShieldCheck, 
  RefreshCw,
  X
} from 'lucide-react';
import { HeroBannerConfig } from '../types';
import { useHomeConfig } from '../context/HomeConfigContext';
import { useToast } from '../context/ToastContext';
import { DEFAULT_HOME_CONFIG } from '../data/bloxPresets';
import { BloxImage } from './BloxImage';
import { playClickSound } from '../lib/sound';

export const AdminHeroBannersManager: React.FC = () => {
  const { homeConfig, updateHomeConfig } = useHomeConfig();
  const { success, error: toastError } = useToast();

  const [banners, setBanners] = useState<HeroBannerConfig[]>(() => {
    return homeConfig.heroBanners && homeConfig.heroBanners.length > 0
      ? homeConfig.heroBanners
      : (DEFAULT_HOME_CONFIG.heroBanners || []);
  });

  const [editingBanner, setEditingBanner] = useState<HeroBannerConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [selectedAiPreset, setSelectedAiPreset] = useState<'kitsune' | 'dragon' | 'bounty' | 'dark_blade' | 'dough' | 'race_v4'>('kitsune');

  // AI Promotional Campaign Presets
  const AI_CAMPAIGN_PRESETS: Record<string, {
    title: string;
    highlightText: string;
    description: string;
    badge: string;
    badgeColor: string;
    priceText: string;
    originalPriceText: string;
    discountBadge: string;
    imageUrl: string;
    themeGradient: string;
    accentColor: string;
    targetCategory: string;
    targetProductId: string;
  }> = {
    kitsune: {
      title: 'Kitsune Fruit (ผลคิตสึเนะถาวร & ผลเทรด)',
      highlightText: 'ราชันย์จิ้งจอกเก้าหาง สปีดอันดับ 1 ในเกม Blox Fruits',
      description: 'ผลปีศาจระดับ Mythical อันดับ 1 สปีดเร็วที่สุด ดาเมจสูงมาก เหมาะสำหรับการ PvP และลงดันเจี้ยน มีสต็อกพร้อมส่งทันที เทรดรับในเซิร์ฟเวอร์ VIP ปลอดภัย 100%',
      badge: '🔥 MYTHICAL อันดับ 1',
      badgeColor: 'purple',
      priceText: '฿299',
      originalPriceText: '฿350',
      discountBadge: '-15%',
      imageUrl: '/images/blox/kitsune.png',
      themeGradient: 'from-[#1E0D36] via-[#140A26] to-[#0A0614]',
      accentColor: 'purple',
      targetCategory: 'ผลปีศาจ',
      targetProductId: 'trend-kitsune'
    },
    dragon: {
      title: 'Dragon Fruit (ผลมังกร รีเวิร์ค)',
      highlightText: 'มังกรเกล็ดอสูร มหาพลังดาเมจถล่มเซิร์ฟเวอร์',
      description: 'ผลมังกรแท้ 100% สกิลกว้าง ดาเมจทะลุหลอด ซื้อตุนไว้ก่อนเปิดตัวอัปเดตรีเวิร์ค เทรดรับของทันใจใน 3 นาที',
      badge: '⚡ REWORK HYPE',
      badgeColor: 'rose',
      priceText: '฿249',
      originalPriceText: '฿290',
      discountBadge: '-14%',
      imageUrl: '/images/blox/dragon.png',
      themeGradient: 'from-[#2A0E18] via-[#1B0A11] to-[#0D0509]',
      accentColor: 'rose',
      targetCategory: 'ผลปีศาจ',
      targetProductId: 'trend-dragon'
    },
    dough: {
      title: 'Dough Fruit (ผลโมจิ อเวคตื่นทุกสกิล)',
      highlightText: 'ผลสายคอมโบ PvP ยอดนิยมอันดับ 1 ของสายสตรีมเมอร์',
      description: 'ผลโมจิพร้อมอเวคสกิลตื่นครบทุกท่า คอมโบล็อคตัวต่อเนื่อง ไม่หลุดง่าย ดาเมจแรง สั่งซื้อพร้อมรับผลเทรดทันทีในเซิร์ฟ VIP',
      badge: '🍩 AWAKENED TOP PICK',
      badgeColor: 'amber',
      priceText: '฿189',
      originalPriceText: '฿230',
      discountBadge: '-18%',
      imageUrl: '/images/blox/dough.png',
      themeGradient: 'from-[#28180A] via-[#1A1005] to-[#0D0803]',
      accentColor: 'amber',
      targetCategory: 'ผลปีศาจ',
      targetProductId: 'trend-dough'
    },
    bounty: {
      title: 'บริการล่าค่าหัว (Bounty / Honor 30M)',
      highlightText: 'ปลดล็อกฉายาจักรพรรดิ 30M & บัฟ PvP สูงสุดในเกม',
      description: 'บริการล่าค่าหัว 10M / 20M / 30M Max Cap ปลดล็อกโบนัสดาเมจและเกราะป้องกันสูงสุดในเกม Blox Fruits โดยทีมนักล่ามืออาชีพ',
      badge: '👑 PVP RANK #1',
      badgeColor: 'amber',
      priceText: '฿500 - ฿1,500',
      originalPriceText: '฿650 - ฿1,900',
      discountBadge: 'HOT DEAL',
      imageUrl: '/images/blox/bounty_hunt_30m.png',
      themeGradient: 'from-[#281A08] via-[#191005] to-[#0E0903]',
      accentColor: 'amber',
      targetCategory: 'บริการ',
      targetProductId: 'prod_bounty_hunt'
    },
    dark_blade: {
      title: 'Dark Blade Yoru (ดาบดำโยรุ ถาวร)',
      highlightText: 'ดาบดำโยรุระดับ Mythical ฟาร์มเลเวลและ PvP สุดเทพ',
      description: 'ดาบดำโยรุของแท้ 100% ส่งมอบผ่านระบบ Gift ในเกมทันทีหลังชำระเงิน ปลอดภัย ไร้กังวล ได้รับไอเทมถาวรตลอดชีพ',
      badge: '💎 GAMEPASS MYTHICAL',
      badgeColor: 'cyan',
      priceText: '฿450',
      originalPriceText: '฿520',
      discountBadge: 'แท้ 100%',
      imageUrl: '/images/blox/dark_blade.png',
      themeGradient: 'from-[#0B202D] via-[#07151E] to-[#040B10]',
      accentColor: 'cyan',
      targetCategory: 'Gamepass',
      targetProductId: 'trend-darkblade'
    },
    race_v4: {
      title: 'บริการทำ เผ่ามังกร & V4 Max Gear T10',
      highlightText: 'ปลดล็อกพลังเผ่าขั้นสุด เกียร์ครบทุกเฟือง',
      description: 'บริการลงดัน Trial เผ่ามังกรและเผ่าอื่นๆ อัปเกรดเกียร์ V4 จนเต็ม Max T10 ดูแลโดยทีมงานมืออาชีพ ปลอดภัย 100% ไม่ใช้โปรแกรมแบน',
      badge: '🐉 RACE V4 MAX T10',
      badgeColor: 'rose',
      priceText: '฿300',
      originalPriceText: '฿400',
      discountBadge: 'ยอดฮิต',
      imageUrl: '/images/blox/race_v4.png',
      themeGradient: 'from-[#2B0E1E] via-[#1C0A15] to-[#0E050B]',
      accentColor: 'rose',
      targetCategory: 'บริการ',
      targetProductId: 'prod_race_v4_dragon_t10'
    }
  };

  const handleApplyAiPreset = () => {
    const template = AI_CAMPAIGN_PRESETS[selectedAiPreset];
    if (!template) return;

    const newBanner: HeroBannerConfig = {
      id: `banner_${Date.now()}`,
      badge: template.badge,
      badgeColor: template.badgeColor,
      title: template.title,
      highlightText: template.highlightText,
      description: template.description,
      priceText: template.priceText,
      originalPriceText: template.originalPriceText,
      discountBadge: template.discountBadge,
      imageUrl: template.imageUrl,
      aspectRatio: '16:9',
      themeGradient: template.themeGradient,
      accentColor: template.accentColor,
      targetCategory: template.targetCategory,
      targetProductId: template.targetProductId,
      ctaText: 'สั่งซื้อทันที',
      secondaryCtaText: 'ดูรายละเอียด',
      isActive: true,
      order: banners.length + 1
    };

    const updated = [...banners, newBanner];
    setBanners(updated);
    setIsAiGeneratorOpen(false);
    success('สร้างแคมเปญสำเร็จ!', `เพิ่มแบนเนอร์โปรโมชั่น "${template.title.split('(')[0]}" เรียบร้อยแล้ว`);
  };

  const handleToggleActive = (id: string) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b));
  };

  const handleDeleteBanner = (id: string) => {
    if (banners.length <= 1) {
      toastError('ไม่สามารถลบได้', 'ต้องมีแบนเนอร์อย่างน้อย 1 รายการในระบบ');
      return;
    }
    setBanners(prev => prev.filter(b => b.id !== id));
    success('ลบแบนเนอร์แล้ว', 'นำแบนเนอร์ออกจากรายการเรียบร้อย');
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...banners];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setBanners(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === banners.length - 1) return;
    const updated = [...banners];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setBanners(updated);
  };

  const handleSaveAllBanners = async () => {
    setIsSaving(true);
    try {
      await updateHomeConfig({
        heroBanners: banners
      });
      success('บันทึกแบนเนอร์เรียบร้อย', 'ข้อมูลแบนเนอร์โปรโมชั่นบนหน้าแรกถูกอัปเดตเรียบร้อยแล้ว');
    } catch (err: any) {
      toastError('บันทึกไม่สำเร็จ', err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = (edited: HeroBannerConfig) => {
    setBanners(prev => prev.map(b => b.id === edited.id ? edited : b));
    setEditingBanner(null);
    success('อัปเดตแบนเนอร์แล้ว', 'อย่าลืมกดปุ่ม "บันทึกการเปลี่ยนแปลงทั้งหมด" เพื่อนำไปแสดงผลจริง');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#11111A] border border-[#212133]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              จัดการแบนเนอร์โปรโมชั่น (HomeHero Banners)
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                {banners.filter(b => b.isActive).length} แสดงผลอยู่
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              สร้าง แก้ไข และจัดลำดับแบนเนอร์โปรโมชั่นขนาดใหญ่ (16:9) สำหรับสินค้า Blox Fruits หน้าแรก
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAiGeneratorOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/25 transition-all"
          >
            <Wand2 className="w-4 h-4" />
            <span>AI สร้างแคมเปญแบนเนอร์</span>
          </button>

          <button
            onClick={handleSaveAllBanners}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/25 transition-all"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>บันทึกทั้งหมด</span>
          </button>
        </div>
      </div>

      {/* List of Hero Banners */}
      <div className="grid grid-cols-1 gap-4">
        {banners.map((banner, index) => (
          <div 
            key={banner.id || index}
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              banner.isActive 
                ? 'bg-[#12121E] border-purple-500/30 shadow-lg' 
                : 'bg-[#0E0E16] border-[#222234] opacity-60'
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              
              {/* Graphic Preview */}
              <div className="lg:col-span-3 flex items-center gap-3">
                <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${banner.themeGradient || 'from-purple-950 to-black'} border border-white/10 flex items-center justify-center p-2 shrink-0 shadow-md`}>
                  <BloxImage
                    src={banner.imageUrl}
                    alt={banner.title}
                    productName={banner.title}
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                  {banner.discountBadge && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-black">
                      {banner.discountBadge}
                    </span>
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    ลำดับที่ {index + 1}
                  </span>
                  <div className="text-xs font-bold text-white truncate max-w-[180px]">
                    {banner.badge}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-black">
                    {banner.priceText || 'ราคาตามแพ็กเกจ'}
                  </div>
                </div>
              </div>

              {/* Title & Details */}
              <div className="lg:col-span-6 space-y-1">
                <h3 className="text-sm sm:text-base font-black text-white">
                  {banner.title}
                </h3>
                {banner.highlightText && (
                  <p className="text-xs font-semibold text-purple-300">
                    {banner.highlightText}
                  </p>
                )}
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {banner.description}
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500">
                  <span>เป้าหมาย: <strong className="text-zinc-300">{banner.targetCategory || banner.targetProductId || 'หน้าร้านค้า'}</strong></span>
                  <span>•</span>
                  <span>ปุ่ม: <strong className="text-zinc-300">{banner.ctaText || 'สั่งซื้อทันที'}</strong></span>
                </div>
              </div>

              {/* Controls & Actions */}
              <div className="lg:col-span-3 flex items-center justify-end gap-1.5 flex-wrap">
                {/* Reorder Buttons */}
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-2 rounded-xl bg-[#181828] hover:bg-[#202035] disabled:opacity-20 text-zinc-300 hover:text-white border border-[#27273C] cursor-pointer"
                  title="เลื่อนขึ้น"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === banners.length - 1}
                  className="p-2 rounded-xl bg-[#181828] hover:bg-[#202035] disabled:opacity-20 text-zinc-300 hover:text-white border border-[#27273C] cursor-pointer"
                  title="เลื่อนลง"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Toggle Active */}
                <button
                  onClick={() => handleToggleActive(banner.id)}
                  className={`p-2 rounded-xl border cursor-pointer transition-colors ${
                    banner.isActive
                      ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 hover:bg-purple-600/30'
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'
                  }`}
                  title={banner.isActive ? 'เปิดใช้งาน (คลิกเพื่อปิด)' : 'ปิดใช้งาน (คลิกเพื่อเปิด)'}
                >
                  {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Edit */}
                <button
                  onClick={() => setEditingBanner({ ...banner })}
                  className="p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 cursor-pointer"
                  title="แก้ไขข้อมูลแบนเนอร์"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteBanner(banner.id)}
                  className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 cursor-pointer"
                  title="ลบแบนเนอร์นี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* AI Campaign Generator Modal */}
      {isAiGeneratorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#0F0F1A] border border-[#2A2A42] rounded-3xl p-6 shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#212135]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">AI สร้างแคมเปญแบนเนอร์โปรโมชั่น</h3>
                  <p className="text-xs text-zinc-400">เลือกสินค้า Blox Fruits ที่ต้องการ ระบบจะสร้างธีม สี ข้อความขาย และราคาให้อัตโนมัติ</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAiGeneratorOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1E1E2E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: 'kitsune', name: 'Kitsune Fruit', tag: 'Mythical อันดับ 1', img: '/images/blox/kitsune.png' },
                { id: 'dragon', name: 'Dragon Fruit', tag: 'Rework Edition', img: '/images/blox/dragon.png' },
                { id: 'dough', name: 'Dough Fruit', tag: 'Awakened V2', img: '/images/blox/dough.png' },
                { id: 'bounty', name: 'Bounty 30M Cap', tag: 'PvP Emperor', img: '/images/blox/bounty_hunt_30m.png' },
                { id: 'dark_blade', name: 'Dark Blade Yoru', tag: 'Mythical Gamepass', img: '/images/blox/dark_blade.png' },
                { id: 'race_v4', name: 'Race V4 Max T10', tag: 'Full Gear Trial', img: '/images/blox/race_v4.png' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedAiPreset(item.id as any)}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 cursor-pointer transition-all ${
                    selectedAiPreset === item.id
                      ? 'bg-purple-600/30 border-purple-400 text-white shadow-lg ring-2 ring-purple-500/40'
                      : 'bg-[#151524] border-[#26263A] text-zinc-400 hover:text-white hover:bg-[#1A1A2E]'
                  }`}
                >
                  <div className="w-14 h-14 relative flex items-center justify-center">
                    <BloxImage src={item.img} alt={item.name} productName={item.name} className="max-w-full max-h-full object-contain" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{item.name}</div>
                    <div className="text-[10px] text-purple-300 font-semibold">{item.tag}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Preview of Selected AI Campaign */}
            {AI_CAMPAIGN_PRESETS[selectedAiPreset] && (
              <div className="p-4 rounded-2xl bg-[#141422] border border-[#24243A] space-y-2">
                <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>ตัวอย่างแคมเปญที่จะถูกสร้าง:</span>
                </div>
                <div className="text-sm font-black text-white">
                  {AI_CAMPAIGN_PRESETS[selectedAiPreset].title}
                </div>
                <div className="text-xs text-purple-300 font-bold">
                  {AI_CAMPAIGN_PRESETS[selectedAiPreset].highlightText}
                </div>
                <div className="text-xs text-zinc-400 leading-relaxed">
                  {AI_CAMPAIGN_PRESETS[selectedAiPreset].description}
                </div>
                <div className="flex items-center gap-3 pt-1 text-xs">
                  <span className="text-emerald-400 font-black">
                    ราคา: {AI_CAMPAIGN_PRESETS[selectedAiPreset].priceText}
                  </span>
                  <span className="text-rose-400 font-bold">
                    ป้ายลด: {AI_CAMPAIGN_PRESETS[selectedAiPreset].discountBadge}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAiGeneratorOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleApplyAiPreset}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มแบนเนอร์นี้ทันที</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Banner Modal */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-[#0F0F1A] border border-[#2A2A42] rounded-3xl p-6 shadow-2xl space-y-4 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#212135]">
              <h3 className="text-base font-black text-white">แก้ไขข้อมูลแบนเนอร์โปรโมชั่น</h3>
              <button 
                onClick={() => setEditingBanner(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1E1E2E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">หัวข้อแบนเนอร์ (Title)</label>
                <input
                  type="text"
                  value={editingBanner.title}
                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  className="w-full bg-[#151524] border border-[#2A2A3E] rounded-xl px-3 py-2 text-white text-xs focus:border-purple-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">ข้อความไฮไลต์ (Highlight Subtitle)</label>
                <input
                  type="text"
                  value={editingBanner.highlightText || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, highlightText: e.target.value })}
                  className="w-full bg-[#151524] border border-[#2A2A3E] rounded-xl px-3 py-2 text-white text-xs focus:border-purple-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">คำอธิบายรายละเอียด (Description)</label>
                <textarea
                  rows={3}
                  value={editingBanner.description}
                  onChange={(e) => setEditingBanner({ ...editingBanner, description: e.target.value })}
                  className="w-full bg-[#151524] border border-[#2A2A3E] rounded-xl px-3 py-2 text-white text-xs focus:border-purple-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">ป้ายกำกับ (Badge)</label>
                  <input
                    type="text"
                    value={editingBanner.badge}
                    onChange={(e) => setEditingBanner({ ...editingBanner, badge: e.target.value })}
                    className="w-full bg-[#151524] border border-[#2A2A3E] rounded-xl px-3 py-2 text-white text-xs focus:border-purple-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">ป้ายลดราคา (Discount Tag)</label>
                  <input
                    type="text"
                    value={editingBanner.discountBadge || ''}
                    placeholder="เช่น -15% หรือ HOT SALE"
                    onChange={(e) => setEditingBanner({ ...editingBanner, discountBadge: e.target.value })}
                    className="w-full bg-[#151524] border border-[#2A2A3E] rounded-xl px-3 py-2 text-white text-xs focus:border-purple-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">ราคาแสดงผล (Price)</label>
                  <input
                    type="text"
                    value={editingBanner.priceText || ''}
                    placeholder="เช่น ฿299"
                    onChange={(e) => setEditingBanner({ ...editingBanner, priceText: e.target.value })}
                    className="w-full bg-[#151524] border border-[#2A2A3E] rounded-xl px-3 py-2 text-white text-xs focus:border-purple-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">ราคาเดิมขีดฆ่า (Original Price)</label>
                  <input
                    type="text"
                    value={editingBanner.originalPriceText || ''}
                    placeholder="เช่น ฿350"
                    onChange={(e) => setEditingBanner({ ...editingBanner, originalPriceText: e.target.value })}
                    className="w-full bg-[#151524] border border-[#2A2A3E] rounded-xl px-3 py-2 text-white text-xs focus:border-purple-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">URL รูปภาพสินค้า (Image URL)</label>
                <input
                  type="text"
                  value={editingBanner.imageUrl}
                  onChange={(e) => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })}
                  className="w-full bg-[#151524] border border-[#2A2A3E] rounded-xl px-3 py-2 text-white text-xs focus:border-purple-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">ข้อความปุ่มกดสั่งซื้อ (CTA Text)</label>
                  <input
                    type="text"
                    value={editingBanner.ctaText || ''}
                    placeholder="เช่น สั่งซื้อทันที"
                    onChange={(e) => setEditingBanner({ ...editingBanner, ctaText: e.target.value })}
                    className="w-full bg-[#151524] border border-[#2A2A3E] rounded-xl px-3 py-2 text-white text-xs focus:border-purple-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">รหัสสินค้าเป้าหมาย (Product ID)</label>
                  <input
                    type="text"
                    value={editingBanner.targetProductId || ''}
                    placeholder="เช่น trend-kitsune หรือ prod_bounty_hunt"
                    onChange={(e) => setEditingBanner({ ...editingBanner, targetProductId: e.target.value })}
                    className="w-full bg-[#151524] border border-[#2A2A3E] rounded-xl px-3 py-2 text-white text-xs focus:border-purple-400 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#212135]">
              <button
                type="button"
                onClick={() => setEditingBanner(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleSaveEdit(editingBanner)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-purple-600/30"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
