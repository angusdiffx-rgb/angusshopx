import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { resolveBloxImageUrl } from '../data/bloxPresets';

interface BloxImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt?: string;
  productName?: string;
  className?: string;
}

export const BloxImage: React.FC<BloxImageProps> = ({
  src,
  alt = 'Blox Fruits Item',
  productName,
  className = 'w-full h-full object-contain',
  ...props
}) => {
  const resolved = resolveBloxImageUrl(src, productName || alt);
  const [currentSrc, setCurrentSrc] = useState<string>(resolved);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const nextUrl = resolveBloxImageUrl(src, productName || alt);
    setCurrentSrc(nextUrl);
    setHasError(false);
  }, [src, productName, alt]);

  const handleError = () => {
    // If it's not already kitsune, try local kitsune as fallback
    if (currentSrc !== '/images/blox/kitsune.png') {
      setCurrentSrc('/images/blox/kitsune.png');
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-[#0C0C14] border border-purple-500/20 rounded-xl p-2 text-purple-400 select-none ${className}`}>
        <Sparkles className="w-8 h-8 opacity-70 animate-pulse text-amber-400" />
        <span className="text-[10px] font-bold text-zinc-400 mt-1 text-center line-clamp-1 px-1">
          {productName || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
      {...props}
    />
  );
};
