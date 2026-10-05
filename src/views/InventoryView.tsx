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
  Info,
  Lock,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { collection, query, where, limit, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BloxImage } from '../components/BloxImage';
import type { InventoryItem } from '../types';

export const InventoryView: React.FC = () => {
  const { user, loginWithGoogle, isAdmin } = useAuth();
  const { success, error: toastError } = useToast();
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const cached = sessionStorage.getItem(`user_inventory_${user?.uid}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(!items.length);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'claimed'>('all');
  const [displayLimit, setDisplayLimit] = useState(25);

  const fetchInventory = async (force = false) => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const cacheKey = `user_inventory_${user.uid}`;
    const cacheTimeKey = `user_inventory_time_${user.uid}`;
    const now = Date.now();
    const lastTime = Number(sessionStorage.getItem(cacheTimeKey) || 0);

    if (!force && now - lastTime < 3 * 60 * 1000) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          setItems(JSON.parse(cached));
          setLoading(false);
          return;
        }
      } catch {}
    }

    if (force) setIsRefreshing(true);
    else if (!items.length) setLoading(true);

    try {
      const q = query(
        collection(db, 'inventory'),
        where('uid', '==', user.uid),
        limit(displayLimit)
      );
      const snapshot = await getDocs(q);
      const list: InventoryItem[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as InventoryItem) });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(list);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(list));
        sessionStorage.setItem(cacheTimeKey, String(now));
      } catch {}
    } catch (err) {
      console.warn('Inventory fetch notice:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();

    const handleUpdate = () => {
      fetchInventory(true);
    };
    window.addEventListener('inventoryUpdated', handleUpdate);

    return () => {
      window.removeEventListener('inventoryUpdated', handleUpdate);
    };
  }, [user, displayLimit]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    success('คัดลอกรหัสเคลมแล้ว', code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkClaimed = async (item: InventoryItem) => {
    if (!isAdmin) {
      toastError('เฉพาะแอดมินเท่านั้น', 'คุณไม่มีสิทธิ์เปลี่ยนสถานะรายการนี้ เฉพาะแอดมินเท่านั้นที่สามารถกดยืนยันการรับของได้');
      return;
    }

    try {
      const itemRef = doc(db, 'inventory', item.id || item.inventoryId);
      const newStatus = item.status === 'ready' ? 'claimed' : 'ready';
      await updateDoc(itemRef, {
        status: newStatus,
        claimedAt: newStatus === 'claimed' ? new Date().toISOString() : null,
      });
      setItems((prev) =>
        prev.map((it) =>
          (it.id === item.id || it.inventoryId === item.inventoryId)
            ? { ...it, status: newStatus, claimedAt: newStatus === 'claimed' ? new Date().toISOString() : undefined }
            : it
        )
      );
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
    <div className="w-full max-w-6xl 2xl:max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8 pb-24 sm:pb-8 overflow-x-hidden [overscroll-behavior-x:none] [touch-action:pan-y_pinch-zoom]">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">คลังสินค้าของฉัน</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 sm:mt-1">
            ผลปีศาจและไอเทมที่คุณสั่งซื้อ พร้อมลิงก์เข้ารับสินค้าใน VIP Server
          </p>
        </div>

        {/* Filter Pills & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#11111A] border border-[#212133] overflow-x-auto no-scrollbar">
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

          <button
            onClick={() => fetchInventory(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-[#141420] hover:bg-[#1c1c2e] border border-[#212133] text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="รีเฟรชข้อมูลคลังสินค้า"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'กำลังโหลด...' : 'รีเฟรช'}</span>
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
        <div className="space-y-6">
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
                        {item.productName?.includes('เงินม่วง') || item.productName?.includes('Fragment') ? (
                          <span className="text-purple-400 font-bold">
                            จำนวน: {(Number(item.quantity || 1) * 10).toLocaleString()}k Fragments ({item.quantity || 1} ชุด)
                          </span>
                        ) : item.productName?.includes('เงินเขียว') || item.productName?.includes('Beli') ? (
                          <span className="text-emerald-400 font-bold">
                            จำนวน: {item.quantity || 1}M ({(Number(item.quantity || 1) * 1000000).toLocaleString()} Beli)
                          </span>
                        ) : item.productName?.includes('เลเวล') || item.productName?.includes('Level') ? (
                          <span className="text-cyan-400 font-bold">
                            จำนวน: {(Number(item.quantity || 1) * 100).toLocaleString()} เลเวล ({item.quantity || 1} ชุด)
                          </span>
                        ) : item.productName?.includes('มาสเตอร์') || item.productName?.includes('มาส') || item.productName?.includes('Mastery') ? (
                          <span className="text-amber-400 font-bold">
                            จำนวน: {(Number(item.quantity || 1) * 100).toLocaleString()} มาสเตอร์รี่ ({item.quantity || 1} ชุด)
                          </span>
                        ) : (
                          <>จำนวน: {item.quantity || 1} ชิ้น</>
                        )}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5">
                        ส่งมอบ:{' '}
                        <span className="text-zinc-200">
                          {item.deliveryType === 'manual_service' || item.deliveryType === 'service'
                            ? 'บริการฟาร์มในเกม'
                            : item.deliveryType === 'fruit_trade' || item.deliveryType === 'fruit'
                            ? 'เซิร์ฟเวอร์ VIP (Trade)'
                            : item.deliveryType === 'gamepass_gift' || item.deliveryType === 'gamepass'
                            ? 'Gamepass Gift'
                            : (item.deliveryType || 'Standard')}
                        </span>
                      </p>
                      {item.metadata?.serviceAccountUsername && (
                        <p className="text-[10px] sm:text-[11px] text-amber-300/90 mt-0.5 font-mono flex items-center gap-1">
                          <span>ไอดีฟาร์ม:</span>
                          <span className="font-bold text-white">{item.metadata.serviceAccountUsername}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Claim Code / Roblox Account Box */}
                  {claimCode && (
                    <div className="mt-3.5 p-3 rounded-2xl bg-[#09090F] border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between gap-2 border-b border-amber-500/15 pb-1.5">
                        <div className="text-[10px] sm:text-[11px] text-amber-300 uppercase font-bold tracking-wider truncate flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{claimCodeTitle}</span>
                        </div>
                        <button
                          onClick={() => handleCopyCode(claimCode, item.id || item.inventoryId)}
                          className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedId === (item.id || item.inventoryId) ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">คัดลอกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>คัดลอกทั้งหมด</span>
                            </>
                          )}
                        </button>
                      </div>

                      {claimCode.includes(':') ? (
                        <div className="space-y-1.5 font-mono text-xs">
                          {(() => {
                            const [u, p] = claimCode.split(':').map(s => s.trim());
                            return (
                              <>
                                <div className="flex items-center justify-between gap-2 bg-[#120F1D] px-2.5 py-1.5 rounded-xl border border-white/5">
                                  <div className="truncate">
                                    <span className="text-zinc-500 text-[10px] mr-1.5">User:</span>
                                    <strong className="text-white select-all">{u}</strong>
                                  </div>
                                  <button
                                    onClick={() => handleCopyCode(u, `${item.id}_u`)}
                                    className="text-[10px] text-zinc-400 hover:text-white bg-white/5 px-2 py-0.5 rounded cursor-pointer shrink-0"
                                  >
                                    {copiedId === `${item.id}_u` ? 'คัดลอกแล้ว' : 'คัดลอก'}
                                  </button>
                                </div>

                                <div className="flex items-center justify-between gap-2 bg-[#120F1D] px-2.5 py-1.5 rounded-xl border border-white/5">
                                  <div className="truncate">
                                    <span className="text-zinc-500 text-[10px] mr-1.5">Pass:</span>
                                    <strong className="text-amber-300 select-all">{p}</strong>
                                  </div>
                                  <button
                                    onClick={() => handleCopyCode(p, `${item.id}_p`)}
                                    className="text-[10px] text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded cursor-pointer shrink-0"
                                  >
                                    {copiedId === `${item.id}_p` ? 'คัดลอกแล้ว' : 'คัดลอก'}
                                  </button>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="font-mono text-xs sm:text-sm font-bold text-amber-300 select-all truncate">
                          {claimCode}
                        </div>
                      )}
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

                  {isAdmin ? (
                    <button
                      id={`inventory-claim-btn-${item.id || item.inventoryId}`}
                      type="button"
                      onClick={() => handleMarkClaimed(item)}
                      title="เฉพาะแอดมิน: คลิกเพื่อเปลี่ยนสถานะรับสินค้า"
                      className={`py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                        item.status === 'ready'
                          ? 'border-purple-500/40 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200'
                          : 'border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>{item.status === 'ready' ? 'รับสินค้าแล้ว' : 'ยังไม่ได้รับ'}</span>
                    </button>
                  ) : (
                    <button
                      id={`inventory-claim-btn-${item.id || item.inventoryId}`}
                      type="button"
                      disabled
                      title="เฉพาะแอดมินเท่านั้นที่สามารถกดยืนยันการรับสินค้าได้"
                      className={`py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-[11px] sm:text-xs font-semibold border flex items-center gap-1.5 cursor-not-allowed opacity-75 select-none ${
                        item.status === 'ready'
                          ? 'border-[#2D2D42] bg-[#141422] text-zinc-400'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      <Lock className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span>{item.status === 'ready' ? 'รับสินค้าแล้ว' : 'รับสินค้าแล้ว'}</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {filteredItems.length >= displayLimit && (
          <div className="pt-4 text-center">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 60)}
              className="px-6 py-2.5 rounded-xl bg-[#1C1C2C] hover:bg-purple-600/30 border border-[#2B2B40] text-purple-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
            >
              โหลดคลังสินค้าเพิ่มเติม (+60 รายการ)
            </button>
          </div>
        )}
        </div>
      )}
    </div>
  );
};
