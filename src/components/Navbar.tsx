import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  ShoppingBag, 
  Wallet, 
  Package, 
  ClipboardList, 
  ShieldCheck, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Search, 
  Plus,
  ChevronDown,
  Sparkles,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  RefreshCw,
  CheckCheck,
  Calculator,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useHomeConfig } from '../context/HomeConfigContext';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db, isQuotaExceededError } from '../lib/firebase';
import type { Notification } from '../types';
import { DEFAULT_HOME_CONFIG } from '../data/bloxPresets';
import { isSoundMuted, toggleSoundMute, playClickSound } from '../lib/sound';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onSearch?: (term: string) => void;
  onOpenQuickSearch?: () => void;
  onOpenCalculator?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentView, 
  onNavigate, 
  onSearch,
  onOpenQuickSearch,
  onOpenCalculator
}) => {
  const { user, loginWithGoogle, logoutUser, isAdmin, openAuthModal } = useAuth();
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { homeConfig } = useHomeConfig();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(isSoundMuted());
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem('angus_cached_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const lastNotifsFetchRef = useRef<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Restore cached notifications locally on user change (0 Firestore reads)
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const saved = localStorage.getItem(`angus_cached_notifications_${user.uid}`);
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } catch {}
  }, [user]);

  // Listen for in-app updates to invalidate cooldown
  useEffect(() => {
    const handleUpdate = () => {
      lastNotifsFetchRef.current = 0;
      if (notifDropdownOpen && user) {
        fetchNotificationsOnDemand(true);
      }
    };
    window.addEventListener('notificationUpdate', handleUpdate);
    return () => window.removeEventListener('notificationUpdate', handleUpdate);
  }, [notifDropdownOpen, user]);

  // On-Demand loader: Strictly queries Firestore only when user clicks the notification bell
  // Enforces a 2-minute request throttle / cooldown to prevent quota consumption
  const fetchNotificationsOnDemand = async (force = false) => {
    if (!user) return;
    const now = Date.now();
    // 2-minute cooldown between requests unless manually forced
    if (!force && now - lastNotifsFetchRef.current < 120000 && notifications.length > 0) {
      return;
    }

    setIsLoadingNotifs(true);
    setNotifError(null);
    try {
      const q = query(
        collection(db, 'notifications'),
        where('uid', '==', user.uid),
        limit(8)
      );
      const snapshot = await getDocs(q);
      const items: Notification[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Notification) });
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(items);
      lastNotifsFetchRef.current = Date.now();
      try {
        localStorage.setItem(`angus_cached_notifications_${user.uid}`, JSON.stringify(items));
        localStorage.setItem('angus_cached_notifications', JSON.stringify(items));
      } catch {}
    } catch (err: any) {
      if (isQuotaExceededError(err)) {
        setNotifError('โควต้า Firestore เต็มชั่วคราว (แสดงข้อมูลจากแคช)');
      } else {
        console.warn('Notifications fetch notice:', err);
      }
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  const handleToggleNotifDropdown = () => {
    const nextState = !notifDropdownOpen;
    setNotifDropdownOpen(nextState);
    if (nextState) {
      // Trigger On-Demand fetch only when user clicks to open
      fetchNotificationsOnDemand();
    }
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    if (user) {
      try {
        localStorage.setItem(`angus_cached_notifications_${user.uid}`, JSON.stringify(updated));
        localStorage.setItem('angus_cached_notifications', JSON.stringify(updated));
      } catch {}
    }
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
    onNavigate('shop', searchQuery);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'home', label: 'หน้าแรก', desc: 'รายการแนะนำและไฮไลท์', icon: Flame },
    { id: 'shop', label: 'ร้านค้า', desc: 'สินค้า ผลปีศาจ ไอดีเกม', icon: ShoppingBag },
    { id: 'inventory', label: 'คลังสินค้า', desc: 'ของที่ได้รับและส่งมอบ', icon: Package },
    { id: 'orders', label: 'ประวัติสั่งซื้อ', desc: 'ตรวจสอบสถานะคำสั่งซื้อ', icon: ClipboardList },
    { id: 'wallet', label: 'เติมเงิน', desc: 'เติมพอยท์ผ่าน TrueMoney / QR', icon: Wallet },
  ];

  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-[#07050F]/95 backdrop-blur-3xl border-b border-[rgba(168,85,247,0.30)] shadow-[0_10px_40px_rgba(7,5,15,0.9),0_0_30px_rgba(109,40,217,0.25)]'
          : 'bg-[#07050F]/80 backdrop-blur-xl border-b border-[rgba(168,85,247,0.18)] shadow-[0_4px_30px_rgba(7,5,15,0.6)]'
      }`}>
        <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-[70px] gap-2 sm:gap-4">
            
            {/* Left Group: Logo + Desktop Navigation Links */}
            <div className="flex items-center gap-2.5 sm:gap-4 xl:gap-6 shrink-0">
              {/* Logo */}
              <div 
                id="navbar-logo-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('home');
                }} 
                className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
              >
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#6D28D9] via-[#8B5CF6] to-[#C084FC] p-0.5 shadow-lg shadow-purple-500/30 group-hover:shadow-[0_0_25px_rgba(192,132,252,0.6)] transition-all duration-300 shrink-0">
                  <img 
                    src={homeConfig.siteLogo || DEFAULT_HOME_CONFIG.siteLogo}
                    alt="AngusShop Blox Fruits"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://tr.rbxcdn.com/180DAY-774ec14539b264f85fdb6e8a34dfa344/512/512/Image/Png/noFilter';
                    }}
                    className="w-full h-full object-cover rounded-[10px] group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 rounded-full bg-emerald-500 border-2 border-[#07050F] shadow-sm animate-pulse" title="ระบบเปิดให้บริการตลอด 24 ชม." />
                </div>
                <div className="leading-tight shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="font-black text-sm sm:text-xl tracking-wider text-white">ANGUS</span>
                    <span className="font-black text-sm sm:text-xl tracking-wider bg-gradient-to-r from-[#A855F7] via-[#C084FC] to-[#8B5CF6] bg-clip-text text-transparent">SHOP</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] sm:text-[9px] text-[#C084FC] font-bold uppercase tracking-wider">ROBLOX</span>
                    <span className="text-[8px] text-zinc-500">•</span>
                    <p className="text-[8px] sm:text-[9px] text-[#B8AEC9] tracking-wider font-semibold">
                      Blox Fruits Store
                    </p>
                  </div>
                </div>
              </div>

              {/* Desktop Navigation Links */}
              <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`relative whitespace-nowrap shrink-0 flex items-center gap-1.5 px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-[13px] font-bold transition-all duration-200 cursor-pointer ${
                        isActive 
                          ? 'text-white bg-[#6D28D9]/30 border border-[#A855F7]/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                          : 'text-[#B8AEC9] hover:text-white hover:bg-[rgba(139,92,246,0.12)] hover:border hover:border-[#A855F7]/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.20)] border border-transparent'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0 transition-colors ${isActive ? 'text-[#C084FC] drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]' : 'text-zinc-400 group-hover:text-purple-300'}`} />
                      <span className="whitespace-nowrap">{item.label}</span>
                      {isActive && (
                        <span className="absolute -bottom-1 left-2.5 right-2.5 h-[2px] bg-gradient-to-r from-[#A855F7] via-[#C084FC] to-[#8B5CF6] rounded-full shadow-[0_0_10px_#C084FC]" />
                      )}
                    </button>
                  );
                })}
                {isAdmin && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className={`relative whitespace-nowrap shrink-0 flex items-center gap-1.5 px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-[13px] font-bold transition-all duration-200 cursor-pointer ${
                      currentView === 'admin'
                        ? 'text-[#C084FC] bg-purple-600/35 border border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                        : 'text-purple-400 hover:text-purple-200 hover:bg-purple-950/40 hover:border hover:border-purple-500/30 border border-transparent'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-[#C084FC] shrink-0" />
                    <span className="whitespace-nowrap">แอดมิน</span>
                    {currentView === 'admin' && (
                      <span className="absolute -bottom-1 left-2.5 right-2.5 h-[2px] bg-gradient-to-r from-[#A855F7] to-[#C084FC] rounded-full shadow-[0_0_8px_#C084FC]" />
                    )}
                  </button>
                )}
              </nav>
            </div>

            {/* Right Action Icons & Tools */}
            <div className="flex items-center gap-1 sm:gap-2 xl:gap-2.5 shrink-0">

              {/* Quick Search Button: Compact Icon on laptops, expand on 2xl */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  if (onOpenQuickSearch) onOpenQuickSearch();
                }}
                className="hidden md:flex 2xl:hidden w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#0F0A1A]/80 hover:bg-[rgba(139,92,246,0.15)] border border-[rgba(168,85,247,0.20)] hover:border-[rgba(192,132,252,0.45)] text-zinc-300 hover:text-white items-center justify-center transition-all cursor-pointer shrink-0 hover:shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                title="ค้นหาผลปีศาจและไอเทม (Ctrl+K)"
              >
                <Search className="w-4 h-4 text-[#C084FC]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  if (onOpenQuickSearch) onOpenQuickSearch();
                }}
                className="hidden 2xl:flex items-center justify-between w-48 h-10 bg-[#0F0A1A]/80 hover:bg-[rgba(139,92,246,0.15)] border border-[rgba(168,85,247,0.20)] hover:border-[rgba(192,132,252,0.45)] rounded-xl px-3 text-xs text-[#B8AEC9] transition-all cursor-pointer group shrink-0 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                title="ค้นหาด่วน (Ctrl+K)"
              >
                <div className="flex items-center gap-2 truncate">
                  <Search className="w-4 h-4 text-[#C084FC] shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate">ค้นหาผลปีศาจ...</span>
                </div>
                <span className="text-[10px] font-mono text-purple-300/70 bg-[#160B28] border border-[rgba(168,85,247,0.25)] px-1.5 py-0.5 rounded">
                  Ctrl+K
                </span>
              </button>

              {/* Trade Calculator Icon Button */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  if (onOpenCalculator) onOpenCalculator();
                }}
                className="hidden lg:flex w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#0F0A1A]/80 hover:bg-[rgba(139,92,246,0.15)] border border-[rgba(168,85,247,0.20)] hover:border-[rgba(192,132,252,0.45)] text-zinc-300 hover:text-[#C084FC] items-center justify-center transition-all cursor-pointer shrink-0 hover:shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                title="เครื่องคำนวณราคาเทรด Blox Fruits (W/F/L)"
              >
                <Calculator className="w-4 h-4 text-[#C084FC]" />
              </button>

              {/* Sound Mute Toggle */}
              <button
                type="button"
                onClick={() => {
                  const muted = toggleSoundMute();
                  setSoundMuted(muted);
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#0F0A1A]/80 hover:bg-[rgba(139,92,246,0.15)] border border-[rgba(168,85,247,0.20)] hover:border-[rgba(192,132,252,0.45)] text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer hidden sm:flex shrink-0"
                title={soundMuted ? 'เปิดเสียงเอฟเฟกต์' : 'ปิดเสียงเอฟเฟกต์'}
              >
                {soundMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-[#C084FC]" />}
              </button>
              
              {/* Wallet Balance Pill (Shown if logged in) */}
              {user && (
                <button
                  onClick={() => onNavigate('wallet')}
                  className="h-7 sm:h-10 flex items-center gap-1 sm:gap-2 bg-[#0F0A1A]/80 hover:bg-[rgba(139,92,246,0.15)] border border-[rgba(168,85,247,0.25)] hover:border-[#C084FC]/60 rounded-lg sm:rounded-xl px-1.5 sm:px-3 transition-all group cursor-pointer shrink-0 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                  title="คลิกเพื่อเติมเงิน Wallet"
                >
                  <div className="w-4 h-4 sm:w-6 sm:h-6 rounded sm:rounded-lg bg-gradient-to-br from-[#6D28D9]/40 to-[#A855F7]/30 border border-purple-500/30 flex items-center justify-center text-[#C084FC] shrink-0">
                    <Wallet className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <div className="text-left leading-none">
                    <div className="text-[9px] text-[#B8AEC9] font-medium hidden sm:block">ยอดเงิน</div>
                    <div className="text-[10px] xs:text-[11px] sm:text-xs font-black text-emerald-400 group-hover:text-emerald-300 transition-colors max-w-[60px] xs:max-w-none truncate">
                      ฿{(user.balance || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded sm:rounded-lg bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] hover:from-[#7C3AED] hover:to-[#A855F7] flex items-center justify-center text-white shrink-0 ml-0.5 shadow-sm shadow-purple-600/50">
                    <Plus className="w-2 h-2 sm:w-3 sm:h-3" />
                  </div>
                </button>
              )}

              {/* Notification Bell (On-Demand) */}
              {user && (
                <div ref={notifMenuRef} className="relative flex shrink-0">
                  <button
                    onClick={handleToggleNotifDropdown}
                    className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#0F0A1A]/80 hover:bg-[rgba(139,92,246,0.15)] border border-[rgba(168,85,247,0.20)] hover:border-[rgba(192,132,252,0.45)] text-zinc-300 hover:text-white flex items-center justify-center relative transition-all cursor-pointer shrink-0 hover:shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                    title="การแจ้งเตือน (คลิกเพื่อโหลด On-Demand)"
                  >
                    <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300" />
                    {unreadNotifs > 0 && (
                      <span className="absolute -top-1 -right-1 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-rose-500 text-white text-[7px] sm:text-[9px] font-bold flex items-center justify-center animate-pulse shadow-sm shadow-rose-500/80">
                        {unreadNotifs}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notifDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#0F0A1A]/95 backdrop-blur-2xl border border-[rgba(168,85,247,0.25)] rounded-2xl shadow-[0_12px_45px_rgba(7,5,15,0.8),0_0_25px_rgba(168,85,247,0.15)] p-4 z-[999] pointer-events-auto">
                      <div className="flex items-center justify-between pb-3 border-b border-purple-500/15 mb-3">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-semibold text-white">การแจ้งเตือน</h4>
                          {unreadNotifs > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                              {unreadNotifs} ใหม่
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {unreadNotifs > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-[11px] text-[#C084FC] hover:text-white transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-purple-950/40 cursor-pointer"
                              title="ทำเครื่องหมายว่าอ่านแล้วทั้งหมด"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>อ่านหมด</span>
                            </button>
                          )}
                          <button
                            onClick={() => fetchNotificationsOnDemand(true)}
                            disabled={isLoadingNotifs}
                            className="p-1 rounded-lg hover:bg-[#1E1433] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="รีเฟรชการแจ้งเตือนสด (On-Demand)"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNotifs ? 'animate-spin text-[#C084FC]' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {notifError && (
                        <div className="mb-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 leading-tight">
                          {notifError}
                        </div>
                      )}

                      {isLoadingNotifs && notifications.length === 0 ? (
                        <div className="text-center py-6 text-zinc-400 text-xs flex flex-col items-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-[#C084FC]" />
                          <span>กำลังดึงข้อมูลการแจ้งเตือน...</span>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="text-center py-6 text-zinc-500 text-xs">
                          ยังไม่มีการแจ้งเตือนใหม่
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                          {notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              className={`p-2.5 rounded-xl text-xs border transition-colors ${
                                notif.isRead ? 'bg-[#0A0714] border-purple-500/10 text-zinc-400' : 'bg-[#180E2B] border-purple-500/35 text-zinc-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <p className="font-bold text-white text-xs">{notif.title}</p>
                                {!notif.isRead && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC] shrink-0 mt-1 shadow-sm shadow-purple-500/80" />
                                )}
                              </div>
                              <p className="mt-0.5 text-[11px] leading-relaxed">{notif.message}</p>
                              <span className="text-[10px] text-zinc-500 mt-1 block">
                                {new Date(notif.createdAt).toLocaleDateString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-2.5 pt-2 border-t border-purple-500/15 flex items-center justify-between text-[10px] text-[#B8AEC9]">
                        <span>โหลดแบบ On-Demand</span>
                        <span>{notifications.length} รายการ</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#0F0A1A]/80 hover:bg-[rgba(139,92,246,0.15)] border border-[rgba(168,85,247,0.20)] hover:border-[rgba(192,132,252,0.45)] text-zinc-300 hover:text-white flex items-center justify-center relative transition-all cursor-pointer shrink-0 hover:shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                title="ตะกร้าสินค้า"
              >
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-purple-300" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 min-w-3.5 h-3.5 sm:min-w-5 sm:h-5 px-0.5 sm:px-1 rounded-full bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#A855F7] text-white text-[7px] sm:text-[10px] font-black flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.6)] ring-1 sm:ring-2 ring-[#07050F]">
                    {totalItemsCount}
                  </span>
                )}
              </button>

              {/* Auth / Profile Dropdown (Desktop) */}
              {!user ? (
                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                  <button
                    id="nav-register-btn"
                    onClick={() => openAuthModal('register')}
                    className="h-8 sm:h-10 px-3 sm:px-4 rounded-xl border border-[rgba(168,85,247,0.25)] hover:border-[rgba(192,132,252,0.60)] bg-[rgba(15,10,26,0.75)] hover:bg-[rgba(139,92,246,0.15)] text-[#E9D5FF] hover:text-white text-xs font-bold transition-all duration-200 cursor-pointer hidden sm:flex items-center gap-1.5 shrink-0 shadow-sm hover:shadow-[0_0_20px_rgba(168,85,247,0.30)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>สมัครสมาชิก</span>
                  </button>
                  <button
                    id="nav-login-btn"
                    onClick={() => openAuthModal('login')}
                    className="h-8 sm:h-10 flex items-center gap-1.5 bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#C084FC] text-white px-3.5 sm:px-4.5 rounded-xl text-[11px] sm:text-xs font-black shadow-[0_4px_20px_rgba(139,92,246,0.4),0_0_25px_rgba(168,85,247,0.35)] hover:shadow-[0_6px_25px_rgba(168,85,247,0.55),0_0_35px_rgba(192,132,252,0.50)] transition-all duration-200 cursor-pointer shrink-0 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>เข้าสู่ระบบ</span>
                  </button>
                </div>
              ) : (
                <div ref={userMenuRef} className="relative hidden sm:block shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playClickSound();
                      setUserDropdownOpen(prev => !prev);
                    }}
                    className={`h-9 sm:h-10 flex items-center gap-2 px-2.5 rounded-xl bg-[#0F0A1A]/80 hover:bg-[rgba(139,92,246,0.15)] border transition-all cursor-pointer shrink-0 ${
                      userDropdownOpen ? 'border-[#C084FC] shadow-[0_0_20px_rgba(168,85,247,0.35)] bg-[#1A102E]' : 'border-[rgba(168,85,247,0.20)] hover:border-[rgba(192,132,252,0.45)]'
                    }`}
                  >
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-cover border border-purple-500/40"
                    />
                    <span className="text-xs font-semibold text-zinc-200 max-w-[100px] truncate hidden md:inline">
                      {user.displayName.split(' ')[0]}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180 text-[#C084FC]' : ''}`} />
                  </button>

                  {/* Profile Dropdown */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#0F0A1A]/95 backdrop-blur-2xl border border-[rgba(168,85,247,0.25)] rounded-2xl shadow-[0_12px_45px_rgba(7,5,15,0.8),0_0_25px_rgba(168,85,247,0.15)] p-2 z-[999] pointer-events-auto">
                      <div className="p-3 border-b border-purple-500/15 mb-1">
                        <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
                        <p className="text-[11px] text-[#B8AEC9] truncate">{user.email}</p>
                        
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {user.rank && (
                            <span className="inline-flex items-center text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              {user.rank}
                            </span>
                          )}
                          {isAdmin && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/40">
                              <ShieldCheck className="w-3 h-3 text-[#C084FC]" /> Admin
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('account');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-[#1A1A28] rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <User className="w-4 h-4 text-purple-400" /> บัญชีของฉัน
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('wallet');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-[#1A1A28] rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <Wallet className="w-4 h-4 text-emerald-400" /> เติมเงิน Wallet
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('inventory');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-[#1A1A28] rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <Package className="w-4 h-4 text-amber-400" /> คลังสินค้า (ไอเทม)
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('orders');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-[#1A1A28] rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <ClipboardList className="w-4 h-4 text-cyan-400" /> ประวัติคำสั่งซื้อ
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onNavigate('admin');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-purple-300 font-bold hover:text-purple-200 hover:bg-[#1F1735] rounded-xl transition-colors text-left cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-400" /> จัดการระบบ (Admin)
                        </button>
                      )}

                      <div className="border-t border-[#242436] my-1 pt-1">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logoutUser();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-400" /> ออกจากระบบ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hamburger Button (3-Bars) for Mobile - Sliding Down Drawer */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
                className={`lg:hidden w-7 h-7 sm:w-10 sm:h-10 p-1 sm:p-2.5 rounded-lg sm:rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  mobileMenuOpen 
                    ? 'bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white border-[#C084FC] shadow-[0_0_20px_rgba(168,85,247,0.5)]' 
                    : 'bg-[#0F0A1A]/80 border-[rgba(168,85,247,0.25)] text-zinc-200 hover:text-white hover:bg-[rgba(139,92,246,0.15)]'
                }`}
              >
                {mobileMenuOpen ? (
                  <X className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#C084FC]" />
                ) : (
                  <Menu className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                )}
              </button>

            </div>

          </div>
        </div>

        {/* Full Mobile Slide-Down Dropdown Menu (เมนูสามขีดเลื่อนลงมา) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="lg:hidden overflow-hidden bg-[#07050F]/98 backdrop-blur-2xl border-t border-[rgba(168,85,247,0.25)] shadow-[0_20px_50px_rgba(0,0,0,0.9)] w-full max-w-[100vw] [overscroll-behavior-x:none]"
            >
              <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar pb-16 w-full max-w-[100vw] overflow-x-hidden">
                
                {/* Search Bar in Dropdown */}
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="ค้นหาผลปีศาจ, Gamepass, ไอเทม..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0F0A1A] border border-[rgba(168,85,247,0.25)] focus:border-[#C084FC] rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none shadow-inner transition-colors"
                  />
                  <Search className="w-4 h-4 text-[#C084FC] absolute left-3.5 top-3.5 pointer-events-none" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-3 text-zinc-400 hover:text-white p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </form>

                {/* User Profile Card or Login CTA */}
                {user ? (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#170E2C] via-[#120924] to-[#0A0515] border border-[rgba(168,85,247,0.30)] shadow-lg shadow-purple-950/40">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-11 h-11 rounded-xl object-cover border-2 border-purple-500/40 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-white truncate">{user.displayName}</h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            {user.rank && (
                              <span className="text-[9px] bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-500/20 shrink-0">
                                {user.rank}
                              </span>
                            )}
                            {isAdmin && (
                              <span className="text-[9px] bg-purple-500/20 text-[#C084FC] px-1.5 py-0.5 rounded font-bold border border-purple-500/40 shrink-0">
                                แอดมิน
                              </span>
                            )}
                          </div>
                          </div>
                          <p className="text-[10px] text-[#B8AEC9] truncate">{user.email}</p>
                          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-black mt-0.5">
                            <span>฿{(user.balance || 0).toLocaleString()}</span>
                            <span className="text-[10px] text-zinc-500 font-normal">คงเหลือ</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onNavigate('wallet');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] hover:from-[#7C3AED] hover:to-[#A855F7] text-white text-[11px] font-bold shadow-md shadow-purple-600/40 shrink-0 cursor-pointer active:scale-95"
                      >
                        + เติมเงิน
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1E0E38] via-[#120824] to-[#0A0515] border border-[rgba(168,85,247,0.30)] shadow-lg shadow-purple-950/40">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-4 h-4 text-[#C084FC] animate-pulse" />
                      <h4 className="text-xs font-bold text-white">ยินดีต้อนรับสู่ AngusShop</h4>
                    </div>
                    <p className="text-[11px] text-[#B8AEC9] mb-3.5">
                      สมัครสมาชิกหรือเข้าสู่ระบบเพื่อเติมเงิน สั่งซื้อผลปีศาจ และรับของขวัญอัตโนมัติ
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        id="mobile-register-btn"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          openAuthModal('register');
                        }}
                        className="py-2.5 rounded-xl border border-[rgba(168,85,247,0.30)] bg-[rgba(139,92,246,0.10)] hover:bg-[rgba(139,92,246,0.20)] text-purple-200 text-xs font-bold text-center cursor-pointer active:scale-95 transition-all shadow-sm"
                      >
                        สมัครสมาชิก
                      </button>
                      <button
                        id="mobile-login-btn"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          openAuthModal('login');
                        }}
                        className="py-2.5 rounded-xl bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#C084FC] text-white text-xs font-black text-center shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-pointer active:scale-95 transition-all"
                      >
                        เข้าสู่ระบบ
                      </button>
                    </div>
                  </div>
                )}

                {/* Primary Navigation Items List (เลื่อนลงมาครบทุกเมนู) */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-2 py-1">
                    เมนูหลัก (Main Navigation)
                  </div>
                  
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onNavigate(item.id);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-purple-600/20 border border-purple-500/40 text-white'
                            : 'bg-[#11111A] border border-[#1F1F2F] text-zinc-300 hover:text-white hover:bg-[#181826]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-purple-600 text-white shadow-md' : 'bg-[#181826] text-purple-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold">{item.label}</div>
                            <div className="text-[10px] text-zinc-400">{item.desc}</div>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isActive ? 'text-purple-300' : 'text-zinc-600'}`} />
                      </button>
                    );
                  })}
                </div>

                {/* Secondary Actions (Account, Notifications, Admin) */}
                <div className="space-y-1 pt-2 border-t border-[#1C1C2A]">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-2 py-1">
                    บริการและบัญชีผู้ใช้
                  </div>

                  {user && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onNavigate('account');
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                        currentView === 'account'
                          ? 'bg-purple-600/20 border border-purple-500/40 text-white'
                          : 'bg-[#11111A] border border-[#1F1F2F] text-zinc-300 hover:text-white hover:bg-[#181826]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#181826] text-purple-400 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">ข้อมูลบัญชีของฉัน</div>
                          <div className="text-[10px] text-zinc-400">ดูสถิติ ยอดเงิน และจัดการโปรไฟล์</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    </button>
                  )}

                  {/* Mobile Notifications Trigger */}
                  {user && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleToggleNotifDropdown();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#11111A] border border-[#1F1F2F] text-zinc-300 hover:text-white text-left transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#181826] text-purple-400 flex items-center justify-center shrink-0">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">
                            การแจ้งเตือน {unreadNotifs > 0 ? `(${unreadNotifs} ใหม่)` : ''}
                          </div>
                          <div className="text-[10px] text-zinc-400">คลิกเพื่อดูการแจ้งเตือน (On-Demand)</div>
                        </div>
                      </div>
                      {unreadNotifs > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                          {unreadNotifs} ใหม่
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                      )}
                    </button>
                  )}

                  {/* Cart Trigger */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsCartOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#11111A] border border-[#1F1F2F] text-zinc-300 hover:text-white text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#181826] text-amber-400 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">ตะกร้าสินค้า ({totalItemsCount})</div>
                        <div className="text-[10px] text-zinc-400">ตรวจสอบและไปหน้าชำระเงิน</div>
                      </div>
                    </div>
                    {totalItemsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                        {totalItemsCount} ชิ้น
                      </span>
                    )}
                  </button>

                  {/* Blox Fruits Trade Calculator (Mobile) */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      playClickSound();
                      if (onOpenCalculator) onOpenCalculator();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#11111A] border border-[#1F1F2F] text-zinc-300 hover:text-white text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">เครื่องคำนวณ Trade Value</div>
                        <div className="text-[10px] text-zinc-400">เปรียบเทียบมูลค่าผลปีศาจ W / F / L</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                  </button>

                  {/* Admin Trigger */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onNavigate('admin');
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                        currentView === 'admin'
                          ? 'bg-purple-600/30 border border-purple-500 text-white'
                          : 'bg-[#1C142E] border border-purple-500/30 text-purple-300 hover:bg-[#251A3E]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">แผงควบคุมแอดมิน (Admin Dashboard)</div>
                          <div className="text-[10px] text-purple-300/70">จัดการสินค้า สลิปเติมเงิน และออเดอร์</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-purple-400" />
                    </button>
                  )}
                </div>

                {/* Community & Discord Quick Links */}
                <div className="p-3 rounded-2xl bg-[#0D0D14] border border-[#1D1D2C] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-[11px] text-zinc-300">ติดต่อฝ่ายบริการ / Discord</span>
                  </div>
                  <a
                    href="https://discord.gg"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                  >
                    เข้าร่วม <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Logout if logged in */}
                {user && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logoutUser();
                    }}
                    className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>ออกจากระบบ</span>
                  </button>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </header>

      {/* Backdrop overlay for mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
};
