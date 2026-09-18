import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Sparkles,
  Server,
  HelpCircle,
  Key,
  MessageSquare,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BloxImage } from '../components/BloxImage';
import type { InventoryItem } from '../types';

export const InventoryView: React.FC = () => {
  const { user, loginWithGoogle } = useAuth();
  const { success, error: toastError } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'claimed'>('all');

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'inventory'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: InventoryItem[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as InventoryItem) });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(list);
      setLoading(false);
    }, (err) => {
      console.warn('Inventory fetch notice:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    success('คัดลอกรหัสเคลมแล้ว', code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkClaimed = async (item: InventoryItem) => {
    try {
      const itemRef = doc(db, 'inventory', item.id || item.inventoryId);
      const newStatus = item.status === 'ready' ? 'claimed' : 'ready';
      await updateDoc(itemRef, {
        status: newStatus,
        claimedAt: newStatus === 'claimed' ? new Date().toISOString() : null,
      });
      success('อัปเดตสถานะแล้ว', `เปลี่ยนสถานะเป็น ${newStatus === 'claimed' ? 'รับสินค้าแล้ว' : 'พร้อมรับ'}`);
    } catch (err: any) {
      console.error('Update inventory error:', err);
      toastError('ไม่สามารถอัปเดตได้', err.message);
    }
  };

  const filteredItems = items.filter((it) => {
    if (filterStatus === 'ready') return it.status === 'ready';
    if (filterStatus === 'claimed') return it.status === 'claimed';
    return true;
  });

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 sm:py-24 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-[#A855F7] mx-auto mb-4">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">เข้าสู่ระบบเพื่อดูคลังสินค้า</h2>
        <p className="text-xs text-zinc-400 mt-2">
          สินค้า Blox Fruits ผลปีศาจ และ Gamepass ทั้งหมดที่คุณสั่งซื้อจะถูกเก็บไว้ที่นี่
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
    <div className="w-full max-w-6xl 2xl:max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8 pb-24 sm:pb-8">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">คลังสินค้าของฉัน</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 sm:mt-1">
            ผลปีศาจและไอเทมที่คุณสั่งซื้อ พร้อมลิงก์เข้ารับสินค้าใน VIP Server
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#11111A] border border-[#212133] self-start sm:self-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              filterStatus === 'all'
                ? 'bg-purple-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ทั้งหมด ({items.length})
          </button>
          <button
            onClick={() => setFilterStatus('ready')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              filterStatus === 'ready'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            พร้อมรับ ({items.filter((i) => i.status === 'ready').length})
          </button>
          <button
            onClick={() => setFilterStatus('claimed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              filterStatus === 'claimed'
                ? 'bg-zinc-700 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            รับแล้ว ({items.filter((i) => i.status === 'claimed').length})
          </button>
        </div>
      </div>

      {/* Guide Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#17122B] via-[#100D1E] to-[#0A0814] border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
            <Server className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white">วิธีเข้ารับผลปีศาจ / สินค้า</h3>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 leading-relaxed">
              1. กดปุ่ม <strong className="text-white">"ลิงค์รับของ"</strong> เพื่อเปิดเกม Blox Fruits
              <br className="hidden sm:inline" /> 2. แจ้ง Claim Code หรือชื่อ Roblox เพื่อ Trade ผลปีศาจ ปลอดภัย 100%
            </p>
          </div>
        </div>
      </div>

      {/* Inventory Items List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-zinc-500">กำลังโหลดรายการสินค้าในคลัง...</div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 sm:py-20 text-center rounded-3xl bg-[#11111A] border border-[#212133] p-6 sm:p-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#161624] flex items-center justify-center text-zinc-500 mx-auto mb-3 sm:mb-4">
            <Package className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white">ไม่พบสินค้าในคลัง</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {filterStatus !== 'all' 
              ? 'ไม่มีสินค้าตามตัวกรองที่เลือก' 
              : 'คุณยังไม่มีสินค้าในคลัง สามารถเลือกซื้อผลปีศาจหรือไอเทมได้ที่ร้านค้า'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item) => {
            const claimCode = item.claimCode || item.metadata?.claimCode || item.metadata?.code || item.metadata?.redeemCode;
            const claimCodeTitle = item.claimCodeTitle || item.metadata?.claimCodeTitle || 'รหัสรับสินค้า (Claim Code)';

            const instructions = item.instructions || item.metadata?.instructions;
            const instructionsTitle = item.instructionsTitle || item.metadata?.instructionsTitle || 'คำแนะนำ / รายละเอียดการรับสินค้า';

            const serverLink = item.serverLink || item.tradeServerLink || item.metadata?.serverLink || item.metadata?.tradeServerLink;
            const serverLinkTitle = item.serverLinkTitle || item.metadata?.serverLinkTitle || 'ลิงค์รับของ';

            const imageSrc = item.image || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80';

            return (
              <div
                key={item.id || item.inventoryId}
                className={`p-4 sm:p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                  item.status === 'ready'
                    ? 'bg-[#11111A] border-[#252538] hover:border-purple-500/40 shadow-xl'
                    : 'bg-[#0E0E16]/60 border-[#1B1B26] opacity-75'
                }`}
              >
                <div>
                  {/* Header Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                    <span className="text-[10px] sm:text-[11px] font-mono text-zinc-500">
                      Order #{item.orderId ? item.orderId.substring(0, 10) : 'N/A'}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        item.status === 'ready'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.status === 'ready' ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          พร้อมส่งมอบ
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> รับแล้ว
                        </>
                      )}
                    </span>
                  </div>

                  {/* Product details */}
                  <div className="flex gap-3 sm:gap-4 items-start">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0B0B14] border border-[#262638] shrink-0 p-1 flex items-center justify-center overflow-hidden">
                      <BloxImage
                        src={imageSrc}
                        alt={item.productName || 'Product'}
                        productName={item.productName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm sm:text-base font-bold text-white truncate">{item.productName || 'สินค้า'}</h4>
                      <p className="text-xs text-purple-400 font-semibold mt-0.5">
                        จำนวน: {item.quantity || 1} ชิ้น
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5">
                        ส่งมอบ: <span className="text-zinc-200">{item.deliveryType || 'Standard'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Claim Code Box */}
                  {claimCode && (
                    <div className="mt-3.5 p-2.5 sm:p-3 rounded-2xl bg-[#09090F] border border-[#212130] flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[9px] sm:text-[10px] text-zinc-400 uppercase font-bold tracking-wider truncate flex items-center gap-1">
                          <Key className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{claimCodeTitle}</span>
                        </div>
                        <div className="font-mono text-xs sm:text-sm font-bold text-amber-300 mt-0.5 select-all truncate">{claimCode}</div>
                      </div>
                      <button
                        onClick={() => handleCopyCode(claimCode, item.id || item.inventoryId)}
                        className="p-1.5 sm:p-2 rounded-xl bg-[#181826] hover:bg-[#202034] text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
                        title={`คัดลอก ${claimCodeTitle}`}
                      >
                        {copiedId === (item.id || item.inventoryId) ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Instructions / Delivery Message */}
                  {instructions && (
                    <div className="mt-3 bg-[#141420]/70 p-2.5 sm:p-3 rounded-2xl border border-[#202030] leading-relaxed">
                      <div className="text-[10px] sm:text-[11px] font-bold text-purple-300 mb-1 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-purple-400 shrink-0" />
                        <span className="truncate">{instructionsTitle}</span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {instructions}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions Bottom */}
                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-[#1E1E2E] flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                  {serverLink ? (
                    <a
                      href={serverLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:brightness-110 text-white text-[11px] sm:text-xs font-bold shadow flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <Server className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{serverLinkTitle}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <div className="text-xs text-zinc-500">รอทีมงานส่งมอบในเกม</div>
                  )}

                  <button
                    onClick={() => handleMarkClaimed(item)}
                    className={`py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-[11px] sm:text-xs font-semibold border transition-colors cursor-pointer ${
                      item.status === 'ready'
                        ? 'border-[#2D2D42] bg-[#141422] text-zinc-300 hover:text-white hover:bg-[#1C1C2E]'
                        : 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                    }`}
                  >
                    {item.status === 'ready' ? 'รับสินค้าแล้ว' : 'ยังไม่ได้รับ'}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
