"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Icon SVGs (inlined so this component is fully self-contained)     */
/* ------------------------------------------------------------------ */

const icons = [
  // Google
  {
    pos: "top-[10%] left-[10%]",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10">
        <path d="M21.9999 12.24C21.9999 11.4933 21.9333 10.76 21.8066 10.0533H12.3333V14.16H17.9533C17.7333 15.3467 17.0133 16.3733 15.9666 17.08V19.68H19.5266C21.1933 18.16 21.9999 15.4533 21.9999 12.24Z" fill="#4285F4" />
        <path d="M12.3333 22C15.2333 22 17.6866 21.0533 19.5266 19.68L15.9666 17.08C15.0199 17.7333 13.7933 18.16 12.3333 18.16C9.52659 18.16 7.14659 16.28 6.27992 13.84H2.59326V16.5133C4.38659 20.0267 8.05992 22 12.3333 22Z" fill="#34A853" />
        <path d="M6.2799 13.84C6.07324 13.2267 5.9599 12.58 5.9599 11.92C5.9599 11.26 6.07324 10.6133 6.2799 10L2.59326 7.32667C1.86659 8.78667 1.45326 10.32 1.45326 11.92C1.45326 13.52 1.86659 15.0533 2.59326 16.5133L6.2799 13.84Z" fill="#FBBC05" />
        <path d="M12.3333 5.68C13.8933 5.68 15.3133 6.22667 16.3866 7.24L19.6 4.02667C17.68 2.29333 15.2266 1.33333 12.3333 1.33333C8.05992 1.33333 4.38659 3.97333 2.59326 7.32667L6.27992 10C7.14659 7.56 9.52659 5.68 12.3333 5.68Z" fill="#EA4335" />
      </svg>
    ),
  },
  // Apple (Colon icon)
  {
    pos: "top-[20%] right-[8%]",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 md:w-[54px] md:h-[54px] text-[#f4f7fb]/80">
        <path d="M17.482 15.334C16.274 16.146 15.238 17.554 15.238 19.138C15.238 21.694 17.062 22.846 19.33 22.99C21.682 23.122 23.53 21.73 23.53 19.138C23.53 16.57 21.742 15.334 19.438 15.334C18.23 15.334 17.482 15.334 17.482 15.334ZM19.438 1.018C17.074 1.018 15.238 2.41 15.238 4.982C15.238 7.554 17.062 8.702 19.33 8.842C21.682 8.974 23.53 7.582 23.53 4.982C23.518 2.41 21.742 1.018 19.438 1.018Z" />
      </svg>
    ),
  },
  // Microsoft
  {
    pos: "top-[80%] left-[10%]",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10">
        <path d="M11.4 2H2v9.4h9.4V2Z" fill="#F25022" />
        <path d="M22 2h-9.4v9.4H22V2Z" fill="#7FBA00" />
        <path d="M11.4 12.6H2V22h9.4V12.6Z" fill="#00A4EF" />
        <path d="M22 12.6h-9.4V22H22V12.6Z" fill="#FFB900" />
      </svg>
    ),
  },
  // Figma
  {
    pos: "bottom-[10%] right-[10%]",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10">
        <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2z" fill="#2C2C2C" />
        <path d="M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5V7z" fill="#0ACF83" />
        <path d="M12 12a5 5 0 0 1-5-5 5 5 0 0 1 5-5v10z" fill="#A259FF" />
        <path d="M12 17a5 5 0 0 1-5-5h10a5 5 0 0 1-5 5z" fill="#F24E1E" />
        <path d="M7 12a5 5 0 0 1 5 5v-5H7z" fill="#FF7262" />
      </svg>
    ),
  },
  // GitHub
  {
    pos: "top-[5%] left-[30%]",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-[#f4f7fb]/80">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  // Slack
  {
    pos: "top-[5%] right-[30%]",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10">
        <path d="M8.5 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" fill="#36C5F0" />
        <path d="M9 15.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="#2EB67D" />
        <path d="M14 8.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" fill="#ECB22E" />
        <path d="M15.5 15a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" fill="#E01E5A" />
        <path d="M10 14h4v-1.5a1.5 1.5 0 0 0-1.5-1.5h-1a1.5 1.5 0 0 0-1.5 1.5V14Z" fill="#E01E5A" />
        <path d="M8.5 14a1.5 1.5 0 0 0 1.5 1.5h1.5v-1a1.5 1.5 0 0 0-1.5-1.5H8.5v1Z" fill="#ECB22E" />
        <path d="M15.5 10a1.5 1.5 0 0 0-1.5-1.5H12.5v4a1.5 1.5 0 0 0 1.5 1.5h1.5v-4Z" fill="#36C5F0" />
        <path d="M14 8.5a1.5 1.5 0 0 0-1.5-1.5h-1v4a1.5 1.5 0 0 0 1.5 1.5h1v-4Z" fill="#2EB67D" />
      </svg>
    ),
  },
  // Vercel
  {
    pos: "bottom-[8%] left-[25%]",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-[#f4f7fb]/90">
        <path d="M12 2L2 22h20L12 2z" />
      </svg>
    ),
  },
  // Stripe
  {
    pos: "top-[40%] left-[15%]",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10">
        <path d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12Z" fill="#635BFF" />
        <path d="M6 7H18V9H6V7Z" fill="white" />
        <path d="M6 11H18V13H6V11Z" fill="white" />
        <path d="M6 15H14V17H6V15Z" fill="white" />
      </svg>
    ),
  },
  // Discord
  {
    pos: "top-[75%] right-[25%]",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10">
        <path d="M20.317 4.482a1.88 1.88 0 0 0-1.635-.482C17.398 3.42 16.02 3 12 3s-5.398.42-6.682 1.001a1.88 1.88 0 0 0-1.635.483c-1.875 1.2-2.325 3.61-1.568 5.711 1.62 4.47 5.063 7.8 9.885 7.8s8.265-3.33 9.885-7.8c.757-2.1-.307-4.51-1.568-5.711ZM8.45 13.4c-.825 0-1.5-.75-1.5-1.65s.675-1.65 1.5-1.65c.825 0 1.5.75 1.5 1.65s-.675 1.65-1.5 1.65Zm7.1 0c-.825 0-1.5-.75-1.5-1.65s.675-1.65 1.5-1.65c.825 0 1.5.75 1.5 1.65s-.675 1.65-1.5 1.65Z" fill="#5865F2" />
      </svg>
    ),
  },
  // X / Twitter
  {
    pos: "top-[90%] left-[70%]",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-[#f4f7fb]/90">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231L18.244 2.25zM17.03 19.75h1.866L7.156 4.25H5.16l11.874 15.5z" />
      </svg>
    ),
  },
  // Notion (Pause icon)
  {
    pos: "top-[50%] right-[5%]",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-[#f4f7fb]/80">
        <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm.111 5.889h3.222v10.222h-3.222V7.889zm-4.333 0h3.222v10.222H7.778V7.889z" />
      </svg>
    ),
  },
  // Spotify
  {
    pos: "top-[55%] left-[5%]",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10">
        <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm4.125 14.175c-.188.3-.563.413-.863.225-2.437-1.5-5.5-1.725-9.15-1.012-.338.088-.675-.15-.763-.488-.088-.337.15-.675.488-.762 3.937-.787 7.287-.525 9.975 1.125.3.187.412.562.225.862zm.9-2.7c-.225.363-.675.488-1.037.263-2.7-1.65-6.825-2.1-9.975-1.162-.413.113-.825-.15-1-.562-.15-.413.15-.825.563-1 .362-.112 3.487-.975 6.6 1.312.362.225.487.675.262 1.038v.112zm.113-2.887c-3.225-1.875-8.55-2.025-11.512-1.125-.487.15-.975-.15-1.125-.637-.15-.488.15-.975.638-1.125 3.337-.975 9.15-.787 12.825 1.312.45.263.6.825.337 1.275-.263.45-.825.6-1.275.337v-.038z" fill="#1DB954" />
      </svg>
    ),
  },
  // Dropbox
  {
    pos: "top-[5%] left-[55%]",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10">
        <path d="M12 8l-6 4 6 4 6-4-6-4z" fill="#0061FF" />
        <path d="M6 12l6 4 6-4-6-4-6 4z" fill="#007BFF" />
        <path d="M12 16l6-4-6-4-6 4 6 4z" fill="#4DA3FF" />
        <path d="M18 12l-6-4-6 4 6 4 6-4z" fill="#0061FF" />
      </svg>
    ),
  },
  // Twitch
  {
    pos: "bottom-[5%] right-[45%]",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10">
        <path d="M2.149 0L.707 3.028v17.944h5.66v3.028h3.028l3.028-3.028h4.243l7.07-7.07V0H2.15zm19.799 13.434l-3.535 3.535h-4.95l-3.029 3.029v-3.03H5.14V1.414h16.808v12.02z" fill="#9146FF" />
        <path d="M15.53 5.303h2.12v6.36h-2.12v-6.36zm-4.95 0h2.12v6.36h-2.12v-6.36z" fill="#9146FF" />
      </svg>
    ),
  },
  // Linear
  {
    pos: "top-[25%] right-[20%]",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10">
        <defs>
          <linearGradient id="fih-linear-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5E5CE6" />
            <stop offset="100%" stopColor="#2C2C2C" />
          </linearGradient>
        </defs>
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-4 9h8v2H8v-2z" fill="url(#fih-linear-grad)" />
      </svg>
    ),
  },
  // YouTube
  {
    pos: "top-[60%] left-[30%]",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10">
        <path d="M21.582 6.186A2.482 2.482 0 0 0 19.82 4.42C18.1 4 12 4 12 4s-6.1 0-7.82.42c-.98.26-1.74.98-1.762 1.766C2 7.94 2 12 2 12s0 4.06.418 5.814c.022.786.782 1.506 1.762 1.766C6.1 20 12 20 12 20s6.1 0 7.82-.42c.98-.26 1.74-.98 1.762-1.766C22 16.06 22 12 22 12s0-4.06-.418-5.814zM9.75 15.5V8.5L15.75 12 9.75 15.5z" fill="#FF0000" />
      </svg>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Unique float durations per icon (deterministic, no Math.random)   */
/* ------------------------------------------------------------------ */
const floatDurations = [7, 8.2, 6.5, 9, 7.8, 8.6, 6.8, 9.4, 7.3, 8.1, 6.9, 9.2, 7.6, 8.4, 6.6, 9.1];

export function FloatingIconsHeroCopied() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [offsets, setOffsets] = useState<{ x: number; y: number }[]>(
    () => icons.map(() => ({ x: 0, y: 0 }))
  );

  // Track mouse for repulsion effect
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: -1000, y: -1000 });
  };

  // Repulsion physics via rAF
  useEffect(() => {
    let raf: number;
    const targets = icons.map(() => ({ x: 0, y: 0 }));
    const current = icons.map(() => ({ x: 0, y: 0 }));

    const tick = () => {
      iconRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.sqrt(
          (mousePos.x - cx) ** 2 + (mousePos.y - cy) ** 2
        );

        if (dist < 150) {
          const angle = Math.atan2(mousePos.y - cy, mousePos.x - cx);
          const force = (1 - dist / 150) * 50;
          targets[i] = { x: -Math.cos(angle) * force, y: -Math.sin(angle) * force };
        } else {
          targets[i] = { x: 0, y: 0 };
        }

        // Spring-like lerp
        current[i].x += (targets[i].x - current[i].x) * 0.12;
        current[i].y += (targets[i].y - current[i].y) * 0.12;
      });

      setOffsets(current.map((c) => ({ ...c })));
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mousePos]);

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full min-h-0 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#0a0b10" }}
    >
      <style>{`
        @keyframes fih-float {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-8px) translateX(6px) rotate(5deg); }
          50% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          75% { transform: translateY(8px) translateX(-6px) rotate(-5deg); }
        }
        @keyframes fih-entrance {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fih-fade-slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fih-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Floating icons layer */}
      <div className="absolute inset-0 w-full h-full">
        {icons.map((icon, i) => (
          <div
            key={i}
            ref={(el) => { iconRefs.current[i] = el; }}
            className={`absolute ${icon.pos}`}
            style={{
              animation: `fih-entrance 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${i * 80}ms both`,
              transform: `translate(${offsets[i].x}px, ${offsets[i].y}px)`,
            }}
          >
            <div
              className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 p-3 rounded-3xl border"
              style={{
                backgroundColor: "rgba(11, 13, 18, 0.8)",
                backdropFilter: "blur(12px)",
                borderColor: "rgba(255,255,255,0.1)",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                animation: `fih-float ${floatDurations[i]}s ease-in-out infinite`,
              }}
            >
              {icon.svg}
            </div>
          </div>
        ))}
      </div>

      {/* Center content */}
      <div
        className="relative z-10 text-center px-4"
        style={{ animation: "fih-fade-slide-up 0.6s ease both" }}
      >
        <h1
          className="text-5xl md:text-7xl font-bold tracking-tight"
          style={{
            backgroundImage: "linear-gradient(to bottom, #f4f7fb, rgba(244,247,251,0.7))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
            letterSpacing: "-1.8px",
          }}
        >
          A World of Innovation
        </h1>
        <p
          className="mt-6 max-w-xl mx-auto text-lg"
          style={{
            color: "#a0a8b8",
            lineHeight: "28px",
            animation: "fih-fade-in 0.8s ease 200ms both",
          }}
        >
          Explore a universe of possibilities with our platform, connecting you
          to the tools and technologies that shape the future.
        </p>
        <div
          className="mt-10"
          style={{ animation: "fih-fade-in 0.8s ease 400ms both" }}
        >
          <a
            href="#"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-8 py-6 text-base font-semibold transition-colors"
            style={{
              backgroundColor: "#7aa2f7",
              color: "#070f1f",
              boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
            }}
          >
            Join the Revolution
          </a>
        </div>
      </div>
    </section>
  );
}
