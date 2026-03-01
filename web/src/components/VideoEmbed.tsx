"use client";

export function VideoEmbed({ videoSrc = "/demo.mp4" }: { videoSrc?: string }) {
  if (videoSrc) {
    return (
      <div className="relative aspect-video w-full overflow-hidden border border-white/[0.11] bg-[#0b0b0f]">
        {/* Terminal header */}
        <div className="flex items-center gap-3 border-b border-white/[0.08] bg-gradient-to-r from-[#131722] to-[#10131b] px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-[9px] w-[9px] rounded-full bg-[#ff5f57] border border-black/25" />
            <span className="h-[9px] w-[9px] rounded-full bg-[#febc2e] border border-black/25" />
            <span className="h-[9px] w-[9px] rounded-full bg-[#28c840] border border-black/25" />
          </div>
          <span className="text-[12.2px] font-medium text-[#eef2f8]">pablo demo</span>
        </div>
        <video
          src={videoSrc}
          className="h-[calc(100%-42px)] w-full bg-black object-cover"
          autoPlay
          loop
          playsInline
          muted
        />
      </div>
    );
  }

  return (
    <div className="relative flex aspect-video w-full flex-col overflow-hidden border border-white/[0.11] bg-[#0b0b0f]">
      {/* Terminal header */}
      <div className="flex items-center gap-3 border-b border-white/[0.08] bg-gradient-to-r from-[#131722] to-[#10131b] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-[9px] w-[9px] rounded-full bg-[#ff5f57] border border-black/25" />
          <span className="h-[9px] w-[9px] rounded-full bg-[#febc2e] border border-black/25" />
          <span className="h-[9px] w-[9px] rounded-full bg-[#28c840] border border-black/25" />
        </div>
        <span className="text-[12.2px] font-medium text-[#eef2f8]">pablo demo</span>
      </div>
      <div className="flex flex-1 items-center justify-center bg-[#090b10]">
        <div className="flex flex-col items-center gap-4 text-[#737c8d]">
          <svg
            className="h-14 w-14"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z"
            />
          </svg>
          <span className="text-xs font-medium">Demo coming soon</span>
        </div>
      </div>
    </div>
  );
}
