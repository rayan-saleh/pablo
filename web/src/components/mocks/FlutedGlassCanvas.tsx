"use client";

import { useEffect, useRef } from "react";

type Blob = {
  x: number;
  y: number;
  r: number;
  color: [number, number, number];
  vx: number;
  vy: number;
  phase: number;
  speed: number;
};

const PALETTE: Array<[number, number, number]> = [
  [255, 110, 50], // orange
  [140, 80, 255], // violet
  [80, 60, 200], // indigo
  [255, 80, 140], // pink
];

export function FlutedGlassCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const blobs: Blob[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      blobs.length = 0;
      const count = 5;
      for (let i = 0; i < count; i++) {
        blobs.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.55 * Math.max(width, height) * (0.6 + Math.random() * 0.5),
          color: PALETTE[i % PALETTE.length],
          vx: (Math.random() - 0.5) * 0.0006,
          vy: (Math.random() - 0.5) * 0.0006,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0004 + Math.random() * 0.0006,
        });
      }
    };

    let noiseTile: ImageData | null = null;
    const buildNoise = () => {
      const size = 96;
      const off = document.createElement("canvas");
      off.width = size;
      off.height = size;
      const octx = off.getContext("2d");
      if (!octx) return;
      const img = octx.createImageData(size, size);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = 18; // low alpha
      }
      noiseTile = img;
    };

    let noisePattern: CanvasPattern | null = null;
    const buildPattern = () => {
      if (!noiseTile) return;
      const off = document.createElement("canvas");
      off.width = noiseTile.width;
      off.height = noiseTile.height;
      const octx = off.getContext("2d");
      if (!octx) return;
      octx.putImageData(noiseTile, 0, 0);
      noisePattern = ctx.createPattern(off, "repeat");
    };

    const start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) / 1000;

      // Base
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#080808";
      ctx.fillRect(0, 0, width, height);

      // Blobs in additive-ish blend for that bloom feel
      ctx.globalCompositeOperation = "screen";
      for (const b of blobs) {
        const ox = Math.cos(t * b.speed * 1000 + b.phase) * width * 0.18;
        const oy = Math.sin(t * b.speed * 1300 + b.phase * 1.3) * height * 0.6;
        const cx = b.x + ox;
        const cy = b.y + oy;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r);
        const [r, g, bl] = b.color;
        grad.addColorStop(0, `rgba(${r}, ${g}, ${bl}, 0.85)`);
        grad.addColorStop(0.45, `rgba(${r}, ${g}, ${bl}, 0.35)`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${bl}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // Soft darken vignette
      ctx.globalCompositeOperation = "multiply";
      const vg = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.2,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8,
      );
      vg.addColorStop(0, "rgba(255,255,255,1)");
      vg.addColorStop(1, "rgba(40,40,40,1)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, width, height);

      // Animated grain
      ctx.globalCompositeOperation = "overlay";
      if (noisePattern) {
        ctx.save();
        const tx = (t * 60) % 96;
        const ty = (t * 90) % 96;
        ctx.translate(-tx, -ty);
        ctx.fillStyle = noisePattern;
        ctx.fillRect(0, 0, width + 96, height + 96);
        ctx.restore();
      }

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(draw);
    };

    resize();
    buildNoise();
    buildPattern();
    raf = requestAnimationFrame(draw);

    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ filter: "blur(24px) saturate(1.15)" }}
    />
  );
}
