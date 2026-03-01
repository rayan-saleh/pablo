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
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/60">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{siteName}</h3>
          <p className="mt-0.5 text-sm text-zinc-400">{description}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-400">
          {strategy}
        </span>
      </div>

      {/* Slider area */}
      <div
        ref={containerRef}
        className="relative min-h-[40rem] select-none overflow-hidden"
      >
        {/* Copied layer (bottom — revealed as slider moves right) */}
        <div className="absolute inset-0">
          <span className="absolute right-4 top-4 z-10 rounded-md bg-pablo-600/20 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-pablo-400">
            Copied with Pablo
          </span>
          <div className="flex min-h-[40rem] items-center justify-center bg-zinc-950/30 p-6">
            {children}
          </div>
        </div>

        {/* Original layer (top — clipped to left portion) */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
        >
          <span className="absolute left-4 top-4 z-10 rounded-md bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Original
          </span>
          <div className="bg-zinc-950/50">
            {lhsContent ? (
              <div className="w-full">{lhsContent}</div>
            ) : (
              <div className="flex min-h-[40rem] items-center justify-center p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePath}
                  alt={`${siteName} screenshot`}
                  className="hidden max-h-full max-w-full rounded-lg object-contain"
                  onLoad={(e) => {
                    (e.target as HTMLImageElement).classList.remove("hidden");
                    (
                      (e.target as HTMLImageElement)
                        .nextElementSibling as HTMLElement
                    )?.classList.add("hidden");
                  }}
                />
                <div className="flex flex-col items-center gap-3 text-zinc-600">
                  <svg
                    className="h-10 w-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                    />
                  </svg>
                  <span className="text-sm font-medium">{siteName}</span>
                  <span className="text-xs">screenshot coming soon</span>
                </div>
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
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/30" />
          {/* Grab handle */}
          <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-zinc-800/90 backdrop-blur">
            <svg
              className="h-4 w-4 text-zinc-300"
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
