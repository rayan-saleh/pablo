"use client";

export function WebflowMock() {
  return (
    <div className="w-64 animate-[fadeSlideUp_0.6s_ease-out_both] rounded-xl border border-white/5 bg-zinc-900 p-6 shadow-xl">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pablo-500 to-pablo-700">
        <svg
          className="h-5 w-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          />
        </svg>
      </div>
      <h4 className="mb-2 text-base font-semibold text-white">
        Visual Interactions
      </h4>
      <p className="mb-4 text-sm leading-relaxed text-zinc-400">
        Scroll-triggered animations, hover transitions, and page-load effects
        captured faithfully.
      </p>
      <div className="flex items-center gap-1.5 text-sm font-medium text-pablo-400">
        Learn more
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
          />
        </svg>
      </div>
    </div>
  );
}
