import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { BloxImage } from './BloxImage';

interface CartDrawerProps {
  onNavigate: (view: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    subtotal, 
    total, 
    isCartOpen, 
    setIsCartOpen 
  } = useCart();
  const { user, loginWithGoogle } = useAuth();

  if (!isCartOpen) return null;

  const handleProceedCheckout = () => {
    setIsCartOpen(false);
    onNavigate('checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-[#0D0D15] border-l border-[#1E1E2E] shadow-2xl flex flex-col h-full">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#1E1E2E] flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-500/15 flex items-center justify-center text-[#A855F7]">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">ตะกร้าสินค้า</h3>
                <p className="text-[11px] sm:text-xs text-zinc-400">{items.length} รายการที่เลือก</p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1A1A28] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body / Items list */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 sm:space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#141420] flex items-center justify-center text-zinc-600 mb-3 sm:mb-4">
                  <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-300">ตะกร้าของคุณยังว่างอยู่</h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                  เลือกผลปีศาจหรือ Gamepass ที่คุณต้องการ แล้วกดเพิ่มลงในตะกร้าได้เลย
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onNavigate('shop');
                  }}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-xs font-semibold shadow-lg shadow-purple-500/25 hover:brightness-110 transition-all cursor-pointer"
                >
                  เลือกดูสินค้า
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div 
                  key={item.productId}
                  className="flex gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-[#13131F] border border-[#212133] relative group"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#0B0B14] border border-[#2A2A3E] shrink-0 p-1 flex items-center justify-center overflow-hidden">
                    <BloxImage
                      src={item.image}
                      alt={item.name}
                      productName={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-white truncate">{item.name}</h5>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-black text-purple-400">
                        ฿{((item.price || 0) * item.quantity).toLocaleString()}
                      </span>
                      {item.name.includes('เงินม่วง') || item.name.includes('Fragment') ? (
                        <span className="text-[10px] text-purple-400 font-bold">({item.quantity * 10}k ม่วง)</span>
                      ) : item.name.includes('เงินเขียว') || item.name.includes('Beli') ? (
                        <span className="text-[10px] text-emerald-400 font-bold">({item.quantity}M)</span>
                      ) : item.name.includes('เลเวล') || item.name.includes('Level') ? (
                        <span className="text-[10px] text-cyan-400 font-bold">({item.quantity * 100} เลเวล)</span>
                      ) : item.name.includes('มาสเตอร์') || item.name.includes('มาส') || item.name.includes('Mastery') ? (
                        <span className="text-[10px] text-amber-400 font-bold">({item.quantity * 100} มาส)</span>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controller */}
                      <div className="flex items-center gap-1 bg-[#0A0A10] border border-[#262638] rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#1C1C2C] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white px-2">{item.quantity}</span>
                        {(() => {
                          const isMastery = item.productId === 'prod_farm_mastery_100' || item.name.includes('มาสเตอร์') || item.name.includes('มาส') || item.name.includes('Mastery');
                          const itemMax = isMastery ? Math.min(item.stock, 6) : item.stock;
                          return (
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= itemMax}
                              className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#1C1C2C] disabled:opacity-30 cursor-pointer"
                              title={item.quantity >= itemMax && isMastery ? 'ตันสูงสุดที่ 600 มาส (6 ชุด)' : undefined}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          );
                        })()}
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-zinc-500 hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
                        title="ลบออกจากตะกร้า"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer calculation */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#1E1E2E] bg-[#0E0E18] space-y-3 pb-safe">
              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>ยอดรวมสินค้า</span>
                  <span>฿{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white pt-1">
                  <span>ยอดสุทธิ</span>
                  <span className="text-purple-400 font-black">฿{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Button */}
              {!user ? (
                <button
                  onClick={loginWithGoogle}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-xs font-bold shadow-lg shadow-purple-500/25 hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer"
                >
                  เข้าสู่ระบบเพื่อสั่งซื้อ
                </button>
              ) : (
                <button
                  onClick={handleProceedCheckout}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] text-white text-xs font-bold shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <span>ไปที่หน้าชำระเงิน</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
