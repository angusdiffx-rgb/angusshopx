import React from 'react';
import { Flame, Shield, Zap, Heart, MessageSquare, ExternalLink } from 'lucide-react';
import { useHomeConfig } from '../context/HomeConfigContext';
import { DEFAULT_HOME_CONFIG } from '../data/bloxPresets';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { homeConfig } = useHomeConfig();

  return (
    <footer className="w-full max-w-[100vw] overflow-x-hidden bg-[#07050F] border-t border-[rgba(168,85,247,0.20)] mt-16 sm:mt-24 [overscroll-behavior-x:none] [touch-action:pan-y_pinch-zoom] relative">
      {/* Purple Ambient Glow at top of footer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-[#8B5CF6]/10 blur-3xl pointer-events-none"></div>

      {/* Top Banner / Trust factors (แถบสถิติความปลอดภัย) */}
      <div className="border-b border-[rgba(168,85,247,0.15)] py-6 sm:py-8 bg-[#0F0A1A]/40 w-full overflow-hidden">
        <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
          <div className="flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-3xl bg-[rgba(255,255,255,0.04)] backdrop-blur-[18px] border border-[rgba(168,85,247,0.18)] hover:border-[rgba(192,132,252,0.40)] transition-all min-w-0 overflow-hidden shadow-sm">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-[#C084FC] shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">ระบบเติมเงิน SlipOK อัตโนมัติ</h4>
              <p className="text-[11px] sm:text-xs text-[#B8AEC9] mt-0.5 leading-relaxed">ตรวจสอบสลิปแม่นยำ ปรับยอดไวใน 3 วินาที ตลอด 24 ชม.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-3xl bg-[rgba(255,255,255,0.04)] backdrop-blur-[18px] border border-[rgba(168,85,247,0.18)] hover:border-emerald-500/40 transition-all min-w-0 overflow-hidden shadow-sm">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">ปลอดภัย 100% ไม่โดนแบน</h4>
              <p className="text-[11px] sm:text-xs text-[#B8AEC9] mt-0.5 leading-relaxed">ส่งผลปีศาจผ่านระบบ Trade VIP Server ปลอดภัยไร้ความเสี่ยง</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-3xl bg-[rgba(255,255,255,0.04)] backdrop-blur-[18px] border border-[rgba(168,85,247,0.18)] hover:border-amber-500/40 transition-all min-w-0 overflow-hidden shadow-sm">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">บริการและซัพพอร์ตมืออาชีพ</h4>
              <p className="text-[11px] sm:text-xs text-[#B8AEC9] mt-0.5 leading-relaxed">มีแอดมินคอยดูแลคำสั่งซื้อและให้คำแนะนำทุกขั้นตอน</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#6D28D9] to-[#C084FC] p-0.5 shadow-[0_0_20px_rgba(168,85,247,0.4)] overflow-hidden">
                <img
                  src={homeConfig.siteLogo || DEFAULT_HOME_CONFIG.siteLogo}
                  alt="AngusShop Logo"
                  className="w-full h-full object-cover rounded-[14px]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://tr.rbxcdn.com/180DAY-774ec14539b264f85fdb6e8a34dfa344/512/512/Image/Png/noFilter';
                  }}
                />
              </div>
              <span className="font-black text-2xl tracking-wider text-white">ANGUS<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] to-[#C084FC]">SHOP</span></span>
            </div>
            <p className="text-xs text-[#B8AEC9] leading-relaxed max-w-sm">
              ร้านจำหน่ายผลปีศาจ Blox Fruits และสินค้า Gamepass ไอเทม Roblox ระดับพรีเมียม ส่งไว ปลอดภัย ราคายุติธรรม ด้วยระบบอัตโนมัติมาตรฐานสากล
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-[#0F0A1A]/80 border border-[rgba(168,85,247,0.25)] text-[11px] text-[#B8AEC9] flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
                PromptPay: <strong className="text-white">0829848852</strong> (นาย กฤติน สุโขพล)
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]"></span>
              เมนูด่วน
            </h5>
            <ul className="space-y-2.5 text-xs text-[#B8AEC9]">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-[#C084FC] transition-colors cursor-pointer">หน้าแรก</button>
              </li>
              <li>
                <button onClick={() => onNavigate('shop')} className="hover:text-[#C084FC] transition-colors cursor-pointer">ร้านค้าทั้งหมด</button>
              </li>
              <li>
                <button onClick={() => onNavigate('wallet')} className="hover:text-[#C084FC] transition-colors cursor-pointer">เติมเงิน Wallet</button>
              </li>
              <li>
                <button onClick={() => onNavigate('inventory')} className="hover:text-[#C084FC] transition-colors cursor-pointer">คลังสินค้า</button>
              </li>
              <li>
                <button onClick={() => onNavigate('orders')} className="hover:text-[#C084FC] transition-colors cursor-pointer">ประวัติคำสั่งซื้อ</button>
              </li>
            </ul>
          </div>

          {/* Guide & Policies */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]"></span>
              ข้อกำหนดและนโยบาย
            </h5>
            <ul className="space-y-2.5 text-xs text-[#B8AEC9]">
              <li className="hover:text-[#C084FC] cursor-pointer transition-colors">วิธีสั่งซื้อและรับผลปีศาจ</li>
              <li className="hover:text-[#C084FC] cursor-pointer transition-colors">เงื่อนไขการให้บริการ (Terms)</li>
              <li className="hover:text-[#C084FC] cursor-pointer transition-colors">นโยบายความเป็นส่วนตัว (Privacy)</li>
              <li className="hover:text-[#C084FC] cursor-pointer transition-colors">นโยบายการคืนเงิน (Refund Policy)</li>
              <li className="hover:text-[#C084FC] cursor-pointer transition-colors">ความปลอดภัยบัญชี Roblox</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]"></span>
              ติดต่อเรา
            </h5>
            <p className="text-xs text-[#B8AEC9] leading-relaxed mb-3">
              ต้องการความช่วยเหลือหรือสอบถามเรื่องการรับสินค้า ติดต่อทีมงานได้ตลอดเวลา
            </p>
            <div className="flex flex-col gap-2">
              <a 
                href="https://discord.com" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[rgba(255,255,255,0.04)] hover:bg-[#6D28D9]/20 border border-[rgba(168,85,247,0.20)] hover:border-[rgba(192,132,252,0.45)] text-xs text-[#B8AEC9] hover:text-white transition-all shadow-sm"
              >
                <span>Discord Community</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#C084FC]" />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[rgba(255,255,255,0.04)] hover:bg-[#6D28D9]/20 border border-[rgba(168,85,247,0.20)] hover:border-[rgba(192,132,252,0.45)] text-xs text-[#B8AEC9] hover:text-white transition-all shadow-sm"
              >
                <span>Facebook Page</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#C084FC]" />
              </a>
            </div>
          </div>

        </div>

        {/* Disclaimer mandated in Prompt 30 */}
        <div className="mt-12 pt-6 border-t border-[rgba(168,85,247,0.15)] flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-[11px] text-[#B8AEC9]/70 leading-relaxed">
            AngusShop is an independent store and is not affiliated with Roblox Corporation.
          </p>
          <p className="text-[11px] text-[#B8AEC9] flex items-center gap-1.5 justify-center">
            Crafted for Blox Fruits Gamers with <Heart className="w-3.5 h-3.5 text-[#C084FC] fill-[#C084FC]" /> © {new Date().getFullYear()} AngusShop
          </p>
        </div>
      </div>
    </footer>
  );
};
