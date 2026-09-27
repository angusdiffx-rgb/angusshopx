import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Image as ImageIcon, 
  Upload, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Check, 
  Zap, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Tag, 
  DollarSign, 
  Link as LinkIcon,
  Copy
} from 'lucide-react';
import { HomeConfig, HeroBannerConfig, Product } from '../types';
import { BLOX_FRUITS_PRESETS, DEFAULT_HOME_CONFIG, BloxPreset } from '../data/bloxPresets';
import { BloxPresetPickerModal } from './BloxPresetPickerModal';
import { BloxImage } from './BloxImage';
import { useToast } from '../context/ToastContext';
import { playClickSound } from '../lib/sound';

interface AdminHeroBannersProps {
  config: HomeConfig;
  setConfig: React.Dispatch<React.SetStateAction<HomeConfig>>;
  products?: Product[];
  onSave?: () => Promise<void>;
}

export const AdminHeroBanners: React.FC<AdminHeroBannersProps> = ({
  config,
  setConfig,
  products = [],
  onSave
}) => {
  const { success, error: toastError } = useToast();

  const banners = config.heroBanners && config.heroBanners.length > 0
    ? config.heroBanners
    : (DEFAULT_HOME_CONFIG.heroBanners || []);

  const [editingBannerId, setEditingBannerId] = useState<string | null>(banners[0]?.id || null);

  // Blox Catalog Picker Modal
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [pickerTargetBannerId, setPickerTargetBannerId] = useState<string | null>(null);

  // Helper to update a single banner in state
  const handleUpdateBanner = (bannerId: string, field: keyof HeroBannerConfig, value: any) => {
    setConfig(prev => {
      const currentBanners = prev.heroBanners && prev.heroBanners.length > 0
        ? [...prev.heroBanners]
        : [...(DEFAULT_HOME_CONFIG.heroBanners || [])];
      
      const index = currentBanners.findIndex(b => b.id === bannerId);
      if (index === -1) return prev;

      currentBanners[index] = {
        ...currentBanners[index],
        [field]: value
      };
      return {
        ...prev,
        heroBanners: currentBanners
      };
    });
  };

  // Reorder Banners
  const handleMoveBanner = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    setConfig(prev => {
      const currentBanners = prev.heroBanners && prev.heroBanners.length > 0
        ? [...prev.heroBanners]
        : [...(DEFAULT_HOME_CONFIG.heroBanners || [])];

      const temp = currentBanners[index];
      currentBanners[index] = currentBanners[targetIndex];
      currentBanners[targetIndex] = temp;

      // Update orders
      currentBanners.forEach((b, idx) => {
        b.order = idx + 1;
      });

      return {
        ...prev,
        heroBanners: currentBanners
      };
    });
    success('เปลี่ยนลำดับแบนเนอร์เรียบร้อย');
  };

  // Toggle Active/Inactive
  const handleToggleActive = (bannerId: string) => {
    const banner = banners.find(b => b.id === bannerId);
    if (!banner) return;
    const nextState = banner.isActive === false ? true : false;
    handleUpdateBanner(bannerId, 'isActive', nextState);
    success(nextState ? 'เปิดใช้งานแบนเนอร์แล้ว' : 'ปิดใช้งานแบนเนอร์แล้ว');
  };

  // Delete Banner
  const handleDeleteBanner = (bannerId: string) => {
    if (banners.length <= 1) {
      toastError('ต้องมีแบนเนอร์อย่างน้อย 1 รายการ');
      return;
    }
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบแบนเนอร์นี้?')) return;

    setConfig(prev => {
      const currentBanners = (prev.heroBanners || DEFAULT_HOME_CONFIG.heroBanners || []).filter(b => b.id !== bannerId);
      return {
        ...prev,
        heroBanners: currentBanners
      };
    });
    success('ลบแบนเนอร์เรียบร้อยแล้ว');
  };

  // Add Empty Banner
  const handleAddEmptyBanner = () => {
    const newId = 'banner_' + Date.now();
    const newBanner: HeroBannerConfig = {
      id: newId,
      badge: '✨ สินค้าใหม่',
      badgeColor: 'purple',
      title: 'โปรโมชั่นพิเศษ Blox Fruits',
      highlightText: 'ราคาพิเศษ ส่งมอบใน 3 นาที',
      description: 'ผลปีศาจและไอเทมของแท้ 100% ส่งมอบผ่านระบบ Trade ในเกมอย่างปลอดภัย มีสต็อกพร้อมส่ง',
      priceText: '฿199',
      originalPriceText: '฿250',
      discountBadge: '-20%',
      imageUrl: '/images/blox/kitsune.png',
      aspectRatio: '16:9',
      themeGradient: 'from-[#1A0F2E] via-[#120B20] to-[#0A0714]',
      accentColor: 'purple',
      targetCategory: 'ผลปีศาจ',
      ctaText: 'สั่งซื้อทันที',
      secondaryCtaText: 'ดูรายละเอียด',
      isActive: true,
      order: banners.length + 1
    };

    setConfig(prev => ({
      ...prev,
      heroBanners: [...(prev.heroBanners || DEFAULT_HOME_CONFIG.heroBanners || []), newBanner]
    }));
    setEditingBannerId(newId);
    success('เพิ่มแบนเนอร์ใหม่เรียบร้อย');
  };

  // Handle local image upload for banner
  const handleUploadBannerImage = (e: React.ChangeEvent<HTMLInputElement>, bannerId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toastError('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIM = 640;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/webp', 0.85);
          handleUpdateBanner(bannerId, 'imageUrl', dataUrl);
          success('อัปโหลดและปรับขนาดรูปภาพแบนเนอร์สำเร็จ');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle preset selected from Blox catalog
  const handleSelectPresetForBanner = (preset: BloxPreset) => {
    if (!pickerTargetBannerId) return;
    handleUpdateBanner(pickerTargetBannerId, 'imageUrl', preset.url);
    setIsPresetModalOpen(false);
    setPickerTargetBannerId(null);
    success(`เลือกรูป ${preset.th} ให้กับแบนเนอร์แล้ว`);
  };

  return (
    <div className="space-y-8 text-white w-full max-w-full overflow-x-hidden">
      
      {/* SECTION: BANNER LIST MANAGEMENT */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#11111A] border border-[#212133] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E1E2E]">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>รายการแบนเนอร์ทั้งหมด ({banners.length})</span>
            </h3>
            <p className="text-xs text-zinc-400">เรียงลำดับ ปรับแต่งข้อความ รูปภาพ และลิงก์สำหรับแต่ละแบนเนอร์</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddEmptyBanner}
              className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มแบนเนอร์ว่าง</span>
            </button>
          </div>
        </div>

        {/* Banners List */}
        <div className="space-y-4">
          {banners.map((banner, index) => {
            const isEditing = editingBannerId === banner.id;
            return (
              <div 
                key={banner.id || index}
                className={`rounded-2xl border transition-all ${
                  isEditing 
                    ? 'bg-[#151522] border-purple-500/60 shadow-xl' 
                    : 'bg-[#0E0E18] border-white/5 hover:border-white/10'
                }`}
              >
                {/* Header Strip of Banner Row */}
                <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Index & Move Buttons */}
                    <div className="flex items-center gap-1">
                      <span className="w-6 h-6 rounded-lg bg-black/40 text-purple-300 text-xs font-black flex items-center justify-center font-mono">
                        {index + 1}
                      </span>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveBanner(index, 'up')}
                          className="text-zinc-500 hover:text-white disabled:opacity-20 cursor-pointer p-0.5"
                          title="เลื่อนขึ้น"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={index === banners.length - 1}
                          onClick={() => handleMoveBanner(index, 'down')}
                          className="text-zinc-500 hover:text-white disabled:opacity-20 cursor-pointer p-0.5"
                          title="เลื่อนลง"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/10 p-1 flex items-center justify-center shrink-0">
                      <BloxImage
                        src={banner.imageUrl}
                        alt={banner.title}
                        productName={banner.title}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Title & Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 truncate max-w-[120px]">
                          {banner.badge}
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          {banner.priceText}
                        </span>
                        {banner.isActive === false && (
                          <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                            ซ่อนอยู่
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md mt-0.5">
                        {banner.title}
                      </h4>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(banner.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                        banner.isActive !== false
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                      title={banner.isActive !== false ? 'คลิกเพื่อปิดใช้งาน' : 'คลิกเพื่อเปิดใช้งาน'}
                    >
                      {banner.isActive !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{banner.isActive !== false ? 'แสดงอยู่' : 'ปิดอยู่'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingBannerId(isEditing ? null : banner.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#202032] hover:bg-[#2B2B44] text-purple-300 text-xs font-bold cursor-pointer transition-colors"
                    >
                      {isEditing ? 'ย่อลง' : 'แก้ไข'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer transition-colors"
                      title="ลบแบนเนอร์นี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Edit Form */}
                {isEditing && (
                  <div className="p-4 sm:p-6 border-t border-white/5 space-y-4 bg-[#11111C]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                      
                      {/* Title */}
                      <div className="sm:col-span-2">
                        <label className="block text-zinc-300 font-bold mb-1">หัวข้อหลัก (Title)</label>
                        <input
                          type="text"
                          value={banner.title}
                          onChange={(e) => handleUpdateBanner(banner.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#0A0A12] border border-[#25253A] text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Highlight */}
                      <div>
                        <label className="block text-zinc-300 font-bold mb-1">ข้อความไฮไลต์ (Highlight Punchline)</label>
                        <input
                          type="text"
                          value={banner.highlightText || ''}
                          onChange={(e) => handleUpdateBanner(banner.id, 'highlightText', e.target.value)}
                          placeholder="เช่น สปีดเร็วที่สุด ดาเมจมหาศาล"
                          className="w-full px-3 py-2 rounded-xl bg-[#0A0A12] border border-[#25253A] text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Badge Text */}
                      <div>
                        <label className="block text-zinc-300 font-bold mb-1">ป้ายกำกับ (Badge)</label>
                        <input
                          type="text"
                          value={banner.badge}
                          onChange={(e) => handleUpdateBanner(banner.id, 'badge', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#0A0A12] border border-[#25253A] text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Badge Color */}
                      <div>
                        <label className="block text-zinc-300 font-bold mb-1">สีของป้ายกำกับ</label>
                        <select
                          value={banner.badgeColor || 'purple'}
                          onChange={(e) => handleUpdateBanner(banner.id, 'badgeColor', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#0A0A12] border border-[#25253A] text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                        >
                          <option value="purple">สีม่วง (Purple / Mythical)</option>
                          <option value="rose">สีชมพู/แดง (Rose / Rework)</option>
                          <option value="amber">สีส้ม/ทอง (Amber / Bounty #1)</option>
                          <option value="cyan">สีฟ้า/น้ำเงิน (Cyan / Gamepass)</option>
                          <option value="emerald">สีเขียว (Emerald / Special)</option>
                        </select>
                      </div>

                      {/* Discount Badge */}
                      <div>
                        <label className="block text-zinc-300 font-bold mb-1">ป้ายลดราคา (Discount Tag)</label>
                        <input
                          type="text"
                          value={banner.discountBadge || ''}
                          onChange={(e) => handleUpdateBanner(banner.id, 'discountBadge', e.target.value)}
                          placeholder="เช่น -15% หรือ HOT DEAL"
                          className="w-full px-3 py-2 rounded-xl bg-[#0A0A12] border border-[#25253A] text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Price Text */}
                      <div>
                        <label className="block text-zinc-300 font-bold mb-1">ข้อความราคา (Price)</label>
                        <input
                          type="text"
                          value={banner.priceText || ''}
                          onChange={(e) => handleUpdateBanner(banner.id, 'priceText', e.target.value)}
                          placeholder="เช่น ฿299"
                          className="w-full px-3 py-2 rounded-xl bg-[#0A0A12] border border-[#25253A] text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Original Price */}
                      <div>
                        <label className="block text-zinc-300 font-bold mb-1">ราคาเดิมขีดฆ่า (Original Price)</label>
                        <input
                          type="text"
                          value={banner.originalPriceText || ''}
                          onChange={(e) => handleUpdateBanner(banner.id, 'originalPriceText', e.target.value)}
                          placeholder="เช่น ฿350"
                          className="w-full px-3 py-2 rounded-xl bg-[#0A0A12] border border-[#25253A] text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Target Category */}
                      <div>
                        <label className="block text-zinc-300 font-bold mb-1">หมวดหมู่เป้าหมายเมื่อคลิก</label>
                        <select
                          value={banner.targetCategory || 'ผลปีศาจ'}
                          onChange={(e) => handleUpdateBanner(banner.id, 'targetCategory', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#0A0A12] border border-[#25253A] text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                        >
                          <option value="ผลปีศาจ">ผลปีศาจ</option>
                          <option value="Gamepass">Gamepass</option>
                          <option value="ไอเทม">ไอเทม / ดาบ</option>
                          <option value="บริการ">บริการ / ล่าค่าหัว</option>
                          <option value="ทั้งหมด">ทั้งหมด</option>
                        </select>
                      </div>

                    </div>

                    {/* Description */}
                    <div className="text-xs">
                      <label className="block text-zinc-300 font-bold mb-1">คำอธิบายรายละเอียดโปรโมชั่น</label>
                      <textarea
                        rows={2}
                        value={banner.description}
                        onChange={(e) => handleUpdateBanner(banner.id, 'description', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0A0A12] border border-[#25253A] text-white focus:outline-none focus:border-purple-500 leading-relaxed"
                      />
                    </div>

                    {/* Image Settings */}
                    <div className="text-xs space-y-2 pt-1 border-t border-white/5">
                      <label className="block text-zinc-300 font-bold">รูปภาพประจำแบนเนอร์ (Blox Fruits Artwork)</label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 p-1 flex items-center justify-center shrink-0">
                          <BloxImage
                            src={banner.imageUrl}
                            alt={banner.title}
                            productName={banner.title}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <input
                          type="text"
                          value={banner.imageUrl}
                          onChange={(e) => handleUpdateBanner(banner.id, 'imageUrl', e.target.value)}
                          placeholder="URL รูปภาพ หรือเลือกจากแคตตาล็อก"
                          className="flex-1 px-3 py-2 rounded-xl bg-[#0A0A12] border border-[#25253A] text-white focus:outline-none focus:border-purple-500"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            setPickerTargetBannerId(banner.id);
                            setIsPresetModalOpen(true);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#1C1C2C] hover:bg-[#28283E] border border-purple-500/30 text-purple-300 font-bold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>เลือกจากแคตตาล็อก</span>
                        </button>

                        <label className="px-3.5 py-2 rounded-xl bg-[#1C1C2C] hover:bg-[#28283E] border border-white/10 text-white font-bold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0">
                          <Upload className="w-3.5 h-3.5 text-pink-400" />
                          <span>อัปโหลด</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleUploadBannerImage(e, banner.id)}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Gradient Theme Picker */}
                    <div className="text-xs pt-1">
                      <label className="block text-zinc-300 font-bold mb-1">โทนสีพื้นหลัง (Theme Gradient)</label>
                      <select
                        value={banner.themeGradient || 'from-[#1A0F2E] via-[#120B20] to-[#0A0714]'}
                        onChange={(e) => handleUpdateBanner(banner.id, 'themeGradient', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0A0A12] border border-[#25253A] text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                      >
                        <option value="from-[#1E0D36] via-[#140A26] to-[#0A0614]">💜 Kitsune Void (ม่วง-ดำ จิ้งจอกเก้าหาง)</option>
                        <option value="from-[#2A0E18] via-[#1B0A11] to-[#0D0509]">❤️ Dragon Inferno (แดง-ดำ มังกรเกล็ดอสูร)</option>
                        <option value="from-[#281A08] via-[#191005] to-[#0E0903]">👑 Emperor Gold (ทอง-ดำ ล่าค่าหัว 30M)</option>
                        <option value="from-[#0B202D] via-[#07151E] to-[#040B10]">💎 Cyan Cyber (ฟ้าเข้ม ดาบดำ & Gamepass)</option>
                        <option value="from-[#0E2619] via-[#081810] to-[#040C08]">💚 Emerald Toxic (เขียวมรกต)</option>
                      </select>
                    </div>

                    {/* Button Labels */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <label className="block text-zinc-300 font-bold mb-1">ข้อความปุ่มกดสั่งซื้อ (CTA Text)</label>
                        <input
                          type="text"
                          value={banner.ctaText || 'สั่งซื้อทันที'}
                          onChange={(e) => handleUpdateBanner(banner.id, 'ctaText', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#0A0A12] border border-[#25253A] text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-300 font-bold mb-1">ข้อความปุ่มรอง (Secondary CTA)</label>
                        <input
                          type="text"
                          value={banner.secondaryCtaText || 'ดูรายละเอียด'}
                          onChange={(e) => handleUpdateBanner(banner.id, 'secondaryCtaText', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#0A0A12] border border-[#25253A] text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Blox Preset Picker Modal */}
      {isPresetModalOpen && (
        <BloxPresetPickerModal
          isOpen={isPresetModalOpen}
          onClose={() => {
            setIsPresetModalOpen(false);
            setPickerTargetBannerId(null);
          }}
          onSelect={handleSelectPresetForBanner}
          onSelectPreset={handleSelectPresetForBanner}
          title="เลือกภาพ Blox Fruits สำหรับแบนเนอร์"
        />
      )}

    </div>
  );
};
