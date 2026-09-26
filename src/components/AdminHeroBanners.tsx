import React, { useState } from 'react';
import { 
  Sparkles, 
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
  Flame, 
  Zap, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  Palette, 
  Layers, 
  RefreshCw, 
  Tag, 
  DollarSign, 
  Link as LinkIcon,
  Wand2,
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

// Blox Fruits Item Presets for AI Banner Generation
interface FruitBannerTemplate {
  name: string;
  th: string;
  category: string;
  defaultBadge: string;
  defaultBadgeColor: 'purple' | 'rose' | 'amber' | 'cyan' | 'emerald';
  defaultTitle: string;
  defaultHighlight: string;
  defaultDesc: string;
  defaultPrice: string;
  defaultOriginalPrice: string;
  defaultDiscount: string;
  defaultImg: string;
  themeGradient: string;
  accentColor: string;
  targetProductId?: string;
  targetCategory?: string;
}

const BLOX_BANNER_TEMPLATES: FruitBannerTemplate[] = [
  {
    name: 'Kitsune Fruit',
    th: 'ผลคิตสึเนะ (จิ้งจอกเก้าหาง)',
    category: 'ผลปีศาจ',
    defaultBadge: '🔥 MYTHICAL อันดับ 1',
    defaultBadgeColor: 'purple',
    defaultTitle: 'Kitsune Fruit (ผลคิตสึเนะ)',
    defaultHighlight: 'สปีดเร็วที่สุด ดาเมจมหาศาล',
    defaultDesc: 'ผลจิ้งจอกเก้าหางระดับ Mythical อันดับ 1 ของเกม Blox Fruits มีสต็อกพร้อมส่งทันที เทรดรับในเซิร์ฟเวอร์ VIP ปลอดภัย 100%',
    defaultPrice: '฿299',
    defaultOriginalPrice: '฿350',
    defaultDiscount: '-15%',
    defaultImg: '/images/blox/kitsune.png',
    themeGradient: 'from-[#1E0D36] via-[#140A26] to-[#0A0614]',
    accentColor: 'purple',
    targetProductId: 'trend-kitsune',
    targetCategory: 'ผลปีศาจ'
  },
  {
    name: 'Dragon Fruit',
    th: 'ผลมังกร (Dragon Rework)',
    category: 'ผลปีศาจ',
    defaultBadge: '⚡ REWORK HYPE',
    defaultBadgeColor: 'rose',
    defaultTitle: 'Dragon Fruit (ผลมังกร รีเวิร์ค)',
    defaultHighlight: 'มังกรเกล็ดอสูร ทรงพลังที่สุด',
    defaultDesc: 'ผลมังกรแท้ 100% สกิลกว้าง ดาเมจทะลุหลอด ซื้อตุนไว้ก่อนเปิดตัวอัปเดตรีเวิร์ค เทรดรับของทันใจใน VIP',
    defaultPrice: '฿249',
    defaultOriginalPrice: '฿290',
    defaultDiscount: '-14%',
    defaultImg: '/images/blox/dragon.png',
    themeGradient: 'from-[#2A0E18] via-[#1B0A11] to-[#0D0509]',
    accentColor: 'rose',
    targetProductId: 'trend-dragon',
    targetCategory: 'ผลปีศาจ'
  },
  {
    name: 'Bounty 30M',
    th: 'บริการล่าค่าหัว (Bounty 30M)',
    category: 'บริการ',
    defaultBadge: '👑 PVP RANK #1',
    defaultBadgeColor: 'amber',
    defaultTitle: 'บริการล่าค่าหัว (Bounty 30M)',
    defaultHighlight: 'ปลดล็อกฉายาจักรพรรดิ & บัฟ PvP สูงสุด',
    defaultDesc: 'บริการล่าค่าหัว 10M / 20M / 30M Max Cap ปลดล็อกโบนัสดาเมจและเกราะป้องกันสูงสุดในเกม โดยทีมนักล่ามืออาชีพ',
    defaultPrice: '฿500 - ฿1,500',
    defaultOriginalPrice: '฿650 - ฿1,900',
    defaultDiscount: 'HOT DEAL',
    defaultImg: '/images/blox/bounty_hunt_30m.png',
    themeGradient: 'from-[#281A08] via-[#191005] to-[#0E0903]',
    accentColor: 'amber',
    targetProductId: 'prod_bounty_hunt',
    targetCategory: 'บริการ'
  },
  {
    name: 'Dark Blade Yoru',
    th: 'ดาบดำโยรุ (Dark Blade) & Gamepass',
    category: 'Gamepass',
    defaultBadge: '💎 GAMEPASS & WEAPONS',
    defaultBadgeColor: 'cyan',
    defaultTitle: 'Dark Blade Yoru & Gamepass 2x',
    defaultHighlight: 'ดาบดำโยรุ + บัฟคูณสองเงิน/มาส',
    defaultDesc: 'ดาบดำโยรุระดับ Mythical และ Gamepass ถาวร ช่วยให้ฟาร์มเลเวลเร็วขึ้น 2 เท่า ส่งมอบผ่านระบบของขวัญในเกมรวดเร็วใน 3 นาที',
    defaultPrice: '฿150 - ฿490',
    defaultOriginalPrice: '฿200 - ฿550',
    defaultDiscount: 'แท้ 100%',
    defaultImg: '/images/blox/dark_blade.png',
    themeGradient: 'from-[#0B202D] via-[#07151E] to-[#040B10]',
    accentColor: 'cyan',
    targetCategory: 'Gamepass'
  },
  {
    name: 'Dough Fruit V2',
    th: 'ผลโมจิ ตื่น V2 (Dough Awakened)',
    category: 'ผลปีศาจ',
    defaultBadge: '🍩 META PVP COMBO',
    defaultBadgeColor: 'amber',
    defaultTitle: 'Dough Fruit V2 (ผลโมจิ ตื่น)',
    defaultHighlight: 'คอมโบสตันน์ 1 คอมโบ ดับยกเซิร์ฟ',
    defaultDesc: 'ผลโมจิระดับ Mythical ยอดนิยมอันดับ 1 สำหรับสาย PvP สตันน์ล็อคศัตรูต่อเนื่อง ดาเมจสูงมาก มีทั้งแบบผลดรอปและผลถาวร',
    defaultPrice: '฿210',
    defaultOriginalPrice: '฿250',
    defaultDiscount: '-16%',
    defaultImg: '/images/blox/dough.png',
    themeGradient: 'from-[#29180E] via-[#1A0F09] to-[#0D0805]',
    accentColor: 'amber',
    targetCategory: 'ผลปีศาจ'
  },
  {
    name: 'Leopard Fruit',
    th: 'ผลเสือดาว (Leopard)',
    category: 'ผลปีศาจ',
    defaultBadge: '🐆 S-TIER SPAMMER',
    defaultBadgeColor: 'amber',
    defaultTitle: 'Leopard Fruit (ผลเสือดาว)',
    defaultHighlight: 'ความเร็วโจมตีรวดเร็วที่สุดในเกม',
    defaultDesc: 'ผลเสือดาวแปลงร่างร่างสัตว์ร้าย บัฟสปีดและเกราะป้องกัน ตีเร็วมากจนศัตรูสวนไม่ได้ พร้อมส่งมอบทันที 24 ชม.',
    defaultPrice: '฿230',
    defaultOriginalPrice: '฿270',
    defaultDiscount: '-15%',
    defaultImg: '/images/blox/leopard.png',
    themeGradient: 'from-[#261608] via-[#1A0E05] to-[#0E0803]',
    accentColor: 'amber',
    targetCategory: 'ผลปีศาจ'
  },
  {
    name: 'Buddha V2',
    th: 'ผลพระ ตื่น V2 (Buddha Awakened)',
    category: 'ผลปีศาจ',
    defaultBadge: '🗿 ฟาร์มอันดับ 1',
    defaultBadgeColor: 'amber',
    defaultTitle: 'Buddha Fruit V2 (ผลพระ ตื่น)',
    defaultHighlight: 'ผลสำหรับการฟาร์มเลเวลที่ดีที่สุดในเกม',
    defaultDesc: 'แปลงร่างยักษ์ทองคำ ระยะตีดาบไกลพิเศษ ลดดาเมจที่ได้รับ 50% ฟาร์มเลเวลและลงดันเจี้ยนไวที่สุด การันตีส่งมอบไว',
    defaultPrice: '฿120',
    defaultOriginalPrice: '฿150',
    defaultDiscount: '-20%',
    defaultImg: '/images/blox/buddha.png',
    themeGradient: 'from-[#2A200A] via-[#1B1406] to-[#0E0A03]',
    accentColor: 'amber',
    targetCategory: 'ผลปีศาจ'
  },
  {
    name: 'Portal Fruit',
    th: 'ผลประตูมิติ (Portal)',
    category: 'ผลปีศาจ',
    defaultBadge: '🌀 FAST TRAVEL & PVP',
    defaultBadgeColor: 'cyan',
    defaultTitle: 'Portal Fruit (ผลประตูมิติ)',
    defaultHighlight: 'วาร์ปได้ทุกเกาะ หลบหนีและคอมโบฉับไว',
    defaultDesc: 'ผลประตูมิติระดับ Legendary สามารถวาร์ปพาตัวเองและเพื่อนไปได้ทุกเกาะในพริบตา พร้อมมิติ World Warp สำหรับต่อสู้ PvP',
    defaultPrice: '฿140',
    defaultOriginalPrice: '฿180',
    defaultDiscount: '-22%',
    defaultImg: '/images/blox/portal.png',
    themeGradient: 'from-[#0A1F2C] via-[#06141D] to-[#030A0E]',
    accentColor: 'cyan',
    targetCategory: 'ผลปีศาจ'
  },
  {
    name: 'Cursed Dual Katana',
    th: 'ดาบคู่ต้องสาป (CDK Katana)',
    category: 'ไอเทม',
    defaultBadge: '⚔️ DUAL BLADES',
    defaultBadgeColor: 'rose',
    defaultTitle: 'Cursed Dual Katana (CDK)',
    defaultHighlight: 'ดาบคู่สเตตัสสูงที่สุด สกิลตัดมิติ',
    defaultDesc: 'ดาบคู่โยรุคู่กับยามะและทูชิตะ ดาเมจคอมโบทะลุเกราะ สกิลหมุนพายุฟันกว้าง ยอดนิยมที่สุดในการลงสงคราม PvP',
    defaultPrice: '฿350',
    defaultOriginalPrice: '฿420',
    defaultDiscount: '-17%',
    defaultImg: '/images/blox/cursed_dual_katana.png',
    themeGradient: 'from-[#280E18] via-[#1A0910] to-[#0D0508]',
    accentColor: 'rose',
    targetCategory: 'ไอเทม'
  }
];

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

  const [previewIndex, setPreviewIndex] = useState(0);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(banners[0]?.id || null);

  // AI Generator Form State
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [selectedArtStyle, setSelectedArtStyle] = useState<string>('Mythical Neon & Ethereal Flames');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<HeroBannerConfig | null>(null);

  // Blox Catalog Picker Modal
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [pickerTargetBannerId, setPickerTargetBannerId] = useState<string | null>(null);

  const activePreviewBanner = banners[previewIndex] || banners[0];

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
    setPreviewIndex(targetIndex);
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
    setPreviewIndex(0);
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
    setPreviewIndex(banners.length);
    success('เพิ่มแบนเนอร์ใหม่เรียบร้อย');
  };

  // Trigger AI Promotional Banner Generation
  const handleGenerateAIBanner = async () => {
    setIsGenerating(true);
    playClickSound();

    try {
      const template = BLOX_BANNER_TEMPLATES[selectedTemplateIndex];
      
      // Call server API for AI copywriting or procedural enrichment
      const res = await fetch('/api/admin/generate-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: template.name,
          category: template.category,
          style: selectedArtStyle,
          prompt: customPrompt
        })
      });

      let aiResult: Partial<HeroBannerConfig> = {};
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.banner) {
          aiResult = data.banner;
        }
      }

      // Compose high-fidelity promotional banner
      const newDraft: HeroBannerConfig = {
        id: 'banner_ai_' + Date.now(),
        badge: aiResult.badge || template.defaultBadge,
        badgeColor: (aiResult.badgeColor as any) || template.defaultBadgeColor,
        title: aiResult.title || template.defaultTitle,
        highlightText: aiResult.highlightText || template.defaultHighlight,
        description: aiResult.description || template.defaultDesc,
        priceText: aiResult.priceText || template.defaultPrice,
        originalPriceText: aiResult.originalPriceText || template.defaultOriginalPrice,
        discountBadge: aiResult.discountBadge || template.defaultDiscount,
        imageUrl: aiResult.imageUrl || template.defaultImg,
        aspectRatio: '16:9',
        themeGradient: aiResult.themeGradient || template.themeGradient,
        accentColor: aiResult.accentColor || template.accentColor,
        targetProductId: template.targetProductId,
        targetCategory: template.targetCategory,
        ctaText: aiResult.ctaText || 'สั่งซื้อทันที',
        secondaryCtaText: aiResult.secondaryCtaText || 'ดูรายละเอียด',
        isActive: true,
        order: banners.length + 1
      };

      setGeneratedDraft(newDraft);
      success('สร้างแบนเนอร์โปรโมชั่นด้วย AI สำเร็จ! ตรวจสอบตัวอย่างด้านล่างแล้วกดเพิ่มได้ทันที');
    } catch (err: any) {
      console.warn('AI banner generation fallback:', err);
      // Fallback to template
      const template = BLOX_BANNER_TEMPLATES[selectedTemplateIndex];
      const fallbackDraft: HeroBannerConfig = {
        id: 'banner_ai_' + Date.now(),
        badge: template.defaultBadge,
        badgeColor: template.defaultBadgeColor,
        title: template.defaultTitle,
        highlightText: template.defaultHighlight,
        description: template.defaultDesc,
        priceText: template.defaultPrice,
        originalPriceText: template.defaultOriginalPrice,
        discountBadge: template.defaultDiscount,
        imageUrl: template.defaultImg,
        aspectRatio: '16:9',
        themeGradient: template.themeGradient,
        accentColor: template.accentColor,
        targetProductId: template.targetProductId,
        targetCategory: template.targetCategory,
        ctaText: 'สั่งซื้อทันที',
        secondaryCtaText: 'ดูรายละเอียด',
        isActive: true,
        order: banners.length + 1
      };
      setGeneratedDraft(fallbackDraft);
      success('สร้างโครงสร้างแบนเนอร์ตามธีม Blox Fruits เรียบร้อยแล้ว');
    } finally {
      setIsGenerating(false);
    }
  };

  // Add the generated draft into actual banners
  const handleAcceptGeneratedDraft = () => {
    if (!generatedDraft) return;
    setConfig(prev => ({
      ...prev,
      heroBanners: [...(prev.heroBanners || DEFAULT_HOME_CONFIG.heroBanners || []), generatedDraft]
    }));
    setEditingBannerId(generatedDraft.id);
    setPreviewIndex(banners.length);
    setGeneratedDraft(null);
    success('เพิ่มแบนเนอร์เข้าสู่หน้าร้านค้าเรียบร้อยแล้ว! (อย่าลืมกดบันทึกการตั้งค่าด้านบน)');
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
      
      {/* SECTION 1: LIVE INTERACTIVE PREVIEW */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#0F0F1A] border border-purple-500/30 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>ตัวอย่างแบนเนอร์บนหน้าแรก (Live Store Preview)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {banners.filter(b => b.isActive !== false).length} เปิดแสดง
                </span>
              </h3>
              <p className="text-xs text-zinc-400">มุมมองจริงที่ลูกค้าจะเห็นเมื่อเข้าชมเว็บไซต์บนหน้าหลัก</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewIndex(prev => (prev - 1 + banners.length) % banners.length)}
              className="p-2 rounded-xl bg-[#1A1A2B] hover:bg-[#25253C] border border-white/5 text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="แบนเนอร์ก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-purple-300 font-mono px-2">
              {previewIndex + 1} / {banners.length}
            </span>
            <button
              type="button"
              onClick={() => setPreviewIndex(prev => (prev + 1) % banners.length)}
              className="p-2 rounded-xl bg-[#1A1A2B] hover:bg-[#25253C] border border-white/5 text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="แบนเนอร์ถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Card Render */}
        {activePreviewBanner && (
          <div className={`relative w-full rounded-2xl sm:rounded-3xl border border-white/10 p-5 sm:p-8 bg-gradient-to-br ${activePreviewBanner.themeGradient || 'from-[#1A0F2E] via-[#120B20] to-[#0A0714]'} shadow-2xl overflow-hidden`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] pointer-events-none" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
              <div className="md:col-span-8 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    {activePreviewBanner.badge}
                  </span>
                  {activePreviewBanner.discountBadge && (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      ลด {activePreviewBanner.discountBadge}
                    </span>
                  )}
                  {activePreviewBanner.isActive === false && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                      (ซ่อนอยู่)
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-3xl font-black text-white leading-tight">
                  {activePreviewBanner.title}
                </h2>

                {activePreviewBanner.highlightText && (
                  <p className="text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                    {activePreviewBanner.highlightText}
                  </p>
                )}

                <p className="text-xs text-zinc-300 line-clamp-2 max-w-xl">
                  {activePreviewBanner.description}
                </p>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-2xl font-black text-emerald-400">
                    {activePreviewBanner.priceText}
                  </span>
                  {activePreviewBanner.originalPriceText && (
                    <span className="text-xs text-zinc-500 line-through">
                      {activePreviewBanner.originalPriceText}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg">
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>{activePreviewBanner.ctaText || 'สั่งซื้อทันที'}</span>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-white/10 text-white font-semibold text-xs">
                    <span>{activePreviewBanner.secondaryCtaText || 'ดูรายละเอียด'}</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 flex items-center justify-center">
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-spin" />
                  <div className="relative z-10 w-full h-full p-2">
                    <BloxImage
                      src={activePreviewBanner.imageUrl}
                      alt={activePreviewBanner.title}
                      productName={activePreviewBanner.title}
                      className="w-full h-full object-contain drop-shadow-[0_10px_25px_rgba(168,85,247,0.4)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: AI PROMOTIONAL BANNER GENERATOR */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#161026] via-[#100D1F] to-[#0D0B18] border border-purple-500/40 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>สร้างแบนเนอร์โปรโมชั่นด้วย AI (AI Banner Generator)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-extrabold border border-purple-500/30">
                  SMART AI
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                เลือกผลปีศาจหรือไอเทม Blox Fruits ที่ต้องการ ระบบจะผสมผสานงานศิลป์ ข้อความดึงดูด และธีมสีให้ทันที
              </p>
            </div>
          </div>
        </div>

        {/* AI Selection Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Item Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>เลือกสินค้า Blox Fruits สำหรับทำแบนเนอร์</span>
            </label>
            <select
              value={selectedTemplateIndex}
              onChange={(e) => setSelectedTemplateIndex(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0B16] border border-[#27203A] text-white text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {BLOX_BANNER_TEMPLATES.map((tmpl, idx) => (
                <option key={idx} value={idx} className="bg-[#0D0B16] text-white">
                  [{tmpl.category}] {tmpl.th}
                </option>
              ))}
            </select>
          </div>

          {/* Visual Style */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-pink-400" />
              <span>สไตล์งานศิลป์ & บรรยากาศ (Art Style / Mood)</span>
            </label>
            <select
              value={selectedArtStyle}
              onChange={(e) => setSelectedArtStyle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0B16] border border-[#27203A] text-white text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="Mythical Neon & Ethereal Flames">🔥 Mythical Neon & Ethereal Flames (เปลวไฟจิ้งจอกเก้าหาง ม่วง-ฟ้า)</option>
              <option value="Dragon Eclipse & Inferno">⚡ Dragon Eclipse & Inferno (มังกรแดงอสูร ดุดัน ทรงพลัง)</option>
              <option value="Emperor Gold & Royal Amber">👑 Emperor Gold & Royal Amber (ทองอร่าม สไตล์จักรพรรดิค่าหัว 30M)</option>
              <option value="Cyber Void & Deep Sea Dark">💎 Cyber Void & Deep Sea (ฟ้าเข้ม อวกาศ ดาบดำ & เกมพาส)</option>
              <option value="Japanese Pirate Shrine Anime">🌸 Japanese Pirate Shrine (ศาลเจ้าลอยฟ้า สไตล์อนิเมะพรีเมียม)</option>
            </select>
          </div>
        </div>

        {/* Custom Prompt Textarea */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>คำสั่งเพิ่มเติม / จุดเด่นโปรโมชั่น (Optional AI Prompt)</span>
            </span>
            <span className="text-[10px] text-zinc-500">เช่น ลดพิเศษ 20%, แนะนำสำหรับมือใหม่, ของแท้ VIP</span>
          </label>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="เช่น 'โปรโมชั่นเปิดเทอม ลด 15% พร้อมส่งมอบในเซิร์ฟ VIP ด่วนพิเศษ'"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0B16] border border-[#27203A] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>AI จะสร้างข้อมูลแบนเนอร์ ข้อความโฆษณา และการจัดวางที่สวยงามให้ทันที</span>
          </div>

          <button
            type="button"
            onClick={handleGenerateAIBanner}
            disabled={isGenerating}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white text-xs font-black shadow-lg shadow-purple-600/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>กำลังสร้างแบนเนอร์ AI...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>✨ สั่งสร้างแบนเนอร์ด้วย AI</span>
              </>
            )}
          </button>
        </div>

        {/* Generated Draft Preview Modal / Card */}
        {generatedDraft && (
          <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-[#0C0A14] border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> ผลลัพธ์ที่ AI สร้างขึ้นพร้อมใช้งาน:
              </span>
              <button
                type="button"
                onClick={() => setGeneratedDraft(null)}
                className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                ปิดตัวอย่าง
              </button>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-[#141422] p-1.5 flex items-center justify-center border border-white/10 shrink-0">
                  <BloxImage
                    src={generatedDraft.imageUrl}
                    alt={generatedDraft.title}
                    productName={generatedDraft.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-bold border border-purple-500/40">
                      {generatedDraft.badge}
                    </span>
                    <span className="text-xs font-black text-emerald-400">
                      {generatedDraft.priceText}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">{generatedDraft.title}</h4>
                  <p className="text-xs text-zinc-400 line-clamp-1">{generatedDraft.description}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAcceptGeneratedDraft}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer shrink-0 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มแบนเนอร์นี้ในร้าน</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: BANNER LIST MANAGEMENT */}
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
