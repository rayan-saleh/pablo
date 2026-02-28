"use client";

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

      {/* Before / After */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Original */}
        <div className="relative border-b border-white/5 md:border-b-0 md:border-r">
          <span className="absolute left-4 top-4 z-10 rounded-md bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Original
          </span>
          <div className="h-72 bg-zinc-950/50 overflow-hidden">
            {lhsContent ? (
              <div className="h-full w-full">
                {lhsContent}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-6">
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

        {/* Copied */}
        <div className="relative">
          <span className="absolute left-4 top-4 z-10 rounded-md bg-pablo-600/20 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-pablo-400">
            Copied with Pablo
          </span>
          <div className="flex h-72 items-center justify-center bg-zinc-950/30 p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
