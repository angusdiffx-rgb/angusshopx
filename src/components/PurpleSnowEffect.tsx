import React, { useEffect, useRef } from 'react';

interface Snowflake {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  swaySpeed: number;
  swayOffset: number;
  swayWidth: number;
  rotation: number;
  rotSpeed: number;
  alpha: number;
  color: string;
  type: number; // 0: branched dendrite, 1: stellar crystal, 2: geometric star
}

// Elegant purple pastel palettes for authentic crystalline glow
const PURPLE_TONES = [
  'rgba(216, 180, 254, ', // Soft Lilac / Purple-300
  'rgba(192, 132, 252, ', // Lavender / Purple-400
  'rgba(233, 213, 255, ', // Icy Violet-White / Purple-200
  'rgba(168, 85, 247, ', // Radiant Violet / Purple-500
];

export const PurpleSnowEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Fixed count: exactly 10 snowflakes across the screen for an ultra-clean, minimal aesthetic
    const count = 10;
    const flakes: Snowflake[] = [];

    for (let i = 0; i < count; i++) {
      const tone = PURPLE_TONES[Math.floor(Math.random() * PURPLE_TONES.length)];
      // Flake size between 6px and 14px so crystalline arms are clearly visible
      const size = Math.random() < 0.35 
        ? Math.random() * 3 + 10 // medium-large crisp flake: 10px - 13px
        : Math.random() * 3.5 + 6; // small delicate flake: 6px - 9.5px

      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size,
        speedY: Math.random() * 0.45 + 0.28, // gentle, serene drift
        speedX: (Math.random() - 0.5) * 0.2,
        swaySpeed: Math.random() * 0.015 + 0.008,
        swayOffset: Math.random() * Math.PI * 2,
        swayWidth: Math.random() * 1.2 + 0.6,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.012, // slow, gentle spin
        alpha: Math.random() * 0.35 + 0.45, // clear, translucent (0.45 - 0.8)
        color: tone,
        type: Math.floor(Math.random() * 3),
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    let isTabVisible = !document.hidden;
    const handleVisibility = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let animationId: number;

    // Helper to draw true 6-arm hexagonal crystalline snowflake (เกล็ดหิมะ 6 แฉก)
    const drawSnowflake = (
      context: CanvasRenderingContext2D,
      size: number,
      type: number,
      strokeColor: string,
      alpha: number
    ) => {
      context.strokeStyle = `${strokeColor}${alpha})`;
      context.fillStyle = `${strokeColor}${alpha * 0.9})`;
      context.lineWidth = Math.max(0.85, size * 0.09);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.shadowColor = 'rgba(168, 85, 247, 0.5)';
      context.shadowBlur = Math.min(8, size * 0.6);

      // 6 symmetrical arms (60 degrees apart)
      for (let arm = 0; arm < 6; arm++) {
        context.save();
        context.rotate((Math.PI / 3) * arm);

        // Main arm line
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, -size);
        context.stroke();

        if (type === 0) {
          // Classic Branched Dendrite (เกล็ดหิมะกิ่งก้าน)
          // Outer branch pair
          const b1 = size * 0.62;
          const b1Len = size * 0.32;
          context.beginPath();
          context.moveTo(0, -b1);
          context.lineTo(-b1Len, -b1 - b1Len * 0.6);
          context.moveTo(0, -b1);
          context.lineTo(b1Len, -b1 - b1Len * 0.6);
          context.stroke();

          // Inner branch pair
          const b2 = size * 0.36;
          const b2Len = size * 0.22;
          context.beginPath();
          context.moveTo(0, -b2);
          context.lineTo(-b2Len, -b2 - b2Len * 0.5);
          context.moveTo(0, -b2);
          context.lineTo(b2Len, -b2 - b2Len * 0.5);
          context.stroke();

          // Small tip arrowhead
          const tip = size * 0.84;
          const tipLen = size * 0.16;
          context.beginPath();
          context.moveTo(0, -tip);
          context.lineTo(-tipLen, -tip - tipLen * 0.5);
          context.moveTo(0, -tip);
          context.lineTo(tipLen, -tip - tipLen * 0.5);
          context.stroke();
        } else if (type === 1) {
          // Stellar Crystal (เกล็ดหิมะดาวคริสตัล)
          const b = size * 0.52;
          const bLen = size * 0.28;
          context.beginPath();
          context.moveTo(0, -b);
          context.lineTo(-bLen, -b - bLen * 0.5);
          context.moveTo(0, -b);
          context.lineTo(bLen, -b - bLen * 0.5);
          context.stroke();

          // Tiny diamond tip
          context.beginPath();
          context.arc(0, -size, Math.max(0.8, size * 0.09), 0, Math.PI * 2);
          context.fill();
        } else {
          // Hexagonal Star (เกล็ดหิมะหกเหลี่ยม)
          const b = size * 0.48;
          const bLen = size * 0.24;
          context.beginPath();
          context.moveTo(0, -b);
          context.lineTo(-bLen, -b);
          context.moveTo(0, -b);
          context.lineTo(bLen, -b);
          context.stroke();

          // Small connecting hex webbing
          const r = size * 0.28;
          context.beginPath();
          context.arc(0, 0, r, 0, Math.PI * 2);
          context.stroke();
        }

        context.restore();
      }

      // Small center core
      context.beginPath();
      context.arc(0, 0, Math.max(0.9, size * 0.11), 0, Math.PI * 2);
      context.fill();
    };

    const render = () => {
      if (!isTabVisible) {
        animationId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];

        f.swayOffset += f.swaySpeed;
        const currentSway = Math.sin(f.swayOffset) * f.swayWidth;

        f.y += f.speedY;
        f.x += f.speedX + currentSway;
        f.rotation += f.rotSpeed;

        // Smooth wrap-around when leaving canvas
        if (f.y > height + 25) {
          f.y = -25;
          f.x = Math.random() * width;
        }
        if (f.x > width + 25) {
          f.x = -25;
        } else if (f.x < -25) {
          f.x = width + 25;
        }

        // Render snowflake at position with gentle rotation
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rotation);

        drawSnowflake(ctx, f.size, f.type, f.color, f.alpha);

        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-15 w-full h-full"
    />
  );
};
