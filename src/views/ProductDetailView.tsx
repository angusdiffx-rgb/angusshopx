import React, { useState } from 'react';
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
  Lock
} from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { BloxImage } from '../components/BloxImage';

interface ProductDetailViewProps {
  product: Product;
  allProducts?: Product[];
  onSelectProduct?: (product: Product) => void;
  onBack: () => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({ 
  product, 
  allProducts = [],
  onSelectProduct,
  onBack, 
  onBuyNow 
}) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { success } = useToast();

  const isBeliService = 
    product.name.includes('เงินเขียว') || 
    product.name.includes('Beli') || 
    (product.category === 'บริการ' && product.name.includes('เงิน'));

  const isLevelService = 
    product.productId === 'prod_farm_level' ||
    product.name.includes('ฟาร์มเลเวล') ||
    product.name.includes('Level Farm') ||
    (product.category === 'บริการ' && (product.name.includes('เลเวล') || product.name.includes('Level')));

  const is2xOption = 
    product.name.includes('คูณ 2') || 
    product.name.includes('2x') || 
    product.productId === 'prod_beli_2x';

  // Find partner product (normal vs 2x)
  const normalBeliProduct = allProducts.find(p => 
    p.productId === 'prod_beli_normal' || 
    (p.name.includes('เงินเขียว') && !p.name.includes('คูณ 2') && !p.name.includes('2x'))
  );
  const doubleBeliProduct = allProducts.find(p => 
    p.productId === 'prod_beli_2x' || 
    (p.name.includes('เงินเขียว') && (p.name.includes('คูณ 2') || p.name.includes('2x')))
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

  const handleAddToCart = () => {
    if (product.stock <= 0) return;
    addToCart(product, quantity);
    success('เพิ่มลงตะกร้าแล้ว', `เพิ่ม ${product.name} จำนวน ${quantity} ชิ้นเรียบร้อย`);
  };

  const handleDirectBuy = () => {
    if (product.stock <= 0) return;
    addToCart(product, quantity);
    onBuyNow(product, quantity);
  };

  const discountPercent = product.oldPrice && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <div className="w-full max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 pb-24 sm:pb-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer bg-[#11111A] px-3 py-1.5 rounded-xl border border-[#212133]"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับไปที่ร้านค้า
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
        
        {/* Left: Product Media Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-[#0D0D15] border border-[#262638] shadow-2xl p-6 flex items-center justify-center">
            <BloxImage
              src={product.image}
              alt={product.name}
              productName={product.name}
              className="w-full h-full object-contain object-center drop-shadow-[0_8px_24px_rgba(147,51,234,0.35)]"
            />
            {discountPercent > 0 && (
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 sm:px-3 py-1 rounded-xl bg-rose-600 text-white font-extrabold text-[11px] sm:text-xs tracking-wider shadow-lg">
                ลดพิเศษ -{discountPercent}%
              </div>
            )}
            <div className={`absolute top-3 right-3 sm:top-4 sm:right-4 px-2.5 sm:px-3 py-1 rounded-xl backdrop-blur-md font-semibold text-[11px] sm:text-xs border ${
              product.category === 'สกินผล'
                ? 'bg-gradient-to-r from-fuchsia-600/90 to-purple-600/90 border-fuchsia-400/40 text-fuchsia-100 shadow-md shadow-fuchsia-500/25'
                : 'bg-black/70 border-white/10 text-white'
            }`}>
              {product.category}
            </div>
          </div>
        </div>

        {/* Right: Product Info & Actions */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            
            {/* Rarity & Badges */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {product.rarity && (
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold">
                  ระดับ: {product.rarity}
                </span>
              )}
              {product.fruitType && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                  ประเภท: {product.fruitType}
                </span>
              )}
              {product.stock > 0 ? (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> มีสินค้าพร้อมส่ง ({product.stock} ชิ้น)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-semibold">
                  สินค้าหมดชั่วคราว
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
              {product.name}
            </h1>

            {/* Pricing */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#11111A] border border-[#212133] flex items-baseline gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl font-black text-purple-400">฿{(product.price || 0).toLocaleString()}</span>
              {Boolean(product.oldPrice && product.oldPrice > product.price) && (
                <span className="text-xs sm:text-sm text-zinc-500 line-through">
                  ฿{(product.oldPrice || 0).toLocaleString()}
                </span>
              )}
              {isBeliService && (
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                  ต่อ 1,000,000 Beli (1M)
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-xs text-emerald-400 font-bold ml-auto">
                  ประหยัด ฿{Math.max(0, (product.oldPrice || product.price) - product.price).toLocaleString()}
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
                    : isLevelService 
                    ? 'เลือกจำนวนเลเวลที่ต้องการ (ชุดละ 100 เลเวล)' 
                    : 'เลือกจำนวน'}
                </h3>
                {isBeliService && (
                  <span className="text-[11px] font-bold text-emerald-400">
                    จะได้รับ: {(quantity * 1000000).toLocaleString()} Beli ({quantity}M)
                  </span>
                )}
                {isLevelService && (
                  <span className="text-[11px] font-bold text-cyan-400">
                    จะได้รับ: {(quantity * 100).toLocaleString()} เลเวล
                  </span>
                )}
              </div>

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

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center bg-[#11111A] border border-[#262638] rounded-xl p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#1E1E2E] transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-16 text-center text-sm font-bold text-white">
                    {quantity} {isBeliService ? 'M' : isLevelService ? 'ชุด' : ''}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#1E1E2E] transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-zinc-400">
                  รวม: <strong className="text-white font-bold text-sm">฿{((product.price || 0) * quantity).toLocaleString()}</strong>
                  {isBeliService && (
                    <span className="text-emerald-400 font-semibold ml-1.5">
                      ({(quantity * 1000000).toLocaleString()} Beli)
                    </span>
                  )}
                  {isLevelService && (
                    <span className="text-cyan-400 font-semibold ml-1.5">
                      ({(quantity * 100).toLocaleString()} เลเวล)
                    </span>
                  )}
                </span>
              </div>
            </div>

          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:block space-y-4 pt-4 border-t border-[#1E1E2E]">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="py-3.5 px-4 rounded-xl bg-[#181826] hover:bg-[#202033] border border-[#2C2C42] hover:border-purple-500/40 text-zinc-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                <span>เพิ่มลงตะกร้า</span>
              </button>

              <button
                onClick={handleDirectBuy}
                disabled={product.stock <= 0}
                className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>ซื้อทันที</span>
              </button>
            </div>

            {/* Delivery Instructions Box */}
            <div className="p-4 rounded-2xl bg-[#0D0D16] border border-[#212130] space-y-2">
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
                {isLevelService ? (
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
          {isLevelService 
            ? `หลังชำระเงิน ไปที่เมนู "คลังสินค้า" เพื่อดูสถานะคำสั่งซื้อ ทีมงานจะดำเนินการฟาร์มเลเวลให้ครบ ${(quantity * 100).toLocaleString()} เลเวล ปลอดภัย 100%`
            : product.category === 'บริการ' || product.deliveryType === 'manual_service' || product.deliveryType === 'service'
            ? 'หลังชำระเงิน ไปที่เมนู "คลังสินค้า" เพื่อดูสถานะคำสั่งซื้อ ทีมงานจะดำเนินการฟาร์มเงินเขียวให้ครบตามจำนวน M ที่สั่งซื้อ ปลอดภัย 100%'
            : 'หลังชำระเงิน ไปที่เมนู "คลังสินค้า" เพื่อกดเข้าร่วม Private Server VIP และเทรดรับผลปีศาจได้ทันที ปลอดภัย ไม่ต้องใช้รหัสผ่าน Roblox'}
        </p>
      </div>

      {/* Mobile Sticky Bottom Purchase Bar */}
      <div className="sm:hidden fixed bottom-14 left-0 right-0 z-40 bg-[#0A0A12]/95 backdrop-blur-xl border-t border-[#232336] p-3 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-zinc-400 block">ราคารวม ({quantity} ชิ้น)</span>
            <span className="text-base font-black text-purple-300">฿{((product.price || 0) * quantity).toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="p-2.5 rounded-xl bg-[#1C1C2C] border border-[#2F2F44] text-zinc-200 active:scale-95 disabled:opacity-30"
              title="เพิ่มลงตะกร้า"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
            <button
              onClick={handleDirectBuy}
              disabled={product.stock <= 0}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 active:scale-95 disabled:opacity-30"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>ซื้อทันที</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
