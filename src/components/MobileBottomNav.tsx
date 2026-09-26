import React from 'react';
import { 
  Flame, 
  ShoppingBag, 
  Wallet, 
  Package, 
  User, 
  ShieldCheck,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentView, onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const { totalItemsCount, setIsCartOpen } = useCart();

  const navItems = [
    { id: 'home', label: 'หน้าแรก', icon: Flame },
    { id: 'shop', label: 'ร้านค้า', icon: ShoppingBag },
    { id: 'wallet', label: 'เติมเงิน', icon: Wallet, badge: user ? `฿${(user.balance || 0).toLocaleString()}` : undefined },
    { id: 'inventory', label: 'คลังสินค้า', icon: Package },
    isAdmin 
      ? { id: 'admin', label: 'แอดมิน', icon: ShieldCheck, isAdminBadge: true }
      : { id: 'account', label: 'บัญชี', icon: User }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#090910]/95 backdrop-blur-2xl border-t border-[#1F1F30] pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.6)] w-full max-w-[100vw] overflow-x-hidden [overscroll-behavior-x:none] [touch-action:pan-y_pinch-zoom]">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center px-1 py-1 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {/* Active Glow Pill */}
              {isActive && (
                <div className="absolute -top-1 w-8 h-1 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] shadow-lg shadow-purple-500/80" />
              )}

              <div className="relative">
                <div className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-[#7C3AED]/20 text-[#A855F7]' : 'text-zinc-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Optional mini badge */}
                {item.id === 'wallet' && user && user.balance > 0 && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#090910]" />
                )}
                {item.id === 'admin' && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-purple-400 ring-2 ring-[#090910]" />
                )}
              </div>

              <span className={`text-[10px] tracking-tight mt-0.5 font-medium transition-colors ${
                isActive ? 'text-purple-300 font-bold' : 'text-zinc-400'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
