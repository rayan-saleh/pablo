"use client";

const positions = [
  { top: "5%", left: "5%", dur: 7.2, delay: 0 },
  { top: "8%", left: "32%", dur: 8.1, delay: 0.08 },
  { top: "3%", left: "58%", dur: 6.8, delay: 0.16 },
  { top: "12%", left: "82%", dur: 7.5, delay: 0.24 },
  { top: "28%", left: "2%", dur: 8.4, delay: 0.32 },
  { top: "25%", left: "26%", dur: 6.5, delay: 0.4 },
  { top: "32%", left: "64%", dur: 9.2, delay: 0.48 },
  { top: "30%", left: "88%", dur: 7.8, delay: 0.56 },
  { top: "52%", left: "6%", dur: 8.6, delay: 0.64 },
  { top: "48%", left: "36%", dur: 7.0, delay: 0.72 },
  { top: "55%", left: "62%", dur: 8.0, delay: 0.8 },
  { top: "50%", left: "84%", dur: 6.3, delay: 0.88 },
  { top: "72%", left: "4%", dur: 7.4, delay: 0.96 },
  { top: "75%", left: "30%", dur: 8.8, delay: 1.04 },
  { top: "70%", left: "56%", dur: 7.6, delay: 1.12 },
  { top: "78%", left: "80%", dur: 6.7, delay: 1.2 },
];

const amps = [
  [3,5,2],[5,7,3],[4,6,1.5],[6,4,4],[2,8,2],[5,3,3],[3,7,1],[4,5,4],
  [6,4,2],[2,8,3],[5,3,1.5],[3,7,4],[4,5,2],[6,4,3],[2,6,1],[5,5,3],
];
const rots = [-1,2,-2,1,-3,2,-1,3,-2,1,-3,2,-1,3,-2,1];

function buildCSS() {
  let css = `@keyframes _fe{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}`;
  for (let i = 0; i < 16; i++) {
    const [ax, ay, ar] = amps[i];
    const br = rots[i];
    const d = i % 2 === 0 ? 1 : -1;
    css += `@keyframes _f${i}{` +
      `0%,100%{transform:translate(0,0) rotate(${br}deg)}` +
      `25%{transform:translate(${d * ax}px,${-ay}px) rotate(${br + d * ar}deg)}` +
      `50%{transform:translate(${-d * ax * 0.7}px,${ay * 0.8}px) rotate(${br - d * ar * 0.5}deg)}` +
      `75%{transform:translate(${d * ax * 0.5}px,${-ay * 0.4}px) rotate(${br + d * ar * 0.8}deg)}}`;
  }
  return css;
}

const CSS = buildCSS();

function Google() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10">
      <path d="M22 12.24c0-.75-.07-1.48-.19-2.19h-9.47v4.11h5.62c-.22 1.19-.94 2.21-1.99 2.92v2.6h3.56c2.07-1.52 3.47-4.23 3.47-7.44z" fill="#4285F4"/>
      <path d="M12.33 22c2.9 0 5.35-.95 7.19-2.32l-3.56-2.6c-.95.65-2.17 1.08-3.63 1.08-2.81 0-5.19-1.88-6.05-4.32H2.59v2.67C4.39 20.03 8.06 22 12.33 22z" fill="#34A853"/>
      <path d="M6.28 13.84c-.2-.65-.32-1.34-.32-2.04s.12-1.39.32-2.04V7.09H2.59A10.5 10.5 0 001.48 12c0 1.6.4 3.13 1.11 4.51l3.69-2.67z" fill="#FBBC05"/>
      <path d="M12.33 5.68c1.56 0 2.98.55 4.05 1.56l3.21-3.21C17.68 2.29 15.23 1.33 12.33 1.33 8.06 1.33 4.39 3.97 2.59 7.33l3.69 2.67c.87-2.44 3.25-4.32 6.05-4.32z" fill="#EA4335"/>
    </svg>
  );
}

function Apple() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-foreground">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function Microsoft() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10">
      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
    </svg>
  );
}

function GitHub() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-foreground">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  );
}

function Figma() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10">
      <path d="M8 24c2.2 0 4-1.8 4-4v-4H8c-2.2 0-4 1.8-4 4s1.8 4 4 4z" fill="#0ACF83"/>
      <path d="M4 12c0-2.2 1.8-4 4-4h4v8H8c-2.2 0-4-1.8-4-4z" fill="#A259FF"/>
      <path d="M4 4c0-2.2 1.8-4 4-4h4v8H8C5.8 8 4 6.2 4 4z" fill="#F24E1E"/>
      <path d="M12 0h4c2.2 0 4 1.8 4 4s-1.8 4-4 4h-4V0z" fill="#FF7262"/>
      <path d="M20 12c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4 4 1.8 4 4z" fill="#1ABCFE"/>
    </svg>
  );
}

function Slack() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10">
      <path d="M5.04 15.17a2.53 2.53 0 01-2.52 2.52A2.53 2.53 0 010 15.17a2.53 2.53 0 012.52-2.52h2.52v2.52zm1.27 0a2.53 2.53 0 012.52-2.52 2.53 2.53 0 012.52 2.52v6.31A2.53 2.53 0 018.83 24a2.53 2.53 0 01-2.52-2.52v-6.31z" fill="#E01E5A"/>
      <path d="M8.83 5.04a2.53 2.53 0 01-2.52-2.52A2.53 2.53 0 018.83 0a2.53 2.53 0 012.52 2.52v2.52H8.83zm0 1.27a2.53 2.53 0 012.52 2.52 2.53 2.53 0 01-2.52 2.52H2.52A2.53 2.53 0 010 8.83a2.53 2.53 0 012.52-2.52h6.31z" fill="#36C5F0"/>
      <path d="M18.96 8.83a2.53 2.53 0 012.52-2.52A2.53 2.53 0 0124 8.83a2.53 2.53 0 01-2.52 2.52h-2.52V8.83zm-1.27 0a2.53 2.53 0 01-2.52 2.52 2.53 2.53 0 01-2.52-2.52V2.52A2.53 2.53 0 0115.17 0a2.53 2.53 0 012.52 2.52v6.31z" fill="#2EB67D"/>
      <path d="M15.17 18.96a2.53 2.53 0 012.52 2.52A2.53 2.53 0 0115.17 24a2.53 2.53 0 01-2.52-2.52v-2.52h2.52zm0-1.27a2.53 2.53 0 01-2.52-2.52 2.53 2.53 0 012.52-2.52h6.31A2.53 2.53 0 0124 15.17a2.53 2.53 0 01-2.52 2.52h-6.31z" fill="#ECB22E"/>
    </svg>
  );
}

function YouTube() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10">
      <path d="M21.58 6.19c-.23-.86-.91-1.54-1.76-1.77C18.1 4 12 4 12 4s-6.1 0-7.82.42c-.86.23-1.54.91-1.76 1.77C2 7.94 2 12 2 12s0 4.06.42 5.81c.22.86.9 1.54 1.76 1.77C5.9 20 12 20 12 20s6.1 0 7.82-.42c.86-.23 1.54-.91 1.76-1.77C22 16.06 22 12 22 12s0-4.06-.42-5.81zM9.75 15.5v-7l6 3.5-6 3.5z" fill="#FF0000"/>
    </svg>
  );
}

function Vercel() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-foreground">
      <path d="M12 2L2 19.5h20L12 2z"/>
    </svg>
  );
}

function Stripe() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-[#635BFF]">
      <path d="M13.98 9.15c-2.17-.81-3.36-1.43-3.36-2.41 0-.83.68-1.3 1.9-1.3 2.23 0 4.52.86 6.09 1.63l.89-5.49C18.25.98 15.7 0 12.17 0 9.67 0 7.59.65 6.1 1.87 4.56 3.15 3.76 5 3.76 7.22c0 4.04 2.47 5.76 6.48 7.22 2.58.92 3.44 1.57 3.44 2.58 0 .98-.84 1.55-2.35 1.55-1.88 0-4.97-.92-6.99-2.11l-.9 5.56C5.18 22.99 8.39 24 11.71 24c2.64 0 4.84-.62 6.33-1.81 1.66-1.31 2.52-3.24 2.52-5.73 0-4.13-2.52-5.85-6.59-7.31z"/>
    </svg>
  );
}

function Discord() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10">
      <path d="M20.32 4.37a19.8 19.8 0 00-4.89-1.52.07.07 0 00-.08.04c-.21.37-.44.86-.6 1.25a18.27 18.27 0 00-5.49 0 12.6 12.6 0 00-.62-1.25.08.08 0 00-.08-.04 19.74 19.74 0 00-4.88 1.52.07.07 0 00-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 00.03.05 19.9 19.9 0 005.99 3.03.08.08 0 00.09-.03c.46-.63.87-1.3 1.22-1.99a.08.08 0 00-.04-.1 13.1 13.1 0 01-1.87-.9.08.08 0 01-.01-.13c.13-.09.25-.2.37-.29a.07.07 0 01.08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 01.08.01c.12.1.25.2.37.29a.08.08 0 01-.01.13 12.3 12.3 0 01-1.87.89.08.08 0 00-.04.11c.36.7.77 1.36 1.22 1.99a.08.08 0 00.09.03 19.84 19.84 0 006-3.03.08.08 0 00.03-.05c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 00-.03-.03zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.15-1.08-2.15-2.42 0-1.33.95-2.42 2.15-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42z" fill="#5865F2"/>
    </svg>
  );
}

function XTwitter() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-foreground">
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24H16.17l-5.21-6.82L4.99 21.75H1.68l7.73-8.84L1.25 2.25H8.08l4.71 6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z"/>
    </svg>
  );
}

function Spotify() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.38-1.32 9.78-.68 13.44 1.62.36.18.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z" fill="#1DB954"/>
    </svg>
  );
}

function Notion() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-foreground">
      <path d="M4.46 4.21c.75.6 1.03.56 2.43.47l13.22-.8c.28 0 .05-.28-.05-.32L18.44 2.17c-.47-.37-.98-.7-2.05-.6L3.39 2.6c-.47.05-.56.28-.37.47l1.44 1.14zm.79 2.95v13.85c0 .75.37 1.03 1.21.98l14.52-.84c.84-.05.94-.56.94-1.17V6.15c0-.6-.23-.93-.75-.88l-15.18.88c-.56.05-.74.33-.74.89v.02zm14.34.42c.09.42 0 .84-.42.89l-.7.14v10.26c-.61.33-1.17.51-1.64.51-.75 0-.93-.23-1.49-.93l-4.58-7.19v6.95l1.45.33s0 .84-1.17.84l-3.22.19c-.09-.19 0-.65.33-.75l.84-.23V8.76l-1.17-.1c-.09-.42.14-1.03.75-1.07l3.45-.23 4.77 7.28V8.75l-1.22-.14c-.09-.51.28-.89.75-.93l3.22-.19z"/>
    </svg>
  );
}

function Dropbox() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10">
      <path d="M6 2l6 3.75L6 9.5 0 5.75 6 2zm12 0l6 3.75-6 3.75-6-3.75L18 2zM0 13.25L6 9.5l6 3.75L6 17 0 13.25zm18-3.75l6 3.75L18 17l-6-3.75 6-3.75zM6 18.25l6-3.75 6 3.75-6 3.75-6-3.75z" fill="#0061FF"/>
    </svg>
  );
}

function Linear() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-[#5E6AD2]">
      <path d="M3.36 6.3c-.1-.1-.27-.04-.28.1A9.99 9.99 0 0017.6 20.92c.14-.01.2-.18.1-.28L3.36 6.3zm-.82 4.35a.16.16 0 00-.27.12 10 10 0 0011.04 11.04.16.16 0 00.12-.27L2.54 10.65zm9.05-8.39a.16.16 0 00-.12.27l10 10a.16.16 0 00.27-.12A10 10 0 0011.59 2.26zm3.1.4c-.14.01-.2.18-.1.28l7.06 7.06c.1.1.27.04.28-.1a10.02 10.02 0 00-7.24-7.24z"/>
    </svg>
  );
}

function Twitch() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10">
      <path d="M11.57 4.71h1.72v5.14h-1.72zm4.71 0H18v5.14h-1.72zM6 0L1.71 4.29v15.43h5.15V24l4.28-4.29h3.43L22.29 12V0zm14.57 11.14l-3.43 3.43h-3.43l-3 3v-3H6.86V1.71h13.71z" fill="#9146FF"/>
    </svg>
  );
}

const ICONS = [
  Google, Apple, Microsoft, GitHub, Figma, Slack, YouTube, Vercel,
  Stripe, Discord, XTwitter, Spotify, Notion, Dropbox, Linear, Twitch,
];

export function FloatingIconsHeroCopy() {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#0a0b10", minHeight: 600 }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[16%] bottom-[12%] h-[200px] w-[350px] rounded-full bg-[rgba(73,114,217,0.07)] blur-[60px]" />
        <div className="absolute right-[16%] top-[12%] h-[180px] w-[300px] rounded-full bg-[rgba(155,116,255,0.04)] blur-[60px]" />
      </div>

      {positions.map((pos, i) => {
        const Icon = ICONS[i];
        return (
          <div key={i} className="absolute" style={{ top: pos.top, left: pos.left }}>
            <div style={{ animation: `_fe 0.6s cubic-bezier(0.22,1,0.36,1) ${pos.delay}s both` }}>
              <div style={{ animation: `_f${i} ${pos.dur}s ease-in-out infinite` }}>
                <div
                  className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-3xl border border-white/10 p-3"
                  style={{
                    background: "rgba(11,13,18,0.8)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1),0 8px 10px -6px rgba(0,0,0,0.1)",
                  }}
                >
                  <Icon />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 text-center pointer-events-none">
        <h2
          className="text-3xl md:text-4xl font-bold tracking-tight"
          style={{ color: "#f4f7fb", animation: "_fe 0.6s cubic-bezier(0.22,1,0.36,1) 0.2s both" }}
        >
          Build faster
        </h2>
        <p
          className="mt-3 text-sm md:text-base max-w-[280px]"
          style={{ color: "#a0a8b8", animation: "_fe 0.6s cubic-bezier(0.22,1,0.36,1) 0.4s both" }}
        >
          Ship beautiful products with the tools you love
        </p>
        <button
          className="mt-5 px-5 py-2.5 rounded-lg text-sm font-medium pointer-events-auto"
          style={{ background: "white", color: "#0a0b10", animation: "_fe 0.6s cubic-bezier(0.22,1,0.36,1) 0.6s both" }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
