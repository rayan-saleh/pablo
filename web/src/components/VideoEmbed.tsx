"use client";

export function VideoEmbed({ videoSrc = "/demo.mp4" }: { videoSrc?: string }) {
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
