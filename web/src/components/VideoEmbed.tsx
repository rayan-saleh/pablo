"use client";

export function VideoEmbed({ videoUrl }: { videoUrl?: string }) {
  if (videoUrl) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/60">
        <iframe
          src={videoUrl}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/60">
      <div className="flex flex-col items-center gap-4 text-zinc-500">
        <svg
          className="h-16 w-16"
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
        <span className="text-sm font-medium">Demo coming soon</span>
      </div>
    </div>
  );
}
