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
    <footer className="w-full bg-[#08080C] border-t border-[#1E1E2E] mt-24">
      {/* Top Banner / Trust factors */}
      <div className="border-b border-[#1E1E2E]/60 py-8 bg-[#0D0D15]/50">
        <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#11111A] border border-[#212130]">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#A855F7] shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">ระบบเติมเงิน SlipOK อัตโนมัติ</h4>
              <p className="text-xs text-zinc-400 mt-0.5">ตรวจสอบสลิปแม่นยำ ปรับยอดไวใน 3 วินาที ตลอด 24 ชม.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#11111A] border border-[#212130]">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">ปลอดภัย 100% ไม่โดนแบน</h4>
              <p className="text-xs text-zinc-400 mt-0.5">ส่งผลปีศาจผ่านระบบ Trade VIP Server ปลอดภัยไร้ความเสี่ยง</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#11111A] border border-[#212130]">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">บริการและซัพพอร์ตมืออาชีพ</h4>
              <p className="text-xs text-zinc-400 mt-0.5">มีแอดมินคอยดูแลคำสั่งซื้อและให้คำแนะนำทุกขั้นตอน</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] p-0.5 overflow-hidden">
                <img
                  src={homeConfig.siteLogo || DEFAULT_HOME_CONFIG.siteLogo}
                  alt="AngusShop Logo"
                  className="w-full h-full object-cover rounded-[10px]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://tr.rbxcdn.com/180DAY-774ec14539b264f85fdb6e8a34dfa344/512/512/Image/Png/noFilter';
                  }}
                />
              </div>
              <span className="font-black text-2xl tracking-wider text-white">ANGUS<span className="text-[#A855F7]">SHOP</span></span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              ร้านจำหน่ายผลปีศาจ Blox Fruits และสินค้า Gamepass ไอเทม Roblox ระดับพรีเมียม ส่งไว ปลอดภัย ราคายุติธรรม ด้วยระบบอัตโนมัติมาตรฐานสากล
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-[#11111A] border border-[#252538] text-[11px] text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                PromptPay: 0829848852 (นาย กฤติน สุโขพล)
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">เมนูด่วน</h5>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-purple-400 transition-colors">หน้าแรก</button>
              </li>
              <li>
                <button onClick={() => onNavigate('shop')} className="hover:text-purple-400 transition-colors">ร้านค้าทั้งหมด</button>
              </li>
              <li>
                <button onClick={() => onNavigate('wallet')} className="hover:text-purple-400 transition-colors">เติมเงิน Wallet</button>
              </li>
              <li>
                <button onClick={() => onNavigate('inventory')} className="hover:text-purple-400 transition-colors">คลังสินค้า</button>
              </li>
              <li>
                <button onClick={() => onNavigate('orders')} className="hover:text-purple-400 transition-colors">ประวัติคำสั่งซื้อ</button>
              </li>
            </ul>
          </div>

          {/* Guide & Policies */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">ข้อกำหนดและนโยบาย</h5>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li className="hover:text-purple-400 cursor-pointer">วิธีสั่งซื้อและรับผลปีศาจ</li>
              <li className="hover:text-purple-400 cursor-pointer">เงื่อนไขการให้บริการ (Terms)</li>
              <li className="hover:text-purple-400 cursor-pointer">นโยบายความเป็นส่วนตัว (Privacy)</li>
              <li className="hover:text-purple-400 cursor-pointer">นโยบายการคืนเงิน (Refund Policy)</li>
              <li className="hover:text-purple-400 cursor-pointer">ความปลอดภัยบัญชี Roblox</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">ติดต่อเรา</h5>
            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              ต้องการความช่วยเหลือหรือสอบถามเรื่องการรับสินค้า ติดต่อทีมงานได้ตลอดเวลา
            </p>
            <div className="flex flex-col gap-2">
              <a 
                href="https://discord.com" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#11111A] hover:bg-[#1A1A28] border border-[#252538] text-xs text-zinc-300 hover:text-white transition-colors"
              >
                <span>Discord Community</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#11111A] hover:bg-[#1A1A28] border border-[#252538] text-xs text-zinc-300 hover:text-white transition-colors"
              >
                <span>Facebook Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

        {/* Disclaimer mandated in Prompt 30 */}
        <div className="mt-12 pt-6 border-t border-[#1A1A28] flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            AngusShop is an independent store and is not affiliated with Roblox Corporation.
          </p>
          <p className="text-[11px] text-zinc-500 flex items-center gap-1 justify-center">
            Crafted for Blox Fruits Gamers with <Heart className="w-3.5 h-3.5 text-purple-400 fill-purple-400" /> © {new Date().getFullYear()} AngusShop
          </p>
        </div>
      </div>
    </footer>
  );
};
