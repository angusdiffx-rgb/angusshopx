import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  ExternalLink, 
  Sparkles, 
  Tag, 
  CheckCircle2 
} from 'lucide-react';
import type { Product } from '../types';
import { useToast } from '../context/ToastContext';
import { getProductMetadata } from '../lib/seo';
import { BloxImage } from './BloxImage';

interface ProductShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const ProductShareModal: React.FC<ProductShareModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  if (!isOpen) return null;

  const metadata = getProductMetadata(product);
  const shareUrl = metadata.productUrl;
  const tweetText = `ซื้อ ${product.name} ราคาเพียง ฿${product.price.toLocaleString()} ที่ AngusShop ร้านขายผลปีศาจ Blox Fruits และไอเทม Roblox ส่งไว ปลอดภัย 100%`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      success('คัดลอกลิงก์แล้ว', 'นำลิงก์ไปแชร์ใน Discord, Facebook, หรือแชทได้ทันที');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.getElementById('share-link-input') as HTMLInputElement;
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        success('คัดลอกลิงก์แล้ว', 'นำลิงก์ไปแชร์ได้ทันที');
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const handleShareLine = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
    window.open(lineUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: metadata.title,
          text: metadata.description,
          url: shareUrl,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 max-w-[100vw] overflow-x-hidden [overscroll-behavior-x:none] [touch-action:pan-y_pinch-zoom]">
      <div 
        className="relative w-full max-w-xl bg-[#0D0D15] border border-[#252538] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 text-white max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1E1E2E]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                แชร์สินค้านี้
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  OpenGraph & Twitter Cards
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                แชร์ลิงก์ให้เพื่อนหรือโพสต์ลงโซเชียล พร้อมแสดงรูปภาพและราคาอัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1E1E2E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Social Media Card Preview (How Discord / Twitter / Facebook see this) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              ตัวอย่าง Social Share Card (Discord / Facebook / X):
            </span>
            <span className="text-[10px] text-zinc-500">
              Dynamic Metadata Active
            </span>
          </div>

          <div className="rounded-2xl border border-[#2B2B42] bg-[#141422] overflow-hidden shadow-xl hover:border-purple-500/40 transition-colors">
            {/* Card Thumbnail */}
            <div className="relative aspect-[1.91/1] w-full bg-[#0A0A10] flex items-center justify-center border-b border-[#212133] overflow-hidden p-4">
              <BloxImage
                src={metadata.imageUrl}
                alt={product.name}
                productName={product.name}
                className="max-h-full max-w-full object-contain drop-shadow-[0_8px_20px_rgba(147,51,234,0.4)]"
              />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-purple-600/90 text-white text-[10px] font-black tracking-wide backdrop-blur-md">
                  {product.category || 'ผลปีศาจ'}
                </span>
                {product.rarity && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/80 text-white text-[10px] font-bold backdrop-blur-md">
                    {product.rarity}
                  </span>
                )}
              </div>
              <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-black/80 border border-white/10 text-emerald-400 text-xs font-black backdrop-blur-md">
                ฿{(product.price || 0).toLocaleString()}
              </div>
            </div>

            {/* Card Content Snippet */}
            <div className="p-3.5 space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-purple-400 font-extrabold flex items-center gap-1">
                <span>ANGUSSHOP</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400 normal-case">Blox Fruits Store</span>
              </div>
              <div className="text-sm font-bold text-white line-clamp-1">
                {metadata.title}
              </div>
              <div className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {metadata.description}
              </div>
            </div>
          </div>
        </div>

        {/* Shareable Link Input with One-Click Copy */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-300">
            ลิงก์แชร์ตรงสำหรับสินค้านี้ (Direct Product Link):
          </label>
          <div className="flex items-center gap-2">
            <input
              id="share-link-input"
              type="text"
              readOnly
              value={shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 bg-[#141422] border border-[#252538] rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 selection:bg-purple-600"
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                copied
                  ? 'bg-emerald-500 text-zinc-950 font-black'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>คัดลอกลิงก์</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Social Network Share Buttons */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-zinc-300">
            แชร์ไปยังช่องทางโซเชียล:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Facebook */}
            <button
              onClick={handleShareFacebook}
              className="p-2.5 rounded-xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/30 hover:border-[#1877F2] text-[#1877F2] text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Facebook</span>
            </button>

            {/* X (Twitter) */}
            <button
              onClick={handleShareTwitter}
              className="p-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700 hover:border-zinc-500 text-zinc-200 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>X (Twitter)</span>
            </button>

            {/* LINE */}
            <button
              onClick={handleShareLine}
              className="p-2.5 rounded-xl bg-[#06C755]/15 hover:bg-[#06C755]/25 border border-[#06C755]/30 hover:border-[#06C755] text-[#06C755] text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.035 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.646 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.573-3.844 2.573-5.293z"/>
              </svg>
              <span>LINE</span>
            </button>

            {/* Native Mobile Share */}
            {hasNativeShare ? (
              <button
                onClick={handleNativeShare}
                className="p-2.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 hover:border-purple-500 text-purple-300 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Share2 className="w-5 h-5" />
                <span>แชร์เพิ่มเติม</span>
              </button>
            ) : (
              <button
                onClick={handleCopyLink}
                className="p-2.5 rounded-xl bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Copy className="w-5 h-5" />
                <span>คัดลอกลิงก์</span>
              </button>
            )}
          </div>
        </div>

        {/* Feature Badges */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-[10px] text-zinc-400">
          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#131320] border border-[#212135]">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            OpenGraph 2.0 Ready
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#131320] border border-[#212135]">
            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
            Twitter Large Image Card
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#131320] border border-[#212135]">
            <CheckCircle2 className="w-3 h-3 text-purple-400" />
            Schema.org Product JSON-LD
          </span>
        </div>
      </div>
    </div>
  );
};
