import React, { useState, useEffect } from 'react';
import { 
  User, 
  Wallet, 
  Package, 
  ClipboardList, 
  ShieldCheck, 
  LogOut, 
  ExternalLink,
  Plus,
  Clock,
  Mail,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AccountViewProps {
  onNavigate: (view: string) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({ onNavigate }) => {
  const { user, loginWithGoogle, logoutUser, isAdmin } = useAuth();
  const [stats, setStats] = useState(() => {
    try {
      const cached = sessionStorage.getItem(`user_stats_${user?.uid}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return { totalOrders: 0, totalInventory: 0, totalDeposited: 0 };
  });

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const fetchStats = async (force = false) => {
      const cacheKey = `user_stats_${user.uid}`;
      const cacheTimeKey = `user_stats_time_${user.uid}`;
      const now = Date.now();
      const lastTime = Number(sessionStorage.getItem(cacheTimeKey) || 0);

      if (!force && now - lastTime < 10 * 60 * 1000) {
        try {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            setStats(JSON.parse(cached));
            return;
          }
        } catch {}
      }

      try {
        const [ordersSnap, invSnap, depSnap] = await Promise.all([
          getDocs(query(collection(db, 'orders'), where('uid', '==', user.uid), limit(15))),
          getDocs(query(collection(db, 'inventory'), where('uid', '==', user.uid), limit(15))),
          getDocs(query(collection(db, 'deposits'), where('uid', '==', user.uid), where('status', '==', 'completed'), limit(15)))
        ]);

        let deposited = 0;
        depSnap.forEach((d) => {
          deposited += (d.data().amount || 0);
        });

        const newStats = {
          totalOrders: ordersSnap.size,
          totalInventory: invSnap.size,
          totalDeposited: deposited,
        };

        if (isMounted) {
          setStats(newStats);
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(newStats));
            sessionStorage.setItem(cacheTimeKey, String(now));
          } catch {}
        }
      } catch (err) {
        console.warn('Stats fetch notice:', err);
      }
    };

    fetchStats();

    const handleUpdate = () => {
      fetchStats(true);
    };
    window.addEventListener('accountStatsUpdated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('accountStatsUpdated', handleUpdate);
    };
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 sm:py-24 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-[#A855F7] mx-auto mb-4">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">เข้าสู่ระบบเพื่อดูข้อมูลบัญชี</h2>
        <p className="text-xs text-zinc-400 mt-2">
          จัดการกระเป๋าเงิน ติดตามคำสั่งซื้อ และดูไอเทมทั้งหมดของคุณ
        </p>
        <button
          onClick={loginWithGoogle}
          className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-bold text-xs shadow-lg shadow-purple-500/25 hover:brightness-110 cursor-pointer"
        >
          เข้าสู่ระบบด้วย Google
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8 pb-24 sm:pb-8 overflow-x-hidden [overscroll-behavior-x:none] [touch-action:pan-y_pinch-zoom]">
      {/* Profile Card */}
      <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-br from-[#181228] via-[#11111A] to-[#0A0A10] border border-purple-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative z-10">
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-purple-500/40 shadow-xl"
          />
          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{user.displayName}</h1>
              {isAdmin ? (
                <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[11px] sm:text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> แอดมิน (Admin)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[11px] sm:text-xs font-medium">
                  สมาชิกทั่วไป (Member)
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-400 mt-1 flex items-center justify-center sm:justify-start gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">{user.email}</span>
            </p>
            <p className="text-[10px] sm:text-[11px] font-mono text-zinc-500 mt-0.5 truncate">
              UID: {user.uid}
            </p>
          </div>

          <button
            onClick={logoutUser}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* Balance & Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
        <div className="p-4 sm:p-6 rounded-3xl bg-[#11111A] border border-[#212133] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">ยอดเงินใน Wallet</span>
              <Wallet className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2 sm:mt-3">
              ฿{(user.balance || 0).toLocaleString()}
            </div>
          </div>
          <button
            onClick={() => onNavigate('wallet')}
            className="mt-4 sm:mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-xs font-bold shadow flex items-center justify-center gap-1.5 hover:brightness-110 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เติมเงิน PromptPay</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 rounded-3xl bg-[#11111A] border border-[#212133] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">สินค้าในคลัง (Inventory)</span>
              <Package className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2 sm:mt-3">
              {stats.totalInventory} ชิ้น
            </div>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="mt-4 sm:mt-5 w-full py-2.5 rounded-xl bg-[#1C1C2C] hover:bg-[#242438] border border-[#2D2D42] text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          >
            <span>ดูคลังสินค้า</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 rounded-3xl bg-[#11111A] border border-[#212133] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">คำสั่งซื้อทั้งหมด</span>
              <ClipboardList className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-2 sm:mt-3">
              {stats.totalOrders} รายการ
            </div>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="mt-4 sm:mt-5 w-full py-2.5 rounded-xl bg-[#1C1C2C] hover:bg-[#242438] border border-[#2D2D42] text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          >
            <span>ดูประวัติคำสั่งซื้อ</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Admin Panel Quick Link */}
      {isAdmin && (
        <div className="p-4 sm:p-6 rounded-3xl bg-[#1F1735] border border-purple-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">แผงควบคุมระบบแอดมิน (Admin Dashboard)</h4>
              <p className="text-[11px] sm:text-xs text-purple-300/80">จัดการสินค้า สลิปเติมเงิน คำสั่งซื้อ และคลังสินค้า</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('admin')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer text-center active:scale-95"
          >
            เปิดหน้าแอดมิน
          </button>
        </div>
      )}
    </div>
  );
};
