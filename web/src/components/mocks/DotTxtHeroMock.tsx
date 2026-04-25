"use client";

import { useEffect, useMemo, useState } from "react";

const PIXEL_FONT = "'Silkscreen', 'Press Start 2P', monospace";
const MONO_FONT = "'IBM Plex Mono', ui-monospace, monospace";
const SANS_FONT = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";

const PINK = "#E8C9D9";
const SAGE = "#A6B4A3";
const MUSTARD = "#BD932F";

function NoiseSquare({ size = 88 }: { size?: number }) {
  const cells = useMemo(() => {
    const out: boolean[] = [];
    let seed = 4242;
    for (let i = 0; i < 22 * 22; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      out.push(seed / 233280 > 0.5);
    }
    return out;
  }, []);

  return (
    <div
      aria-hidden="true"
      className="grid border border-black bg-white"
      style={{
        width: size,
        height: size,
        gridTemplateColumns: "repeat(22, 1fr)",
        gridTemplateRows: "repeat(22, 1fr)",
      }}
    >
      {cells.map((on, i) => (
        <div key={i} className={on ? "bg-black" : "bg-white"} />
      ))}
    </div>
  );
}

function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ fontFamily: MONO_FONT, fontSize: 9 }}>
      <span className="border border-black bg-white px-1 py-[1px] text-[8px] leading-none">
        {num}
      </span>
      <span className="text-black/85 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function PixelArrow({ dir }: { dir: "left" | "right" }) {
  const transform = dir === "left" ? "scaleX(-1)" : undefined;
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-5 w-5"
      fill="currentColor"
      style={{ transform }}
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {/* arrow shaft */}
      <rect x="1" y="7" width="11" height="2" />
      {/* head */}
      <rect x="10" y="5" width="2" height="2" />
      <rect x="12" y="6" width="2" height="4" />
      <rect x="10" y="9" width="2" height="2" />
      {/* tail */}
      <rect x="0" y="6" width="1" height="4" />
    </svg>
  );
}

function PixelRocket() {
  // Simple monochrome pixel-art rocket built with rects.
  const px = 8;
  const cells: Array<[number, number]> = [];
  // body shape (rough rocket silhouette)
  const grid = [
    "....X....",
    "...X.X...",
    "...X.X...",
    "..X...X..",
    "..X.O.X..",
    "..X.O.X..",
    "..X...X..",
    ".X.....X.",
    ".X.....X.",
    "X.X...X.X",
    "X.X...X.X",
    "X..X.X..X",
    "...X.X...",
    "....X....",
  ];
  grid.forEach((row, y) => {
    row.split("").forEach((ch, x) => {
      if (ch !== ".") cells.push([x, y]);
    });
  });
  const w = grid[0].length;
  const h = grid.length;
  return (
    <svg
      viewBox={`0 0 ${w * px} ${h * px}`}
      className="h-[140px] w-[90px]"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {cells.map(([x, y], i) => {
        const ch = grid[y][x];
        return (
          <rect
            key={i}
            x={x * px}
            y={y * px}
            width={px}
            height={px}
            fill={ch === "O" ? "#F5E9D2" : "#F5E9D2"}
          />
        );
      })}
      {/* window darkening */}
      {grid.flatMap((row, y) =>
        row.split("").map((ch, x) =>
          ch === "O" ? (
            <rect
              key={`o-${x}-${y}`}
              x={x * px + 1}
              y={y * px + 1}
              width={px - 2}
              height={px - 2}
              fill="#000"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

function CardKey({ letter, color }: { letter: string; color: string }) {
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center border border-black text-[10px] font-bold uppercase"
      style={{ backgroundColor: color, fontFamily: MONO_FONT }}
    >
      {letter}
    </span>
  );
}

function ExternalArrow() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 9L9 3M9 3H4.5M9 3v4.5" strokeLinecap="square" />
    </svg>
  );
}

const SLIDER_TOTAL = 12;

export function DotTxtHeroMock() {
  const [progress, setProgress] = useState(2);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 60);
    const id = setInterval(() => {
      setProgress((p) => (p >= SLIDER_TOTAL ? 1 : p + 1));
    }, 1000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, []);

  return (
    <div
      className="w-full max-w-[840px] origin-center scale-[0.92] text-black"
      style={{ fontFamily: SANS_FONT, opacity: entered ? 1 : 0, transition: "opacity 500ms" }}
    >
      <div className="grid grid-cols-[1.55fr_1fr_148px] grid-rows-[200px_200px] gap-3">
        {/* TOP-LEFT: pink — api.dottxt.ai platform */}
        <div
          className="relative flex flex-col justify-between border border-black p-4"
          style={{ backgroundColor: PINK }}
        >
          <div className="flex items-start justify-between">
            <SectionLabel num="04" label="Products" />
            <span
              className="text-black"
              style={{ fontFamily: PIXEL_FONT, fontSize: 18, lineHeight: 1 }}
            >
              04.1
            </span>
          </div>
          <h2
            className="text-black"
            style={{
              fontFamily: SANS_FONT,
              fontSize: 34,
              fontWeight: 400,
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            api.dottxt.ai
            <br />
            platform
          </h2>
          <div className="flex justify-end">
            <button
              type="button"
              className="flex w-[140px] items-center justify-between border border-black bg-white px-2 py-1.5"
              style={{ fontFamily: MONO_FONT, fontSize: 10 }}
            >
              <span>Get Started</span>
              <span className="border border-black px-1 text-[9px]">1</span>
            </button>
          </div>
        </div>

        {/* TOP-MIDDLE: sage — interactive slider */}
        <div
          className="relative flex flex-col border border-black p-4"
          style={{ backgroundColor: SAGE }}
        >
          <div className="flex justify-end gap-2 text-black">
            <button
              type="button"
              aria-label="prev"
              className="border border-black bg-transparent p-1.5 hover:bg-black/5"
            >
              <PixelArrow dir="left" />
            </button>
            <button
              type="button"
              aria-label="next"
              className="border border-black bg-transparent p-1.5 hover:bg-black/5"
            >
              <PixelArrow dir="right" />
            </button>
          </div>

          <div className="flex-1" />

          {/* Numbered ticks */}
          <div className="mb-1 flex items-end justify-between" style={{ fontFamily: MONO_FONT, fontSize: 11 }}>
            <span>1</span>
            <span>2</span>
            <span>3</span>
          </div>

          {/* Segmented progress bar */}
          <div className="flex h-3 border border-black bg-white">
            {Array.from({ length: SLIDER_TOTAL }).map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-black last:border-r-0"
                style={{
                  backgroundColor: i < progress ? "#000" : "transparent",
                }}
              />
            ))}
          </div>
        </div>

        {/* RIGHT RAIL: 4 stacked cards spanning both rows */}
        <div className="row-span-2 flex flex-col gap-3">
          {/* QR / noise square card */}
          <div className="flex aspect-square items-center justify-center border border-black bg-white p-2">
            <NoiseSquare size={108} />
          </div>

          {/* Schema contract callout */}
          <div className="flex items-start gap-1.5 border border-black bg-white p-2">
            <p
              className="flex-1 leading-snug text-black"
              style={{ fontFamily: MONO_FONT, fontSize: 9 }}
            >
              Your schema is a contract. We enforce it.
            </p>
            <button
              type="button"
              aria-label="dismiss"
              className="flex h-3 w-3 shrink-0 items-center justify-center text-black/70"
            >
              <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M2 2l8 8M10 2l-8 8" />
              </svg>
            </button>
          </div>

          {/* Better results card */}
          <div className="border border-black bg-white p-2">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CardKey letter="S" color={MUSTARD} />
                <span className="text-[11px] font-semibold">Better results</span>
              </div>
              <ExternalArrow />
            </div>
            <p className="text-[9px] leading-snug text-black/80" style={{ fontFamily: MONO_FONT }}>
              We&rsquo;ll help you improve your schemas
            </p>
          </div>

          {/* Quickstart card */}
          <div className="border border-black bg-white p-2">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CardKey letter="D" color="#C4D0EE" />
                <span className="text-[11px] font-semibold">Quickstart</span>
              </div>
              <ExternalArrow />
            </div>
            <p className="text-[9px] leading-snug text-black/80" style={{ fontFamily: MONO_FONT }}>
              Structured outputs in 5 mins
            </p>
          </div>
        </div>

        {/* BOTTOM-LEFT: mustard — descriptive copy + icon row */}
        <div
          className="relative flex flex-col justify-between border border-black p-4"
          style={{ backgroundColor: MUSTARD }}
        >
          <p
            className="text-black"
            style={{ fontFamily: SANS_FONT, fontSize: 11.5, lineHeight: 1.4 }}
          >
            The fastest way to put .txt&apos;s structured generation into
            production. Access our latest constrained-decoding technology on a
            pay-per-token basis, powered by the newest open-source models.
            Guaranteed-valid outputs behind an API you can call today.
          </p>
          <div className="mt-3 flex items-center gap-4 text-black">
            {/* pencil */}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 21l4-1 11-11-3-3L4 17l-1 4z" strokeLinejoin="round" />
              <path d="M14 6l3 3" />
            </svg>
            {/* coffee */}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 9h11v6a4 4 0 01-4 4H9a4 4 0 01-4-4V9z" />
              <path d="M16 11h2a2 2 0 010 4h-2" />
              <path d="M8 6c0-1 1-1 1-2M11 6c0-1 1-1 1-2M14 6c0-1 1-1 1-2" strokeLinecap="round" />
            </svg>
            {/* cube */}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" strokeLinejoin="round" />
              <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
            </svg>
            {/* hourglass */}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 3h12M6 21h12" strokeLinecap="round" />
              <path d="M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" />
            </svg>
            {/* sparkles */}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 4l1.5 4L18 9.5 13.5 11 12 15l-1.5-4L6 9.5 10.5 8 12 4z" strokeLinejoin="round" />
              <path d="M19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8L16.5 18.5l1.8-.7L19 16z" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* BOTTOM-MIDDLE: black — pixel rocket */}
        <div className="relative flex items-center justify-center overflow-hidden border border-black bg-black">
          <PixelRocket />
        </div>
      </div>
    </div>
  );
}
