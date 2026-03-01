"use client";

import { useEffect, useState, useRef } from "react";

const SCRAMBLE_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+;:<>,.?/\"{}";

function useTextScramble(finalText: string, duration = 700, delay = 100) {
  const [display, setDisplay] = useState("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const chars = finalText.split("");
    const t0 = performance.now() + delay;
    let raf: number;

    const tick = () => {
      if (!mounted.current) return;
      const now = performance.now();
      const elapsed = now - t0;

      if (elapsed < 0) {
        setDisplay(
          chars
            .map((c) =>
              c === "\n" || c === " "
                ? c
                : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
            )
            .join("")
        );
        raf = requestAnimationFrame(tick);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const resolved = Math.floor(progress * chars.length);

      setDisplay(
        chars
          .map((c, i) => {
            if (i < resolved) return c;
            if (c === "\n" || c === " ") return c;
            return SCRAMBLE_CHARS[
              Math.floor(Math.random() * SCRAMBLE_CHARS.length)
            ];
          })
          .join("")
      );

      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      mounted.current = false;
      cancelAnimationFrame(raf);
    };
  }, [finalText, duration, delay]);

  return display;
}

export function DotTxtHeroMock() {
  const [entered, setEntered] = useState(false);

  const jsonText = `{
  "company": ".txt",
  "mission": "Make every LLM output machine-readable",
  "founded": 2023
}`;

  const scrambled = useTextScramble(jsonText, 700, 300);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative flex h-full w-full flex-col overflow-hidden border border-black/10 bg-[#f5f5f5] p-5 pb-3 pr-[16%] text-black sm:p-7 sm:pb-4">
      {/* Subtle radial gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_6%,rgba(218,178,194,0.25),transparent_32%),radial-gradient(circle_at_95%_92%,rgba(121,49,27,0.10),transparent_28%)]"
      />

      <div className="relative flex min-h-[36rem] flex-1 flex-col justify-between">
        {/* Top content */}
        <div>
          {/* Label row */}
          <div
            className="mb-5 flex items-center gap-2.5 transition-opacity duration-500"
            style={{ opacity: entered ? 1 : 0 }}
          >
            <span
              className="inline-flex h-[28px] w-[28px] shrink-0 items-center justify-center bg-[#f5f5f5] text-[12px] uppercase leading-none tracking-normal"
              style={{ fontFamily: "PPNeueMontrealMonoBook, monospace" }}
            >
              01
            </span>
            <span
              className="text-[12px] uppercase leading-none tracking-normal text-black/80"
              style={{ fontFamily: "PPNeueMontrealMonoBook, monospace" }}
            >
              The Industry Standard for structured outputs
            </span>
          </div>

          {/* Massive headline */}
          <h1
            className="mb-4 flex transition-opacity duration-700"
            style={{
              fontFamily: "neueBitBold, Impact, sans-serif",
              fontSize: "clamp(5rem, 14.5vw, 13rem)",
              fontWeight: 700,
              lineHeight: 0.75,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              opacity: entered ? 1 : 0,
              transitionDelay: "100ms",
            }}
          >
            {/* "NO" column */}
            <div className="shrink-0 pr-[3%]">
              <span>No</span>
            </div>
            {/* "BAD" / "OUTPUTS" column */}
            <div className="flex flex-col">
              <span>Bad</span>
              <span>Outputs</span>
            </div>
          </h1>

          {/* JSON block + buttons */}
          <div className="flex flex-col gap-12">
            {/* JSON scramble text */}
            <pre
              className="max-w-[52ch] overflow-hidden text-[13px] leading-[1.32] text-black/90 transition-opacity duration-600 sm:text-[15px]"
              style={{
                fontFamily: "PPNeueMontrealMonoBook, monospace",
                whiteSpace: "pre-wrap",
                opacity: entered ? 1 : 0,
                transitionDelay: "250ms",
              }}
            >
              {scrambled}
              <span
                className="inline-block h-[1em] w-[0.55ch] bg-black align-[-0.1em]"
                style={{ animation: "dottxt-blink 0.8s linear infinite" }}
              />
            </pre>

            {/* CTA buttons */}
            <div
              className="flex flex-wrap gap-3 transition-opacity duration-500"
              style={{ opacity: entered ? 1 : 0, transitionDelay: "400ms" }}
            >
              <a
                href="#"
                className="inline-flex items-center justify-between gap-3 border border-black bg-black px-2 py-2 text-[11px] leading-[1] text-white transition-colors hover:bg-[#1a1a1a]"
                style={{ fontFamily: "PPNeueMontrealMonoBook, monospace" }}
              >
                <span className="whitespace-nowrap uppercase">
                  Explore our solutions
                </span>
                <span
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center bg-[#ddb8ca] text-[11px] uppercase text-black"
                  style={{ fontFamily: "PPNeueMontrealMonoBook, monospace" }}
                >
                  S
                </span>
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-between gap-3 border border-black bg-black px-2 py-2 text-[11px] leading-[1] text-white transition-colors hover:bg-[#1a1a1a]"
                style={{ fontFamily: "PPNeueMontrealMonoBook, monospace" }}
              >
                <span className="whitespace-nowrap uppercase">
                  Get support
                </span>
                <span
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center bg-[#79311b] text-[11px] uppercase text-white"
                  style={{ fontFamily: "PPNeueMontrealMonoBook, monospace" }}
                >
                  H
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom right-aligned section */}
        <div
          className="ml-auto max-w-[28rem] text-right transition-opacity duration-700"
          style={{ opacity: entered ? 1 : 0, transitionDelay: "500ms" }}
        >
          <p
            className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-black/50 sm:text-[11px]"
            style={{ fontFamily: "PPNeueMontrealMonoBook, monospace" }}
          >
            AI Engineering
          </p>
          <h3
            className="text-xl leading-tight sm:text-[28px] sm:leading-[1.15]"
            style={{ fontFamily: "PPNeueMontrealBook, sans-serif", fontWeight: 350 }}
          >
            Deploy agents with confidence
          </h3>
        </div>
      </div>
    </section>
  );
}
