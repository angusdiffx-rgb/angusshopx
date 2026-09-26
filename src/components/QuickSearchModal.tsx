import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  ShoppingBag, 
  Wallet, 
  Package, 
  Calculator, 
  Sparkles, 
  ChevronRight, 
  Plus, 
  Flame,
  ArrowRight
} from 'lucide-react';
import { Product } from '../types';
import { BloxImage } from './BloxImage';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { playClickSound, playCartSound } from '../lib/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigate: (view: string, param?: string) => void;
  onOpenCalculator?: () => void;
}

export const QuickSearchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onNavigate,
  onOpenCalculator,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToCart } = useCart();
  const { success } = useToast();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Global keydown handler for Escape & Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredProducts = searchTerm.trim()
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 8)
    : products.filter(p => p.isFeatured || p.isBestSeller).slice(0, 6);

  const handleProductClick = (product: Product) => {
    playClickSound();
    onSelectProduct(product);
    onClose();
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    playCartSound();
    addToCart(product, 1);
    success('เพิ่มลงตะกร้าแล้ว', `${product.name} ถูกเพิ่มในตะกร้าเรียบร้อย`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn max-w-[100vw] overflow-x-hidden [overscroll-behavior-x:none] [touch-action:pan-y_pinch-zoom]">
      <div 
        className="w-full max-w-2xl bg-[#0D0D16] border border-purple-500/30 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col [overscroll-behavior-x:none]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Search Input Box */}
        <div className="relative flex items-center px-4 py-3.5 sm:py-4 border-b border-white/10 bg-[#121220]">
          <Search className="w-5 h-5 text-purple-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="ค้นหาผลปีศาจ, Gamepass, บริการ หรือคำสั่งด่วน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 text-zinc-400 hover:text-white mr-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
            ESC เพื่อปิด
          </span>
        </div>

        {/* Quick Short-cuts Strip */}
        <div className="px-4 py-2 bg-[#090910] border-b border-white/5 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-zinc-500 shrink-0 font-medium">ทางลัด:</span>
          
          <button
            onClick={() => {
              playClickSound();
              onClose();
              onNavigate('wallet');
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shrink-0 cursor-pointer"
          >
            <Wallet className="w-3 h-3" />
            <span>เติมเงิน PromptPay</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              onClose();
              if (onOpenCalculator) onOpenCalculator();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 shrink-0 cursor-pointer"
          >
            <Calculator className="w-3 h-3" />
            <span>เครื่องคำนวณ Trade Value</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              onClose();
              onNavigate('inventory');
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 shrink-0 cursor-pointer"
          >
            <Package className="w-3 h-3" />
            <span>คลังสินค้าของฉัน</span>
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 sm:p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-2 mb-1">
            <span>{searchTerm.trim() ? `ผลการค้นหา (${filteredProducts.length})` : 'สินค้ายอดนิยม & แนะนำ'}</span>
            <span className="text-[11px] text-purple-400">AngusShop Catalog</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">ไม่พบสินค้าที่ตรงกับ "{searchTerm}"</p>
              <button
                onClick={() => {
                  onClose();
                  onNavigate('shop');
                }}
                className="mt-3 text-xs text-purple-400 font-bold hover:underline"
              >
                ดูสินค้าทั้งหมดในร้านค้า
              </button>
            </div>
          ) : (
            filteredProducts.map((prod) => (
              <div
                key={prod.productId}
                onClick={() => handleProductClick(prod)}
                className="p-2.5 rounded-xl bg-[#141422] hover:bg-purple-900/30 border border-white/5 hover:border-purple-500/40 flex items-center justify-between gap-3 cursor-pointer group transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-[#0A0A12] p-1 shrink-0 flex items-center justify-center">
                    <BloxImage
                      src={prod.image}
                      alt={prod.name}
                      productName={prod.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-purple-300 truncate">
                        {prod.name}
                      </span>
                      {prod.isBestSeller && (
                        <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          ขายดี
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                      <span className="text-purple-300 font-extrabold">฿{(prod.price || 0).toLocaleString()}</span>
                      <span>•</span>
                      <span>{prod.category}</span>
                      <span>•</span>
                      <span className={prod.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {prod.stock > 0 ? `สต็อก: ${prod.stock}` : 'สินค้าหมด'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {prod.stock > 0 && (
                    <button
                      onClick={(e) => handleQuickAdd(e, prod)}
                      className="p-2 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white transition-colors cursor-pointer"
                      title="ใส่ตะกร้าทันที"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#0A0A12] border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
          <span>กด <strong>Enter</strong> เพื่อเลือก หรือพิมพ์ชื่อผลปีศาจ</span>
          <button
            onClick={() => {
              onClose();
              onNavigate('shop');
            }}
            className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>เปิดหน้าร้าน</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
