import React, { useState } from 'react';
import { 
  Search, 
  X, 
  Package, 
  ExternalLink, 
  Copy, 
  Check, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  FileText, 
  ShieldCheck 
} from 'lucide-react';
import { Order } from '../types';
import { BloxImage } from './BloxImage';
import { playClickSound } from '../lib/sound';
import { useToast } from '../context/ToastContext';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders?: Order[];
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  orders = []
}) => {
  const { success } = useToast();
  const [searchKey, setSearchKey] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  // Retrieve local cached orders if available
  const allKnownOrders: Order[] = React.useMemo(() => {
    let list = [...orders];
    try {
      const cached = localStorage.getItem('angus_user_orders');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const ids = new Set(list.map(o => o.orderId));
          parsed.forEach((o: Order) => {
            if (o.orderId && !ids.has(o.orderId)) {
              list.push(o);
              ids.add(o.orderId);
            }
          });
        }
      }
    } catch {}
    return list;
  }, [orders]);

  const searchResults = React.useMemo(() => {
    const q = searchKey.trim().toLowerCase();
    if (!q) return allKnownOrders.slice(0, 5); // Show latest 5 if no query

    return allKnownOrders.filter((o) => {
      const matchOrderId = o.orderId?.toLowerCase().includes(q);
      const matchRoblox = o.robloxUsername?.toLowerCase().includes(q);
      const matchEmail = o.userEmail?.toLowerCase().includes(q);
      const matchItems = o.items?.some(i => i.name?.toLowerCase().includes(q));
      return matchOrderId || matchRoblox || matchEmail || matchItems;
    });
  }, [searchKey, allKnownOrders]);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    success('คัดลอกแล้ว', text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> จัดส่งสำเร็จ
          </span>
        );
      case 'processing':
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-[#C084FC] border border-purple-500/30">
            <Clock className="w-3.5 h-3.5 animate-spin" /> กำลังจัดส่ง / รอเทรด
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" /> ยกเลิก
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> รอดำเนินการ
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F0A1E] border border-[rgba(168,85,247,0.3)] rounded-3xl shadow-[0_12px_45px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[rgba(168,85,247,0.2)] flex items-center justify-between bg-gradient-to-r from-[#1B1035] to-[#0F0A1E]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-[#C084FC]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">ตรวจสอบสถานะคำสั่งซื้อ</h3>
              <p className="text-xs text-[#B8AEC9]">ค้นหาด้วยรหัสคำสั่งซื้อ (Order ID) หรือชื่อผู้ใช้ Roblox</p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#C084FC] absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="กรอกรหัสออเดอร์ เช่น ORD-... หรือชื่อตัวละคร Roblox"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              className="w-full bg-[#07040F] border border-[rgba(168,85,247,0.3)] rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-[#B8AEC9]/50 focus:outline-none focus:border-[#C084FC] focus:ring-1 focus:ring-[#C084FC]"
            />
            {searchKey && (
              <button
                onClick={() => setSearchKey('')}
                className="absolute right-3 top-3 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* If an order is selected, show detail view */}
          {selectedOrder ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-xs font-bold text-[#C084FC] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← กลับไปหน้ารายการ
                </button>
                {getStatusBadge(selectedOrder.orderStatus || selectedOrder.status)}
              </div>

              {/* Order Info Card */}
              <div className="p-4 rounded-2xl bg-[#140D2B]/90 border border-purple-500/25 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-zinc-400">รหัสคำสั่งซื้อ: </span>
                    <strong className="text-white font-mono">{selectedOrder.orderId}</strong>
                  </div>
                  <div className="text-zinc-400">
                    วันที่: <span className="text-zinc-200">{new Date(selectedOrder.createdAt).toLocaleString('th-TH')}</span>
                  </div>
                </div>

                {selectedOrder.robloxUsername && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs">
                    <span className="text-[#B8AEC9]">ชื่อ Roblox รับของ:</span>
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span>{selectedOrder.robloxUsername}</span>
                      <button
                        onClick={() => handleCopy(selectedOrder.robloxUsername!, 'roblox')}
                        className="text-[#C084FC] hover:text-white"
                        title="คัดลอก"
                      >
                        {copiedKey === 'roblox' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Items in order */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-white">รายการสินค้าที่สั่งซื้อ:</span>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#090514] border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-black/40">
                            <BloxImage
                              src={item.image}
                              alt={item.name}
                              productName={item.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{item.name}</h4>
                            <p className="text-[10px] text-zinc-400">
                              จำนวน: x{item.quantity} • ฿{item.price.toLocaleString()}
                              {item.selectedOption && ` • ${item.selectedOption}`}
                            </p>
                          </div>
                        </div>

                        {/* Trade / VIP Server Link button if available */}
                        {item.tradeServerLink && (
                          <a
                            href={item.tradeServerLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md cursor-pointer shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>{item.serverLinkTitle || 'เข้าเซิร์ฟ VIP รับของ'}</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-2 border-t border-purple-500/20 text-xs font-bold">
                  <span className="text-zinc-400">ยอดชำระสุทธิ:</span>
                  <span className="text-base text-cyan-400">฿{(selectedOrder.total ?? selectedOrder.totalAmount ?? 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Results List */
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-[#B8AEC9] flex items-center justify-between">
                <span>{searchKey ? `ผลการค้นหา (${searchResults.length})` : 'คำสั่งซื้อล่าสุดของคุณ:'}</span>
                <span className="text-[10px] text-zinc-500">ข้อมูลอัปเดตแบบเรียลไทม์</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#090514] border border-white/10 space-y-2">
                  <Package className="w-10 h-10 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-300 font-bold">ไม่พบคำสั่งซื้อที่ค้นหา</p>
                  <p className="text-[11px] text-zinc-500">
                    กรุณาตรวจสอบรหัสออเดอร์ หรือเข้าสู่ระบบเพื่อดูประวัติคำสั่งซื้อทั้งหมด
                  </p>
                </div>
              ) : (
                searchResults.map((order) => (
                  <div
                    key={order.orderId}
                    onClick={() => setSelectedOrder(order)}
                    className="p-3 sm:p-3.5 rounded-2xl bg-[#140D2B]/80 hover:bg-[#1C123D] border border-purple-500/25 hover:border-[#C084FC]/50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-[#C084FC] shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white group-hover:text-[#C084FC] font-mono truncate">
                            {order.orderId}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {order.items?.map(i => i.name).join(', ') || 'สินค้า Blox Fruits'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-black text-cyan-400 block">
                          ฿{(order.total ?? order.totalAmount ?? 0).toLocaleString()}
                        </span>
                        <div className="mt-0.5">
                          {getStatusBadge(order.orderStatus || order.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[rgba(168,85,247,0.2)] bg-[#07040F] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>เทรดปลอดภัย 100% ผ่านเซิร์ฟเวอร์ VIP</span>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
};
