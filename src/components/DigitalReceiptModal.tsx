import React from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, Package, Sparkles } from 'lucide-react';
import { Order } from '../types';
import { playClickSound } from '../lib/sound';

interface DigitalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const total = order.total ?? order.totalAmount ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F0A1E] border border-[rgba(168,85,247,0.35)] rounded-3xl shadow-[0_12px_45px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Action Bar */}
        <div className="p-3.5 sm:p-4 border-b border-[rgba(168,85,247,0.2)] flex items-center justify-between bg-[#150E28] no-print">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
            <h3 className="text-sm font-bold text-white">ใบเสร็จรับเงินอิเล็กทรอนิกส์ (E-Receipt)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ / บันทึก</span>
            </button>
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
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-5 sm:p-8 space-y-6 overflow-y-auto bg-gradient-to-b from-[#130C26] via-[#0E071D] to-[#0A0517] text-white">
          
          {/* Store Brand Header */}
          <div className="text-center pb-4 border-b border-purple-500/20 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-[#C084FC] text-[10px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>ANGUSSHOP OFFICIAL RECEIPT</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">AngusShop Blox Fruits</h2>
            <p className="text-[11px] text-zinc-400">ร้านจำหน่ายผลปีศาจและบริการเกม Roblox ระบบอัตโนมัติ</p>
          </div>

          {/* Receipt Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#180F33]/60 border border-purple-500/20 text-xs">
            <div>
              <span className="text-zinc-400 block text-[10px]">รหัสคำสั่งซื้อ (Order ID)</span>
              <strong className="text-white font-mono text-[11px] sm:text-xs truncate block">{order.orderId}</strong>
            </div>
            <div className="text-right">
              <span className="text-zinc-400 block text-[10px]">วันที่สั่งซื้อ (Date & Time)</span>
              <span className="text-zinc-200 text-[11px] block">{new Date(order.createdAt).toLocaleString('th-TH')}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px]">ชื่อบัญชี Roblox (Recipient)</span>
              <span className="text-cyan-300 font-bold block">{order.robloxUsername || 'ไม่ระบุ'}</span>
            </div>
            <div className="text-right">
              <span className="text-zinc-400 block text-[10px]">สถานะการชำระเงิน</span>
              <span className="text-emerald-400 font-bold inline-flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3 h-3" /> ชำระแล้ว (Wallet)
              </span>
            </div>
          </div>

          {/* Itemized List */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-zinc-400 flex items-center justify-between pb-1 border-b border-white/10 uppercase tracking-wider">
              <span>รายการสินค้า</span>
              <span>รวม (บาท)</span>
            </div>

            <div className="space-y-2.5">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between text-xs gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-zinc-400">
                      จำนวน: {item.quantity} ชิ้น • ราคา ฿{item.price.toLocaleString()}
                      {item.selectedOption ? ` • [${item.selectedOption}]` : ''}
                    </p>
                  </div>
                  <span className="font-bold text-white shrink-0">
                    ฿{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="pt-3 border-t border-purple-500/25 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span>ยอดรวมสินค้า (Subtotal)</span>
              <span>฿{((order.subtotal ?? total) || 0).toLocaleString()}</span>
            </div>
            {Boolean(order.discount) && (
              <div className="flex items-center justify-between text-rose-400">
                <span>ส่วนลดโปรโมชั่น (Discount)</span>
                <span>-฿{(order.discount || 0).toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-base font-black text-white pt-2 border-t border-white/10">
              <span>ยอดชำระสุทธิ (Grand Total)</span>
              <span className="text-cyan-400 text-lg">฿{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Verification Barcode & Guarantee */}
          <div className="p-3 rounded-2xl bg-black/40 border border-purple-500/20 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>การันตีสินค้าของแท้ 100% ส่งมอบปลอดภัย</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              VERIFIED TRANSACTION • ANGUSSHOP BOT DELIVERY PROTOCOL
            </p>
          </div>

        </div>

        {/* Modal Bottom Close */}
        <div className="p-3 border-t border-[rgba(168,85,247,0.2)] bg-[#0C0618] text-right no-print">
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
