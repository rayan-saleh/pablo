"use client";

import { useCallback, useRef, useState } from "react";

export function ShowcaseCard({
  siteName,
  strategy,
  description,
  imagePath,
  lhsContent,
  children,
}: {
  siteName: string;
  strategy: string;
  description: string;
  imagePath: string;
  lhsContent?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [split, setSplit] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateSplit = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplit(Math.min(100, Math.max(0, pct)));
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updateSplit(e.clientX);
    },
    [updateSplit],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      updateSplit(e.clientX);
    },
    [updateSplit],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div className="overflow-hidden border border-white/[0.11] bg-[#0b0b0f]">
      {/* Terminal-style header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-gradient-to-r from-[#131722] to-[#10131b] px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Traffic light dots */}
          <div className="flex items-center gap-1.5">
            <span className="h-[9px] w-[9px] rounded-full bg-[#ff5f57] border border-black/25" />
            <span className="h-[9px] w-[9px] rounded-full bg-[#febc2e] border border-black/25" />
            <span className="h-[9px] w-[9px] rounded-full bg-[#28c840] border border-black/25" />
          </div>
          <h3 className="text-[12.2px] font-medium text-[#eef2f8]">{siteName}</h3>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[10px] text-[#737c8d] hidden sm:block">{description}</p>
          <span className="border border-dashed border-white/[0.13] bg-white/[0.01] px-2 py-0.5 text-[9.8px] font-medium text-[#a0a8b8]">
            {strategy}
          </span>
        </div>
      </div>

      {/* Slider area */}
      <div
        ref={containerRef}
        className="relative min-h-[40rem] select-none overflow-hidden"
      >
        {/* Copied layer (bottom — revealed as slider moves right) */}
        <div className="absolute inset-0 isolate">
          <span className="absolute right-3 top-3 z-10 border border-dashed border-[#7aa2f7]/30 bg-[#7aa2f7]/10 px-2 py-0.5 text-[9.3px] font-medium uppercase tracking-wider text-[#7aa2f7]">
            Copied with Pablo
          </span>
          <div className="flex h-full min-h-[40rem] items-center justify-center bg-[#090b10] p-6">
            {children}
          </div>
        </div>

        {/* Original layer (top — clipped to left portion) */}
        <div
          className="absolute inset-0 isolate"
          style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
        >
          <span className="absolute left-3 top-3 z-10 border border-dashed border-white/[0.13] bg-white/[0.02] px-2 py-0.5 text-[9.3px] font-medium uppercase tracking-wider text-[#737c8d]">
            Original
          </span>
          <div className="h-full bg-[#0b0d12]">
            {lhsContent ? (
              <div className="h-full w-full">{lhsContent}</div>
            ) : (
              <div className="min-h-[40rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePath}
                  alt={`${siteName} screenshot`}
                  className="h-full w-full object-cover object-top"
                />
              </div>
            )}
          </div>
        </div>

        {/* Slider handle */}
        <div
          className="absolute top-0 bottom-0 z-20 w-1 cursor-col-resize"
          style={{ left: `${split}%`, transform: "translateX(-50%)" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {/* Vertical line */}
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/20" />
          {/* Grab handle */}
          <div className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-white/[0.15] bg-[#131722]/90 backdrop-blur">
            <svg
              className="h-3.5 w-3.5 text-[#a0a8b8]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 9l-3 3 3 3m8-6l3 3-3 3"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
