import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Sparkles,
  Server,
  Lock,
  Calculator,
  Target,
  Flame,
  Crown,
  Swords,
  Skull,
  Share2
} from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { BloxImage } from '../components/BloxImage';
import { useProductSEO } from '../lib/seo';
import { ProductShareModal } from '../components/ProductShareModal';

interface ProductDetailViewProps {
  product: Product;
  allProducts?: Product[];
  onSelectProduct?: (product: Product) => void;
  onBack: () => void;
  onBuyNow: (
    product: Product, 
    quantity?: number, 
    options?: {
      selectedOption?: string;
      targetNote?: string;
      customPrice?: number;
      customImage?: string;
      alreadyAdded?: boolean;
    }
  ) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({ 
  product, 
  allProducts = [],
  onSelectProduct,
  onBack, 
  onBuyNow 
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Dynamic OpenGraph, Twitter Cards, and Schema.org Product JSON-LD
  useProductSEO(product);

  const [masteryTarget, setMasteryTarget] = useState<'ผล' | 'หมัด' | 'ปืน'>('ผล');
  const [masteryItemName, setMasteryItemName] = useState('');
  const [bountyFaction, setBountyFaction] = useState<'pirate' | 'marine'>('pirate');
  const [selectedBountyTier, setSelectedBountyTier] = useState<'10M' | '20M' | '30M'>(() => {
    if (product.name.includes('30M') || product.name.includes('30m')) return '30M';
    if (product.name.includes('20M') || product.name.includes('20m')) return '20M';
    return '10M';
  });
  const { addToCart } = useCart();
  const { success } = useToast();

  useEffect(() => {
    if (product.name.includes('30M') || product.name.includes('30m')) {
      setSelectedBountyTier('30M');
    } else if (product.name.includes('20M') || product.name.includes('20m')) {
      setSelectedBountyTier('20M');
    }
  }, [product]);

  const BOUNTY_TIERS: Record<'10M' | '20M' | '30M', {
    tier: '10M' | '20M' | '30M';
    title: string;
    price: number;
    oldPrice: number;
    badge: string;
    image: string;
    desc: string;
  }> = {
    '10M': {
      tier: '10M',
      title: '10M Bounty / Honor',
      price: 500,
      oldPrice: 650,
      badge: '🥉 เริ่มต้นสายล่า',
      image: product.tierImages?.['10M'] || product.image || '/images/blox/bounty_hunt_10m.png',
      desc: 'ปลดล็อกฉายานักล่า + โบนัสบัฟ PvP เริ่มต้น'
    },
    '20M': {
      tier: '20M',
      title: '20M Bounty / Honor',
      price: 1000,
      oldPrice: 1300,
      badge: '🥈 Max PvP Boost',
      image: product.tierImages?.['20M'] || '/images/blox/bounty_hunt_20m.png',
      desc: 'โบนัสดาเมจและเกราะป้องกันสูงสุดในเกม Blox Fruits'
    },
    '30M': {
      tier: '30M',
      title: '30M Bounty / Honor (Max Cap)',
      price: 1500,
      oldPrice: 1900,
      badge: '👑 เพดานสูงสุด 30M',
      image: product.tierImages?.['30M'] || '/images/blox/bounty_hunt_30m.png',
      desc: 'เพดานสูงสุดในเกม Blox Fruits + ฉายาจักรพรรดิ'
    }
  };

  const isFragmentService = 
    product.productId === 'prod_farm_fragment_10k' ||
    product.name.includes('เงินม่วง') ||
    product.name.includes('Fragment') ||
    product.name.includes('แฟรกเมนต์');

  const isBeliService = 
    !isFragmentService && (
      product.productId === 'prod_beli_normal' ||
      product.productId === 'prod_beli_2x' ||
      product.name.includes('เงินเขียว') || 
      product.name.includes('Beli') || 
      (product.category === 'บริการ' && product.name.includes('เงิน') && !product.name.includes('เงินม่วง') && !product.name.includes('Fragment'))
    );

  const isLevelService = 
    product.productId === 'prod_farm_level' ||
    product.name.includes('ฟาร์มเลเวล') ||
    product.name.includes('Level Farm') ||
    (product.category === 'บริการ' && (product.name.includes('เลเวล') || product.name.includes('Level')));

  const isMasteryService = 
    product.productId === 'prod_farm_mastery_100' ||
    product.name.includes('ฟาร์มมาสเตอร์รี่') ||
    product.name.includes('มาสเตอร์รี่') ||
    product.name.includes('Mastery') ||
    (product.category === 'บริการ' && (product.name.includes('มาส') || product.name.includes('มาสเตอร์')));

  // Maximum allowed quantity: Mastery max is 600 (6 packs of 100)
  const maxAllowedQty = isMasteryService ? Math.min(product.stock, 6) : product.stock;

  const is2xOption = 
    product.name.includes('คูณ 2') || 
    product.name.includes('2x') || 
    product.productId === 'prod_beli_2x';

  // Find partner product (normal vs 2x)
  const normalBeliProduct = allProducts.find(p => 
    !p.name.includes('เงินม่วง') &&
    !p.name.includes('Fragment') &&
    !p.name.includes('แฟรกเมนต์') &&
    (p.productId === 'prod_beli_normal' || 
     ((p.name.includes('เงินเขียว') || p.name.includes('Beli') || (p.category === 'บริการ' && p.name.includes('เงิน'))) && 
      !p.name.includes('คูณ 2') && !p.name.includes('2x')))
  );
  const doubleBeliProduct = allProducts.find(p => 
    !p.name.includes('เงินม่วง') &&
    !p.name.includes('Fragment') &&
    !p.name.includes('แฟรกเมนต์') &&
    (p.productId === 'prod_beli_2x' || 
     ((p.name.includes('เงินเขียว') || p.name.includes('Beli') || (p.category === 'บริการ' && p.name.includes('เงิน'))) && 
      (p.name.includes('คูณ 2') || p.name.includes('2x'))))
  );

  // CDK (ดาบคู่โอเด้ง) options detection
  const isCdkService = 
    product.category === 'บริการ' &&
    (product.name.includes('ดาบคู่') || product.name.includes('CDK') || product.name.includes('โอเด้ง'));

  const isCdkNoSwords = 
    product.name.includes('ยังไม่มี') || 
    product.productId === 'prod_cdk_no_swords';

  const cdkHasSwordsProduct = allProducts.find(p => 
    p.productId === 'prod_cdk_has_swords' || 
    (p.category === 'บริการ' && (p.name.includes('ดาบคู่') || p.name.includes('CDK') || p.name.includes('โอเด้ง')) && (p.name.includes('มีดาบ') || p.name.includes('45')))
  );

  const cdkNoSwordsProduct = allProducts.find(p => 
    p.productId === 'prod_cdk_no_swords' || 
    (p.category === 'บริการ' && (p.name.includes('ดาบคู่') || p.name.includes('CDK') || p.name.includes('โอเด้ง')) && (p.name.includes('ยังไม่มี') || p.name.includes('100')))
  );

  // Haki V2 service detection
  const isHakiV2 = 
    product.category === 'บริการ' &&
    (product.name.includes('ฮาคิ') || product.name.includes('Haki'));

  // Dragon Race V4 T10 service detection
  const isDragonRaceV4 = 
    product.category === 'บริการ' &&
    (product.name.includes('เผ่ามังกร') || product.name.includes('V4T10') || product.productId === 'prod_race_v4_dragon_t10');

  // Island Quests + Combat V2 service detection
  const isIslandCombatV2 =
    product.category === 'บริการ' &&
    (product.name.includes('เควสเกาะ') || product.name.includes('Combat') || product.name.includes('คอมแบท') || product.productId === 'prod_island_combat_v2');

  // Multi-tier Bounty Hunting service detection (10M / 20M / 30M package bundle)
  const isMultiTierBounty = 
    product.productId === 'prod_bounty_hunt' ||
    (product.category === 'บริการ' && (
      product.name.includes('10M / 20M / 30M') || 
      product.name.includes('10M-30M') ||
      product.name.includes('(2.5M - 30M)')
    ));

  // Any bounty service (including standalone custom bounty products like "รับแค่ 1คน ล่าค่าหัว 30M")
  const isBountyService = 
    product.category === 'บริการ' &&
    (product.name.includes('ค่าหัว') || product.name.includes('Bounty') || product.productId.includes('bounty'));

  const activeProductPrice = isMultiTierBounty 
    ? BOUNTY_TIERS[selectedBountyTier].price 
    : product.price;

  const activeProductOldPrice = isMultiTierBounty 
    ? BOUNTY_TIERS[selectedBountyTier].oldPrice 
    : product.oldPrice;

  const activeProductImage = isMultiTierBounty 
    ? (product.tierImages?.[selectedBountyTier] || BOUNTY_TIERS[selectedBountyTier].image || product.image)
    : product.image;

  const handleAddToCart = () => {
    if (product.stock <= 0) return;
    const finalQty = Math.min(quantity, maxAllowedQty);

    if (isMultiTierBounty) {
      const tierData = BOUNTY_TIERS[selectedBountyTier];
      const factionText = bountyFaction === 'pirate' ? 'ฝ่ายโจรสลัด (Pirate Bounty 🏴‍☠️)' : 'ฝ่ายทหารเรือ (Marine Honor ⚓)';
      const selectedOption = `แพ็กเกจ ${selectedBountyTier} - ${factionText}`;
      const targetNote = `ระดับ: ${selectedBountyTier} | ฝ่าย: ${bountyFaction === 'pirate' ? 'โจรสลัด' : 'ทหารเรือ'}`;

      const tierImage = product.tierImages?.[selectedBountyTier] || tierData.image;

      addToCart(
        { ...product, name: `${product.name} [${selectedBountyTier}]`, image: tierImage },
        finalQty,
        selectedOption,
        targetNote,
        tierData.price,
        tierImage
      );
      success(
        'เพิ่มลงตะกร้าแล้ว',
        `เพิ่มบริการล่าค่าหัว [แพ็กเกจ ${selectedBountyTier} - ${bountyFaction === 'pirate' ? 'โจรสลัด' : 'ทหารเรือ'}] ฿${tierData.price.toLocaleString()} เรียบร้อย`
      );
      return;
    }

    if (isBountyService) {
      const factionText = bountyFaction === 'pirate' ? 'ฝ่ายโจรสลัด (Pirate Bounty 🏴‍☠️)' : 'ฝ่ายทหารเรือ (Marine Honor ⚓)';
      const selectedOption = factionText;
      const targetNote = `ฝ่าย: ${bountyFaction === 'pirate' ? 'โจรสลัด' : 'ทหารเรือ'}`;

      addToCart(
        product,
        finalQty,
        selectedOption,
        targetNote,
        product.price,
        product.image
      );
      success(
        'เพิ่มลงตะกร้าแล้ว',
        `เพิ่ม ${product.name} [${factionText}] ฿${(product.price * finalQty).toLocaleString()} เรียบร้อย`
      );
      return;
    }

    const selectedOption = isMasteryService 
      ? masteryTarget 
      : undefined;

    const targetNote = isMasteryService && masteryItemName.trim() 
      ? masteryItemName.trim() 
      : undefined;

    addToCart(product, finalQty, selectedOption, targetNote);
    success(
      'เพิ่มลงตะกร้าแล้ว', 
      isMasteryService
        ? `เพิ่ม ${product.name} [ประเภท: ${masteryTarget}] ${masteryItemName.trim() ? `(${masteryItemName.trim()})` : ''} จำนวน ${finalQty} ชุดเรียบร้อย`
        : `เพิ่ม ${product.name} จำนวน ${finalQty} ชิ้นเรียบร้อย`
    );
  };

  const handleDirectBuy = () => {
    if (product.stock <= 0) return;
    const finalQty = Math.min(quantity, maxAllowedQty);

    if (isMultiTierBounty) {
      const tierData = BOUNTY_TIERS[selectedBountyTier];
      const factionText = bountyFaction === 'pirate' ? 'ฝ่ายโจรสลัด (Pirate Bounty 🏴‍☠️)' : 'ฝ่ายทหารเรือ (Marine Honor ⚓)';
      const selectedOption = `แพ็กเกจ ${selectedBountyTier} - ${factionText}`;
      const targetNote = `ระดับ: ${selectedBountyTier} | ฝ่าย: ${bountyFaction === 'pirate' ? 'โจรสลัด' : 'ทหารเรือ'}`;

      const customProd: Product = {
        ...product,
        name: `${product.name} [${selectedBountyTier}]`,
        price: tierData.price,
        image: tierData.image
      };

      addToCart(customProd, finalQty, selectedOption, targetNote, tierData.price, tierData.image);
      onBuyNow(customProd, finalQty, { alreadyAdded: true });
      return;
    }

    if (isBountyService) {
      const factionText = bountyFaction === 'pirate' ? 'ฝ่ายโจรสลัด (Pirate Bounty 🏴‍☠️)' : 'ฝ่ายทหารเรือ (Marine Honor ⚓)';
      const selectedOption = factionText;
      const targetNote = `ฝ่าย: ${bountyFaction === 'pirate' ? 'โจรสลัด' : 'ทหารเรือ'}`;

      addToCart(product, finalQty, selectedOption, targetNote, product.price, product.image);
      onBuyNow(product, finalQty, { alreadyAdded: true });
      return;
    }

    const selectedOption = isMasteryService 
      ? masteryTarget 
      : undefined;

    const targetNote = isMasteryService && masteryItemName.trim() 
      ? masteryItemName.trim() 
      : undefined;

    addToCart(product, finalQty, selectedOption, targetNote);
    onBuyNow(product, finalQty, { alreadyAdded: true });
  };

  const discountPercent = activeProductOldPrice && activeProductOldPrice > activeProductPrice
    ? Math.round(((activeProductOldPrice - activeProductPrice) / activeProductOldPrice) * 100)
    : 0;

  return (
    <div className="w-full max-w-6xl 2xl:max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 pb-24 sm:pb-8 overflow-x-hidden [overscroll-behavior-x:none] [touch-action:pan-y_pinch-zoom]">
      {/* Top Header Bar: Back Button & Social Share Button */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#B8AEC9] hover:text-white transition-all cursor-pointer bg-[rgba(255,255,255,0.04)] hover:bg-[#6D28D9]/20 px-4 py-2.5 rounded-2xl border border-[rgba(168,85,247,0.20)] hover:border-[rgba(192,132,252,0.45)] shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-[#C084FC]" />
          <span>กลับไปที่ร้านค้า</span>
        </button>

        <button
          onClick={() => setIsShareModalOpen(true)}
          className="inline-flex items-center gap-2 text-xs font-bold text-white transition-all cursor-pointer bg-gradient-to-r from-[#6D28D9]/40 to-[#A855F7]/30 hover:from-[#6D28D9]/70 hover:to-[#A855F7]/60 px-4 py-2.5 rounded-2xl border border-[rgba(168,85,247,0.30)] hover:border-[#C084FC] shadow-lg shadow-purple-950/40 active:scale-95"
          title="แชร์สินค้านี้ไปยัง Facebook, X, LINE หรือคัดลอกลิงก์"
        >
          <Share2 className="w-4 h-4 text-[#C084FC]" />
          <span>แชร์สินค้า (Social Share)</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
        
        {/* Left: Product Media Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-[rgba(255,255,255,0.03)] backdrop-blur-[18px] border border-[rgba(168,85,247,0.25)] shadow-[0_12px_40px_rgba(7,5,15,0.8),0_0_35px_rgba(168,85,247,0.15)] p-6 sm:p-8 flex items-center justify-center group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#6D28D9]/15 via-transparent to-[#C084FC]/10 pointer-events-none group-hover:opacity-100 transition-opacity"></div>
            <BloxImage
              src={activeProductImage}
              alt={product.name}
              productName={product.name}
              className="w-full h-full object-contain object-center drop-shadow-[0_12px_32px_rgba(168,85,247,0.40)] group-hover:scale-105 transition-transform duration-500"
            />
            {discountPercent > 0 && (
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 pointer-events-none">
                <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-mono text-xs font-black tracking-tight shadow-md">
                  ลด -{discountPercent}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Info & Actions */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            
            {/* Clean Unboxed Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-medium">
              <span className="text-purple-400 font-semibold tracking-wider uppercase text-[11px] sm:text-xs">
                {product.category}
              </span>
              {product.rarity && (
                <>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>ระดับ: {product.rarity}</span>
                </>
              )}
              {product.fruitType && (
                <>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>ประเภท: {product.fruitType}</span>
                </>
              )}
              <span aria-hidden="true" className="text-zinc-600">·</span>
              {product.stock > 0 ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_#34D399]" />
                  พร้อมส่ง ({product.stock} ชิ้น)
                </span>
              ) : (
                <span className="text-rose-400 font-medium">สินค้าหมดชั่วคราว</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
              {product.name}
            </h1>

            {/* Pricing Module */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0E0C16] border border-white/[0.08] flex items-baseline gap-2 sm:gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono tabular-nums">
                ฿{(activeProductPrice || 0).toLocaleString()}
              </span>
              {Boolean(activeProductOldPrice && activeProductOldPrice > activeProductPrice) && (
                <span className="text-sm sm:text-base text-zinc-500 line-through font-mono tabular-nums">
                  ฿{(activeProductOldPrice || 0).toLocaleString()}
                </span>
              )}
              {isBountyService && (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                  แพ็กเกจ {selectedBountyTier}
                </span>
              )}
              {isBeliService && (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                  ต่อ 1,000,000 Beli (1M)
                </span>
              )}
              {isFragmentService && (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold">
                  ต่อ 10,000 Fragments (10k)
                </span>
              )}
              {isLevelService && (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold">
                  ต่อ 100 เลเวล (10 บาท)
                </span>
              )}
              {isMasteryService && (
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                  ต่อ 100 มาส (10 บาท)
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-xs text-emerald-400 font-bold ml-auto">
                  ประหยัด ฿{Math.max(0, (activeProductOldPrice || activeProductPrice) - activeProductPrice).toLocaleString()}
                </span>
              )}
            </div>

            {/* Beli Service Options Switcher (1M = 5฿ / มีคูณ 2 = 3฿) */}
            {isBeliService && (
              <div className="space-y-2 p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-950/20 via-[#11111A] to-[#151524] border border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    เลือกแพ็กเกจคูณ 2 ในเกม
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {is2xOption ? 'อัตรา: 1M = 3 บาท' : 'อัตรา: 1M = 5 บาท'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (is2xOption && normalBeliProduct && onSelectProduct) {
                        onSelectProduct(normalBeliProduct);
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 border cursor-pointer ${
                      !is2xOption
                        ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/40'
                        : 'bg-[#141420] border-[#2A2A3E] text-zinc-400 hover:text-white hover:bg-[#1A1A2A]'
                    }`}
                  >
                    <span>ไม่มีคูณ 2</span>
                    <span className="text-[10px] text-emerald-400 font-extrabold">1M = 5 บาท</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!is2xOption && doubleBeliProduct && onSelectProduct) {
                        onSelectProduct(doubleBeliProduct);
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 border cursor-pointer ${
                      is2xOption
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white shadow-md shadow-purple-500/30 ring-1 ring-purple-400/40'
                        : 'bg-[#141420] border-[#2A2A3E] text-zinc-400 hover:text-white hover:bg-[#1A1A2A]'
                    }`}
                  >
                    <span>มีคูณ 2 (2x Money)</span>
                    <span className="text-[10px] text-purple-300 font-extrabold">1M = 3 บาท (สุดคุ้ม)</span>
                  </button>
                </div>
              </div>
            )}

            {/* CDK Service Options Switcher (มีดาบแล้ว 45฿ / ยังไม่มี 100฿) */}
            {isCdkService && (
              <div className="space-y-2 p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-red-950/25 via-[#11111A] to-[#1F1424] border border-red-500/35">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    เลือกตัวเลือกบริการดาบคู่โอเด้ง (CDK)
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {isCdkNoSwords ? 'แพ็กเกจ: ยังไม่มีดาบ (100฿)' : 'แพ็กเกจ: มีดาบครบแล้ว (45฿)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isCdkNoSwords && cdkHasSwordsProduct && onSelectProduct) {
                        onSelectProduct(cdkHasSwordsProduct);
                      }
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 border cursor-pointer ${
                      !isCdkNoSwords
                        ? 'bg-red-500/20 border-red-400 text-white shadow-md shadow-red-500/25 ring-1 ring-red-400/40'
                        : 'bg-[#141420] border-[#2A2A3E] text-zinc-400 hover:text-white hover:bg-[#1A1A2A]'
                    }`}
                  >
                    <span>มีดาบ Yama + Tushita แล้ว</span>
                    <span className="text-[11px] text-amber-300 font-black">ราคา 45 บาท</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isCdkNoSwords && cdkNoSwordsProduct && onSelectProduct) {
                        onSelectProduct(cdkNoSwordsProduct);
                      }
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 border cursor-pointer ${
                      isCdkNoSwords
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 border-red-400 text-white shadow-md shadow-red-500/30 ring-1 ring-red-400/40'
                        : 'bg-[#141420] border-[#2A2A3E] text-zinc-400 hover:text-white hover:bg-[#1A1A2A]'
                    }`}
                  >
                    <span>ยังไม่มีดาบ (รับฟาร์มให้ครบ)</span>
                    <span className="text-[11px] text-yellow-300 font-black">ราคา 100 บาท</span>
                  </button>
                </div>
              </div>
            )}

            {/* Haki V2 Service Requirement Alert */}
            {isHakiV2 && (
              <div className="space-y-2 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-950/25 via-[#13121F] to-[#1F1610] border border-amber-500/35">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    เงื่อนไขสำคัญก่อนสั่งซื้อบริการฮาคิ V2
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black border border-amber-500/30">
                    ราคา 20 บาท
                  </span>
                </div>
                <div className="text-xs text-zinc-300 space-y-1 pt-1">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-xs">
                    <span className="text-base">⚠️</span>
                    <span>เงินในเกม (Beli) ต้องมีครบอย่างน้อย 5,000,000 (5 ล้าน Beli)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                    ทีมงานจะเข้าไอดีเพื่อทำ Citizen Quest และซื้อปลดล็อกฮาคิสังเกต V2 ให้จนเสร็จสิ้น ปลอดภัย 100% ดูแลโดยทีมงานมืออาชีพ
                  </p>
                </div>
              </div>
            )}

            {/* Dragon Race V4 T10 Highlight Card */}
            {isDragonRaceV4 && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-red-950/35 via-[#161018] to-[#1C1220] border border-red-500/40 shadow-lg shadow-red-950/25 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black text-red-400 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-red-400" />
                    บริการรับทำ เผ่ามังกร V4T10 (Draco Race V4 Max T10)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-black border border-red-500/30">
                    ราคา 300 บาท
                  </span>
                </div>
                <div className="text-xs text-zinc-300 space-y-1 pt-0.5">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 font-bold text-xs">
                    <span className="text-base">🐉</span>
                    <span>หมุนเกียร์ครบทุกเฟือง ปลดล็อกเกียร์สูงสุด Tier 10 (Max T10) ครบสูตร</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                    ทีมงานเข้าทำเควส Trial เผ่ามังกรและอัปเกรดเกียร์ V4 จนเต็ม T10 ปลอดภัย 100% ไม่ใช้โปรแกรมเสี่ยงแบน ตรวจสอบคิวงานและสถานะได้ในคลังสินค้า
                  </p>
                </div>
              </div>
            )}

            {/* Island Quests + Combat V2 Highlight Card */}
            {isIslandCombatV2 && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-[#140c24] to-[#1d1130] border border-purple-500/40 shadow-lg shadow-purple-950/30 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    👑 เควสเกาะทั้งหมด + หมัด Combat V2 (All Island Quests & Combat V2)
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/25 text-purple-200 font-black border border-purple-500/40">
                    ราคา 350 บาท
                  </span>
                </div>
                <div className="text-xs text-zinc-300 space-y-1.5 pt-0.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-200 font-bold text-xs">
                      <span className="text-base">🏝️</span>
                      <span>เคลียร์เควสเกาะทั้งหมด ครบทุกเกาะ</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-200 font-bold text-xs">
                      <span className="text-base">🥊</span>
                      <span>ปลดล็อกหมัด Combat V2 พร้อมใช้ทันที</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                    ทีมงานเข้าดำเนินการเควสเกาะทั้งหมดและปลดล็อกหมัด Combat V2 ให้ครบถ้วน ปลอดภัย 100% ดูแลโดยทีมงานมืออาชีพ ไม่ใช้โปรแกรมเสี่ยงแบน ตรวจสอบคิวงานได้ตลอด 24 ชั่วโมง
                  </p>
                </div>
              </div>
            )}

            {/* Multi-Tier Bounty Hunting Service (บริการล่าค่าหัว 10M / 20M / 30M) */}
            {isMultiTierBounty && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-[#160f1e] to-[#221017] border border-amber-500/35 shadow-xl shadow-amber-950/20 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400" />
                    บริการล่าค่าหัว Blox Fruits (Bounty & Honor Hunt)
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 font-black border border-amber-500/40">
                    แพ็กเกจที่เลือก: {selectedBountyTier} (฿{BOUNTY_TIERS[selectedBountyTier].price.toLocaleString()} บาท)
                  </span>
                </div>

                {/* Package Tier Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                    <span>เลือกระดับค่าหัวที่ต้องการ (Select Bounty Tier):</span>
                    <span className="text-[10px] text-amber-400 font-medium">กดเลือกแพ็กเกจที่ต้องการ</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(Object.keys(BOUNTY_TIERS) as Array<'10M' | '20M' | '30M'>).map(tierKey => {
                      const item = BOUNTY_TIERS[tierKey];
                      const isSelected = selectedBountyTier === tierKey;
                      return (
                        <button
                          key={tierKey}
                          type="button"
                          onClick={() => setSelectedBountyTier(tierKey)}
                          className={`p-3 rounded-xl text-left transition-all relative border flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-b from-amber-500/25 to-amber-950/40 border-amber-400 ring-2 ring-amber-400/30 text-white shadow-lg shadow-amber-950/40'
                              : 'bg-[#11111a] border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-[#161622]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black flex items-center gap-1 text-white">
                                {tierKey === '30M' ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : <Skull className="w-3.5 h-3.5 text-zinc-400" />}
                                {item.title}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                isSelected ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-400 leading-tight mb-2">
                              {item.desc}
                            </p>
                          </div>
                          <div className="flex items-baseline justify-between pt-1 border-t border-white/5">
                            <span className="text-xs font-extrabold text-amber-300">
                              ฿{(item.price || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-zinc-500 line-through">
                              ฿{(item.oldPrice || 0).toLocaleString()}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Faction Choice (โจรสลัด vs ทหารเรือ) */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5 text-amber-400" />
                    <span>เลือกฝ่ายที่ต้องการฟาร์ม (Select Faction):</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBountyFaction('pirate')}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                        bountyFaction === 'pirate'
                          ? 'bg-red-500/25 border-red-500 text-red-200 ring-2 ring-red-500/30'
                          : 'bg-[#11111a] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-sm">🏴‍☠️</span>
                      <span>ฝ่ายโจรสลัด (Pirate Bounty)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBountyFaction('marine')}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                        bountyFaction === 'marine'
                          ? 'bg-blue-500/25 border-blue-500 text-blue-200 ring-2 ring-blue-500/30'
                          : 'bg-[#11111a] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-sm">⚓</span>
                      <span>ฝ่ายทหารเรือ (Marine Honor)</span>
                    </button>
                  </div>
                </div>

                {/* Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 font-bold text-xs">
                    <span className="text-base">⚔️</span>
                    <span>โบนัสดาเมจ & เกราะป้องกัน PvP สูงสุด</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 font-bold text-xs">
                    <span className="text-base">🌊</span>
                    <span>สกิลเรียกเรือรบ & จ้าวทะเล (Sea Beast)</span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  ทีมงานระดับมืออาชีพดำเนินการฟาร์มให้ตามคิวงานอย่างรวดเร็ว ปลอดภัย 100% ไม่ใช้โปรแกรมเสี่ยงแบน ตรวจสอบสถานะและคิวงานได้ตลอด 24 ชม.
                </p>
              </div>
            )}

            {/* Standalone Bounty Service (เช่น รับแค่ 1คน ล่าค่าหัว 30M) */}
            {!isMultiTierBounty && isBountyService && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-[#160f1e] to-[#221017] border border-amber-500/35 shadow-xl shadow-amber-950/20 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400" />
                    บริการล่าค่าหัว Blox Fruits (Bounty & Honor Hunt)
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/40">
                    ราคาพิเศษ ฿{(product.price || 0).toLocaleString()} บาท
                  </span>
                </div>

                {/* Faction Choice (โจรสลัด vs ทหารเรือ) */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5 text-amber-400" />
                    <span>เลือกฝ่ายที่ต้องการฟาร์ม (Select Faction):</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBountyFaction('pirate')}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                        bountyFaction === 'pirate'
                          ? 'bg-red-500/25 border-red-500 text-red-200 ring-2 ring-red-500/30'
                          : 'bg-[#11111a] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-sm">🏴‍☠️</span>
                      <span>ฝ่ายโจรสลัด (Pirate Bounty)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBountyFaction('marine')}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                        bountyFaction === 'marine'
                          ? 'bg-blue-500/25 border-blue-500 text-blue-200 ring-2 ring-blue-500/30'
                          : 'bg-[#11111a] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-sm">⚓</span>
                      <span>ฝ่ายทหารเรือ (Marine Honor)</span>
                    </button>
                  </div>
                </div>

                {/* Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 font-bold text-xs">
                    <span className="text-base">⚔️</span>
                    <span>โบนัสดาเมจ & เกราะป้องกัน PvP สูงสุด</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 font-bold text-xs">
                    <span className="text-base">🌊</span>
                    <span>สกิลเรียกเรือรบ & จ้าวทะเล (Sea Beast)</span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  ทีมงานระดับมืออาชีพดำเนินการฟาร์มให้ตามคิวงานอย่างรวดเร็ว ปลอดภัย 100% ไม่ใช้โปรแกรมเสี่ยงแบน ตรวจสอบสถานะและคิวงานได้ตลอด 24 ชม.
                </p>
              </div>
            )}

            {/* Mastery Calculator (เครื่องคำนวณราคาและจำนวนมาสเตอร์รี่ Blox Fruits) */}
            {isMasteryService && (
              <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-950/25 via-[#13121E] to-[#1C1726] border border-amber-500/35 shadow-lg shadow-amber-950/20">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-amber-400" />
                    เครื่องคำนวณมาสเตอร์รี่ (Mastery Calculator)
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    อัตรา: 100 มาส = 10 บาท
                  </span>
                </div>

                {/* Mastery Target Option Selector: ผล, หมัด, ปืน */}
                <div className="space-y-2 pt-1 pb-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      เลือกประเภทที่ต้องการฟาร์มมาสเตอร์รี่:
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      กดเลือกระหว่าง: ผล / หมัด / ปืน
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Option 1: ผล */}
                    <button
                      type="button"
                      onClick={() => setMasteryTarget('ผล')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        masteryTarget === 'ผล'
                          ? 'bg-gradient-to-b from-purple-500/25 to-purple-950/40 border-purple-400 text-white shadow-md shadow-purple-950/40 ring-2 ring-purple-400/50 font-bold'
                          : 'bg-[#151522] hover:bg-[#1E1D30] border-[#2A293E] text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-lg sm:text-xl">🍎</span>
                      <span className="text-xs font-black">ผล</span>
                      <span className={`text-[10px] ${masteryTarget === 'ผล' ? 'text-purple-300 font-bold' : 'text-zinc-500'}`}>
                        ผลปีศาจ (Fruit)
                      </span>
                    </button>

                    {/* Option 2: หมัด */}
                    <button
                      type="button"
                      onClick={() => setMasteryTarget('หมัด')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        masteryTarget === 'หมัด'
                          ? 'bg-gradient-to-b from-amber-500/25 to-amber-950/40 border-amber-400 text-white shadow-md shadow-amber-950/40 ring-2 ring-amber-400/50 font-bold'
                          : 'bg-[#151522] hover:bg-[#1E1D30] border-[#2A293E] text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-lg sm:text-xl">🥊</span>
                      <span className="text-xs font-black">หมัด</span>
                      <span className={`text-[10px] ${masteryTarget === 'หมัด' ? 'text-amber-300 font-bold' : 'text-zinc-500'}`}>
                        หมัดมวย (Melee)
                      </span>
                    </button>

                    {/* Option 3: ปืน */}
                    <button
                      type="button"
                      onClick={() => setMasteryTarget('ปืน')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        masteryTarget === 'ปืน'
                          ? 'bg-gradient-to-b from-cyan-500/25 to-cyan-950/40 border-cyan-400 text-white shadow-md shadow-cyan-950/40 ring-2 ring-cyan-400/50 font-bold'
                          : 'bg-[#151522] hover:bg-[#1E1D30] border-[#2A293E] text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-lg sm:text-xl">🔫</span>
                      <span className="text-xs font-black">ปืน</span>
                      <span className={`text-[10px] ${masteryTarget === 'ปืน' ? 'text-cyan-300 font-bold' : 'text-zinc-500'}`}>
                        ปืนทุกชนิด (Gun)
                      </span>
                    </button>
                  </div>

                  {/* Optional Specific Item Name */}
                  <div className="pt-0.5">
                    <input
                      type="text"
                      placeholder={`ระบุชื่อ${masteryTarget}ที่ต้องการให้ฟาร์ม เช่น ${
                        masteryTarget === 'ผล' 
                          ? 'ผล Kitsune, ผล Leopard, ผล Buddha ฯลฯ' 
                          : masteryTarget === 'หมัด' 
                          ? 'หมัด Godhuman, Dragon Talon, Sanguine Art ฯลฯ' 
                          : 'ปืน Soul Guitar, Kabucha, Acidum Rifle ฯลฯ'
                      } (ไม่บังคับ)`}
                      value={masteryItemName}
                      onChange={(e) => setMasteryItemName(e.target.value)}
                      className="w-full bg-[#0D0C16] border border-[#29283D] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-zinc-300 leading-snug pt-1">
                  เลือกหรือคำนวณจำนวนมาสเตอร์รี่ที่ต้องการฟาร์ม (ชุดละ 100 มาส = 10 บาท, 200 มาส = 20 บาท):
                </div>

                {/* Preset Calculation Cards: 100=10฿, 200=20฿, 300=30฿, 400=40฿, 500=50฿, 600=60฿ */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                  {[
                    { qty: 1, mastery: 100, price: 10, label: 'เริ่มต้น' },
                    { qty: 2, mastery: 200, price: 20, label: 'สกิล 2' },
                    { qty: 3, mastery: 300, price: 30, label: 'สกิล 3' },
                    { qty: 4, mastery: 400, price: 40, label: 'เควสดาบ' },
                    { qty: 5, mastery: 500, price: 50, label: 'ขั้นสูง' },
                    { qty: 6, mastery: 600, price: 60, label: 'ตัน Max' },
                  ].map((preset) => {
                    const active = quantity === preset.qty;
                    return (
                      <button
                        key={preset.qty}
                        type="button"
                        onClick={() => setQuantity(preset.qty)}
                        className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
                          active
                            ? 'bg-gradient-to-b from-amber-400 to-amber-500 border-amber-200 text-zinc-950 shadow-md shadow-amber-500/30 font-black ring-2 ring-amber-400/50'
                            : 'bg-[#151522] hover:bg-[#1E1D30] border-[#2A293E] text-zinc-300 hover:text-white'
                        }`}
                      >
                        <span className={`text-[10px] ${active ? 'text-zinc-950 font-bold' : 'text-zinc-400'}`}>
                          {preset.label}
                        </span>
                        <span className="text-xs font-black">
                          {preset.mastery} มาส
                        </span>
                        <span className={`text-[11px] font-extrabold ${active ? 'text-zinc-950 underline decoration-zinc-950/40' : 'text-amber-400'}`}>
                          {preset.price} บาท
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Calculation summary banner */}
                <div className="p-3 rounded-xl bg-[#0D0C16] border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 flex-wrap">
                      <span>ประเภทที่เลือกฟาร์ม:</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black text-[11px] border border-amber-500/30">
                        {masteryTarget === 'ผล' ? '🍎 ผล' : masteryTarget === 'หมัด' ? '🥊 หมัด' : '🔫 ปืน'}
                        {masteryItemName.trim() && ` - ${masteryItemName.trim()}`}
                      </span>
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 pt-0.5">
                      <span className="text-amber-300">{(quantity * 100).toLocaleString()} มาสเตอร์รี่</span>
                      <span className="text-zinc-500 text-xs font-normal">({quantity} ชุด x 100 มาส)</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-zinc-400">ราคาสุทธิที่ต้องชำระ</div>
                    <div className="text-base sm:text-lg font-black text-amber-400">
                      ฿{((product.price || 10) * quantity).toLocaleString()} บาท
                    </div>
                  </div>
                </div>

                {/* Scope Note */}
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>รองรับการฟาร์ม: ผลปีศาจ • หมัด/สไตล์ต่อสู้ • ปืน ทุกชนิด</span>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">รายละเอียดสินค้า</h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed bg-[#0D0D14] p-3.5 sm:p-4 rounded-2xl border border-[#1E1E2E] whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {isBeliService 
                    ? 'เลือกจำนวนเงินที่ต้องการ (M)' 
                    : isFragmentService
                    ? 'เลือกจำนวนเงินม่วงที่ต้องการ (ชุดละ 10,000 Fragments)'
                    : isLevelService 
                    ? 'เลือกจำนวนเลเวลที่ต้องการ (ชุดละ 100 เลเวล)' 
                    : isMasteryService
                    ? 'เลือกจำนวนมาสเตอร์รี่ที่ต้องการ (ชุดละ 100 มาส)'
                    : 'เลือกจำนวน'}
                </h3>
                {isBeliService && (
                  <span className="text-[11px] font-bold text-emerald-400">
                    จะได้รับ: {(quantity * 1000000).toLocaleString()} Beli ({quantity}M)
                  </span>
                )}
                {isFragmentService && (
                  <span className="text-[11px] font-bold text-purple-400">
                    จะได้รับ: {(quantity * 10000).toLocaleString()} Fragments ({quantity * 10}k)
                  </span>
                )}
                {isLevelService && (
                  <span className="text-[11px] font-bold text-cyan-400">
                    จะได้รับ: {(quantity * 100).toLocaleString()} เลเวล
                  </span>
                )}
                {isMasteryService && (
                  <span className="text-[11px] font-bold text-amber-400">
                    จะได้รับ: {(quantity * 100).toLocaleString()} มาส (฿{((product.price || 10) * quantity).toLocaleString()})
                  </span>
                )}
              </div>

              {/* Quick Fragment Preset Buttons for Fragment Farm (10k = 20 THB) */}
              {isFragmentService && (
                <div className="flex flex-wrap items-center gap-1.5 pb-1">
                  {[
                    { qty: 1, label: '10k ม่วง (20฿)' },
                    { qty: 2, label: '20k ม่วง (40฿)' },
                    { qty: 3, label: '30k ม่วง (60฿)' },
                    { qty: 5, label: '50k ม่วง (100฿)' },
                    { qty: 10, label: '100k ม่วง (200฿)' },
                  ].map((preset) => (
                    <button
                      key={preset.qty}
                      type="button"
                      onClick={() => setQuantity(preset.qty)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        quantity === preset.qty
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black shadow-md shadow-purple-500/30 ring-1 ring-purple-400/50'
                          : 'bg-[#141420] hover:bg-[#1C1C2C] border border-[#262638] text-zinc-300 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Quick M Preset Buttons for Beli Farm */}
              {isBeliService && (
                <div className="flex flex-wrap items-center gap-1.5 pb-1">
                  {[1, 5, 10, 20, 50, 100].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setQuantity(m)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        quantity === m
                          ? 'bg-emerald-500 text-zinc-950 font-black shadow-md shadow-emerald-500/30'
                          : 'bg-[#141420] hover:bg-[#1C1C2C] border border-[#262638] text-zinc-300 hover:text-white'
                      }`}
                    >
                      {m}M
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Level Preset Buttons for Level Farm (100 Lv = 10 THB) */}
              {isLevelService && (
                <div className="flex flex-wrap items-center gap-1.5 pb-1">
                  {[
                    { qty: 1, label: '100 Lv (10฿)' },
                    { qty: 2, label: '200 Lv (20฿)' },
                    { qty: 5, label: '500 Lv (50฿)' },
                    { qty: 10, label: '1,000 Lv (100฿)' },
                    { qty: 15, label: '1,500 Lv (150฿)' },
                    { qty: 20, label: '2,000 Lv (200฿)' },
                    { qty: 25, label: '2,500 Lv (250฿)' },
                    { qty: 28, label: '2,800 Lv Max (280฿)' },
                  ].map((preset) => (
                    <button
                      key={preset.qty}
                      type="button"
                      onClick={() => setQuantity(preset.qty)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        quantity === preset.qty
                          ? 'bg-cyan-500 text-zinc-950 font-black shadow-md shadow-cyan-500/30'
                          : 'bg-[#141420] hover:bg-[#1C1C2C] border border-[#262638] text-zinc-300 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Mastery Preset Buttons for Mastery Farm (100 มาส = 10 THB - ตันที่ 600 มาส) */}
              {isMasteryService && (
                <div className="space-y-1 pb-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { qty: 1, label: '100 มาส (10฿)' },
                      { qty: 2, label: '200 มาส (20฿)' },
                      { qty: 3, label: '300 มาส (30฿)' },
                      { qty: 4, label: '400 มาส (40฿)' },
                      { qty: 5, label: '500 มาส (50฿)' },
                      { qty: 6, label: '600 มาส ตัน (60฿)' },
                    ].map((preset) => (
                      <button
                        key={preset.qty}
                        type="button"
                        onClick={() => setQuantity(preset.qty)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          quantity === preset.qty
                            ? 'bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/30'
                            : 'bg-[#141420] hover:bg-[#1C1C2C] border border-[#262638] text-zinc-300 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-amber-400/80 font-medium">
                    * จำกัดบริการสูงสุดตันที่ 600 มาสเตอร์รี่ (60 บาท)
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center bg-[#11111A] border border-[#262638] rounded-xl p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#1E1E2E] transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-16 text-center text-sm font-bold text-white">
                    {quantity} {isBeliService ? 'M' : isFragmentService ? 'ชุด' : isLevelService ? 'ชุด' : isMasteryService ? 'ชุด' : ''}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(maxAllowedQty, quantity + 1))}
                    disabled={quantity >= maxAllowedQty}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#1E1E2E] transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-zinc-400">
                  รวม: <strong className="text-white font-bold text-sm">฿{((activeProductPrice || 0) * quantity).toLocaleString()}</strong>
                  {isBountyService && (
                    <span className="text-amber-400 font-semibold ml-1.5">
                      (แพ็กเกจ {selectedBountyTier})
                    </span>
                  )}
                  {isBeliService && (
                    <span className="text-emerald-400 font-semibold ml-1.5">
                      ({(quantity * 1000000).toLocaleString()} Beli)
                    </span>
                  )}
                  {isFragmentService && (
                    <span className="text-purple-400 font-semibold ml-1.5">
                      ({(quantity * 10000).toLocaleString()} Fragments)
                    </span>
                  )}
                  {isLevelService && (
                    <span className="text-cyan-400 font-semibold ml-1.5">
                      ({(quantity * 100).toLocaleString()} เลเวล)
                    </span>
                  )}
                  {isMasteryService && (
                    <span className="text-amber-400 font-semibold ml-1.5">
                      ({(quantity * 100).toLocaleString()} มาสเตอร์รี่)
                    </span>
                  )}
                </span>
              </div>
            </div>

          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:block space-y-3 pt-4 border-t border-[rgba(168,85,247,0.20)]">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="py-4 px-4 rounded-2xl bg-[rgba(255,255,255,0.04)] hover:bg-[#6D28D9]/25 border border-[rgba(168,85,247,0.25)] hover:border-[#C084FC]/60 text-zinc-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] active:scale-95"
              >
                <ShoppingBag className="w-4 h-4 text-[#C084FC]" />
                <span>เพิ่มลงตะกร้า</span>
              </button>

              <button
                onClick={handleDirectBuy}
                disabled={product.stock <= 0}
                className="py-4 px-4 rounded-2xl bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#C084FC] text-white text-xs font-bold shadow-[0_4px_25px_rgba(168,85,247,0.35)] hover:shadow-[0_0_35px_rgba(168,85,247,0.50)] flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>ซื้อทันที</span>
              </button>
            </div>

            {/* Quick Share Button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-2xl bg-[#0F0A1A]/80 hover:bg-[#6D28D9]/20 border border-[rgba(168,85,247,0.20)] hover:border-[rgba(192,132,252,0.45)] text-[#C084FC] hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5 text-[#C084FC]" />
              <span>แชร์สินค้านี้ (OpenGraph / Twitter / LINE)</span>
            </button>

            {/* Delivery Instructions Box */}
            <div className="p-5 rounded-3xl bg-[rgba(255,255,255,0.04)] backdrop-blur-[18px] border border-[rgba(168,85,247,0.18)] shadow-lg space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                {product.category === 'บริการ' || product.deliveryType === 'manual_service' || product.deliveryType === 'service' ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{product.instructionsTitle || 'ขั้นตอนและวิธีการรับบริการฟาร์ม'}</span>
                  </>
                ) : (
                  <>
                    <Server className="w-4 h-4 text-purple-400" />
                    <span>{product.instructionsTitle || 'ข้อมูลและวิธีการรับสินค้า'}</span>
                  </>
                )}
              </div>
              <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                {isMasteryService ? (
                  <>
                    <li>เลือกจำนวนมาสเตอร์รี่ที่ต้องการคำนวณ (1 ชุด = 100 มาส = 10 บาท, 200 มาส = 20 บาท ... สูงสุดตันที่ 600 มาส = 60 บาท)</li>
                    <li>กรอกข้อมูลไอดี-รหัสผ่าน Roblox และระบุผล/ดาบ/หมัดที่ต้องการให้ฟาร์มในขั้นตอนชำระเงิน</li>
                    <li>หลังจากชำระเงิน ให้ไปที่เมนู <strong className="text-white">"คลังสินค้า"</strong> เพื่อตรวจสอบสถานะการฟาร์ม</li>
                    <li>ทีมงาน AngusShop จะเข้าดำเนินการฟาร์มมาสเตอร์รี่ให้ครบตามจำนวน {(quantity * 100).toLocaleString()} มาสที่สั่งซื้อ</li>
                    <li>ปลอดภัย 100% ไม่ใช้โปรแกรมเสี่ยงแบน การันตีความรวดเร็ว ปลอดภัย ไร้กังวล</li>
                  </>
                ) : isLevelService ? (
                  <>
                    <li>เลือกจำนวนชุดที่ต้องการ (1 ชุด = 100 เลเวล, 10 บาท) และกรอกข้อมูลไอดี-รหัสผ่าน Roblox ในขั้นตอนชำระเงิน</li>
                    <li>หลังจากชำระเงิน ให้ไปที่เมนู <strong className="text-white">"คลังสินค้า"</strong> เพื่อตรวจสอบสถานะการฟาร์ม</li>
                    <li>ทีมงาน AngusShop จะเข้าดำเนินการฟาร์มเลเวลให้ครบตามจำนวน {(quantity * 100).toLocaleString()} เลเวลที่สั่งซื้อ</li>
                    <li>ปลอดภัย 100% ไม่ใช้โปรแกรมเสี่ยงแบน การันตีคุณภาพ รวดเร็ว ปลอดภัย</li>
                  </>
                ) : product.category === 'บริการ' || product.deliveryType === 'manual_service' || product.deliveryType === 'service' ? (
                  <>
                    <li>เลือกจำนวน M ที่ต้องการ และกรอกชื่อตัวละคร Roblox ในขั้นตอนชำระเงิน</li>
                    <li>หลังจากชำระเงิน ให้ไปที่เมนู <strong className="text-white">"คลังสินค้า"</strong> เพื่อตรวจสอบสถานะ</li>
                    <li>ทีมงาน AngusShop จะเข้าดำเนินการฟาร์มเงินเขียวให้ครบตามจำนวน M ที่สั่งซื้อ</li>
                    <li>ปลอดภัย 100% ไม่ใช้โปรแกรมเสี่ยงแบน ทีมงานมืออาชีพดูแลตลอด 24 ชม.</li>
                  </>
                ) : (
                  <>
                    <li>หลังจากสั่งซื้อ ให้ไปที่เมนู <strong className="text-white">"คลังสินค้า"</strong></li>
                    <li>จะมีปุ่มเข้า <strong className="text-purple-300">Private Server VIP</strong> ใน Blox Fruits ทันที</li>
                    <li>ทำการ Trade ผลปีศาจกับบอทของร้าน</li>
                    <li>ปลอดภัย 100% ไม่ต้องใช้ Password บัญชี Roblox</li>
                  </>
                )}
              </ul>
            </div>
          </div>

        </div>

      </div>

      {/* Mobile Delivery Box (Always Visible) */}
      <div className="sm:hidden p-4 rounded-2xl bg-[#0D0D16] border border-[#212130] space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
          {product.category === 'บริการ' || product.deliveryType === 'manual_service' || product.deliveryType === 'service' ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ขั้นตอนและวิธีการรับบริการฟาร์ม</span>
            </>
          ) : (
            <>
              <Server className="w-4 h-4 text-purple-400" />
              <span>วิธีการรับผลปีศาจ</span>
            </>
          )}
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          {isMultiTierBounty
            ? `หลังชำระเงิน ไปที่เมนู "คลังสินค้า" เพื่อดูสถานะคำสั่งซื้อ ทีมงานจะดำเนินการฟาร์มล่าค่าหัวให้ครบตามแพ็กเกจ ${selectedBountyTier} (${bountyFaction === 'pirate' ? 'ฝ่ายโจรสลัด' : 'ฝ่ายทหารเรือ'}) ปลอดภัย 100% ไม่ใช้โปรแกรมเสี่ยงแบน`
            : isBountyService
            ? `หลังชำระเงิน ไปที่เมนู "คลังสินค้า" เพื่อดูสถานะคำสั่งซื้อ ทีมงานจะดำเนินการฟาร์มล่าค่าหัวให้ครบ (${bountyFaction === 'pirate' ? 'ฝ่ายโจรสลัด' : 'ฝ่ายทหารเรือ'}) ปลอดภัย 100% ไม่ใช้โปรแกรมเสี่ยงแบน`
            : isMasteryService
            ? `หลังชำระเงิน ไปที่เมนู "คลังสินค้า" เพื่อดูสถานะคำสั่งซื้อ ทีมงานจะดำเนินการฟาร์มมาสเตอร์รี่ให้ครบ ${(quantity * 100).toLocaleString()} มาส ปลอดภัย 100%`
            : isLevelService 
            ? `หลังชำระเงิน ไปที่เมนู "คลังสินค้า" เพื่อดูสถานะคำสั่งซื้อ ทีมงานจะดำเนินการฟาร์มเลเวลให้ครบ ${(quantity * 100).toLocaleString()} เลเวล ปลอดภัย 100%`
            : isFragmentService
            ? `หลังชำระเงิน ไปที่เมนู "คลังสินค้า" เพื่อดูสถานะคำสั่งซื้อ ทีมงานจะดำเนินการฟาร์มเงินม่วงให้ครบ ${(quantity * 10000).toLocaleString()} Fragments ปลอดภัย 100%`
            : isBeliService
            ? `หลังชำระเงิน ไปที่เมนู "คลังสินค้า" เพื่อดูสถานะคำสั่งซื้อ ทีมงานจะดำเนินการฟาร์มเงินเขียวให้ครบ ${(quantity * 1000000).toLocaleString()} Beli (${quantity}M) ปลอดภัย 100%`
            : product.category === 'บริการ' || product.deliveryType === 'manual_service' || product.deliveryType === 'service'
            ? 'หลังชำระเงิน ไปที่เมนู "คลังสินค้า" เพื่อดูสถานะคำสั่งซื้อ ทีมงานจะดำเนินการฟาร์มให้ตามรายการสั่งซื้อ ปลอดภัย 100%'
            : 'หลังชำระเงิน ไปที่เมนู "คลังสินค้า" เพื่อกดเข้าร่วม Private Server VIP และเทรดรับผลปีศาจได้ทันที ปลอดภัย ไม่ต้องใช้รหัสผ่าน Roblox'}
        </p>
      </div>

      {/* Mobile Sticky Bottom Purchase Bar */}
      <div className="sm:hidden fixed bottom-14 left-0 right-0 z-40 bg-[#07050F]/95 backdrop-blur-2xl border-t border-[rgba(168,85,247,0.30)] p-3.5 shadow-[0_-10px_35px_rgba(7,5,15,0.9),0_0_25px_rgba(109,40,217,0.25)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-[#B8AEC9] block">
              ราคารวม ({quantity} {isMultiTierBounty ? 'แพ็กเกจ' : isMasteryService ? 'ชุด' : isLevelService ? 'ชุด' : isFragmentService ? 'ชุด' : isBeliService ? 'M' : 'ชิ้น'})
              {isMultiTierBounty && <span className="text-amber-400 font-bold ml-1">({selectedBountyTier})</span>}
              {isMasteryService && <span className="text-amber-400 font-bold ml-1">({(quantity * 100).toLocaleString()} มาส)</span>}
              {isFragmentService && <span className="text-[#C084FC] font-bold ml-1">({(quantity * 10000).toLocaleString()} ม่วง)</span>}
            </span>
            <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E9D5FF] to-[#C084FC]">
              ฿{((activeProductPrice || 0) * quantity).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(168,85,247,0.25)] text-[#C084FC] hover:text-white active:scale-95 cursor-pointer shadow-sm"
              title="แชร์สินค้านี้"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(168,85,247,0.25)] text-zinc-200 active:scale-95 disabled:opacity-30"
              title="เพิ่มลงตะกร้า"
            >
              <ShoppingBag className="w-4 h-4 text-[#C084FC]" />
            </button>
            <button
              onClick={handleDirectBuy}
              disabled={product.stock <= 0}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#A855F7] text-white text-xs font-black shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-1.5 active:scale-95 disabled:opacity-30 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>ซื้อทันที</span>
            </button>
          </div>
        </div>
      </div>

      {/* Social Media Share Modal */}
      <ProductShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        product={product}
      />
    </div>
  );
};
