import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ArrowRight, 
  Package, 
  User, 
  Wallet, 
  ChevronRight,
  RefreshCw,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BloxImage } from '../components/BloxImage';
import { DigitalReceiptModal } from '../components/DigitalReceiptModal';
import type { Order } from '../types';

interface OrdersViewProps {
  onNavigate: (view: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onNavigate }) => {
  const { user, loginWithGoogle } = useAuth();
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const cached = sessionStorage.getItem(`user_orders_${user?.uid}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(!orders.length);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(25);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchOrders = async (force = false) => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const cacheKey = `user_orders_${user.uid}`;
    const cacheTimeKey = `user_orders_time_${user.uid}`;
    const now = Date.now();
    const lastTime = Number(sessionStorage.getItem(cacheTimeKey) || 0);

    if (!force && now - lastTime < 3 * 60 * 1000) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          setOrders(JSON.parse(cached));
          setLoading(false);
          return;
        }
      } catch {}
    }

    if (force) setIsRefreshing(true);
    else if (!orders.length) setLoading(true);

    try {
      const q = query(
        collection(db, 'orders'),
        where('uid', '==', user.uid),
        limit(displayLimit)
      );
      const snapshot = await getDocs(q);
      const list: Order[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as Order) });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(list);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(list));
        sessionStorage.setItem(cacheTimeKey, String(now));
      } catch {}
    } catch (err) {
      console.warn('Orders fetch error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleUpdate = () => {
      fetchOrders(true);
    };
    window.addEventListener('ordersUpdated', handleUpdate);

    return () => {
      window.removeEventListener('ordersUpdated', handleUpdate);
    };
  }, [user, displayLimit]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 sm:py-24 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-[#A855F7] mx-auto mb-4">
          <ClipboardList className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">เข้าสู่ระบบเพื่อดูประวัติคำสั่งซื้อ</h2>
        <p className="text-xs text-zinc-400 mt-2">
          ติดตามสถานะคำสั่งซื้อ Blox Fruits และประวัติการชำระเงินของคุณ
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
    <div className="w-full max-w-6xl 2xl:max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 pb-24 sm:pb-8 overflow-x-hidden [overscroll-behavior-x:none] [touch-action:pan-y_pinch-zoom]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">ประวัติคำสั่งซื้อ</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 sm:mt-1">
            รายการคำสั่งซื้อทั้งหมดและการจัดส่งผลปีศาจของคุณ
          </p>
        </div>
        <button
          onClick={() => fetchOrders(true)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 bg-[#141420] hover:bg-[#1c1c2e] border border-[#212133] text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          title="รีเฟรชประวัติคำสั่งซื้อ"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'กำลังโหลด...' : 'รีเฟรช'}</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-zinc-500">กำลังโหลดคำสั่งซื้อ...</div>
      ) : orders.length === 0 ? (
        <div className="py-16 sm:py-20 text-center rounded-3xl bg-[#11111A] border border-[#212133] p-6 sm:p-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#161624] flex items-center justify-center text-zinc-500 mx-auto mb-4">
            <ClipboardList className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white">ยังไม่มีประวัติคำสั่งซื้อ</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            ท่านยังไม่ได้สั่งซื้อสินค้ากับ AngusShop เลือกดูสินค้าในร้านและสั่งซื้อได้ทันที
          </p>
          <button
            onClick={() => onNavigate('shop')}
            className="mt-5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-xs font-bold shadow hover:brightness-110 cursor-pointer"
          >
            ไปที่ร้านค้า
          </button>
        </div>
      ) : (
        <div className="space-y-3.5 sm:space-y-4">
          {orders.map((order) => (
            <div
              key={order.id || order.orderId}
              className="p-4 sm:p-6 rounded-3xl bg-[#11111A] border border-[#212133] hover:border-purple-500/40 transition-all space-y-3.5 sm:space-y-4 shadow-lg"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#1E1E2E]">
                <div className="min-w-0">
                  <div className="font-mono text-xs font-bold text-purple-300 truncate">
                    #{order.orderId}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-zinc-400">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString('th-TH', { hour12: false }) : '-'}
                  </div>
                </div>

                <div className="shrink-0">
                  {(() => {
                    const status = order.orderStatus || order.status || 'completed';
                    return (
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 ${
                          status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : status === 'cancelled'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {status === 'cancelled' && <XCircle className="w-3.5 h-3.5" />}
                        {(status === 'paid' || status === 'processing') && <Clock className="w-3.5 h-3.5" />}
                        <span>
                          {status === 'completed'
                            ? 'จัดส่งสำเร็จ'
                            : status === 'paid'
                            ? 'ชำระแล้ว'
                            : status === 'processing'
                            ? 'กำลังจัดส่ง'
                            : status === 'cancelled'
                            ? 'ยกเลิก'
                            : status}
                        </span>
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Items List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="p-2.5 sm:p-3 rounded-2xl bg-[#0C0C14] border border-[#1E1E2E] flex items-center gap-2.5 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#08080E] border border-[#252538] shrink-0 p-1 flex items-center justify-center overflow-hidden">
                      <BloxImage
                        src={item.image}
                        alt={item.name}
                        productName={item.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-white truncate">{item.name}</h5>
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 sm:mt-1">
                        <span>
                          {item.name.includes('เงินม่วง') || item.name.includes('Fragment')
                            ? `${(Number(item.quantity || 1) * 10).toLocaleString()}k ม่วง (${item.quantity || 1} ชุด)`
                            : item.name.includes('เงินเขียว') || item.name.includes('Beli')
                            ? `${item.quantity || 1}M`
                            : item.name.includes('เลเวล') || item.name.includes('Level')
                            ? `${(Number(item.quantity || 1) * 100).toLocaleString()} Lv (${item.quantity || 1} ชุด)`
                            : item.name.includes('มาสเตอร์') || item.name.includes('มาส') || item.name.includes('Mastery')
                            ? `${(Number(item.quantity || 1) * 100).toLocaleString()} มาส (${item.quantity || 1} ชุด)`
                            : `x${item.quantity || 1}`}
                        </span>
                        <span className="text-purple-300 font-semibold">฿{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Meta & Total */}
              <div className="pt-3 border-t border-[#1E1E2E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 text-zinc-400 text-[11px] sm:text-xs">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>Roblox: <strong className="text-white font-medium">{order.robloxUsername || '-'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1A1A28]">
                  <div className="text-left sm:text-right">
                    <span className="text-zinc-500 text-[10px] block">ยอดชำระสุทธิ</span>
                    <span className="text-sm sm:text-base font-black text-white">฿{((order.total ?? order.totalAmount) || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setReceiptOrder(order);
                        setIsReceiptOpen(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-[#140D26] hover:bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                      title="ดูและพิมพ์ใบเสร็จรับเงิน"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ใบเสร็จ</span>
                    </button>

                    <button
                      onClick={() => onNavigate('inventory')}
                      className="px-3 sm:px-4 py-2 rounded-xl bg-[#1C1C2C] hover:bg-purple-600/30 border border-[#2B2B40] text-purple-300 hover:text-white font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>ดูในคลัง</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {orders.length >= displayLimit && (
            <div className="pt-4 text-center">
              <button
                onClick={() => setDisplayLimit((prev) => prev + 50)}
                className="px-6 py-2.5 rounded-xl bg-[#1C1C2C] hover:bg-purple-600/30 border border-[#2B2B40] text-purple-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                โหลดประวัติคำสั่งซื้อเพิ่มเติม (+50 รายการ)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={receiptOrder}
      />
    </div>
  );
};
