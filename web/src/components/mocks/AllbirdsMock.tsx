export function AllbirdsMock() {
  return (
    <div className="w-56 overflow-hidden rounded-xl border border-white/5 bg-zinc-900 shadow-xl">
      {/* Image placeholder */}
      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-emerald-900/30 to-teal-900/30">
        <svg
          className="h-12 w-12 text-emerald-700/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
          />
        </svg>
      </div>

      <div className="p-4">
        <div className="mb-0.5 text-xs font-medium uppercase tracking-wider text-emerald-400/70">
          Bestseller
        </div>
        <h4 className="text-sm font-semibold text-white">Tree Runner</h4>
        <p className="mt-1 text-xs text-zinc-500">
          Light &amp; breezy, made with natural materials
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-bold text-white">$98</span>
          <div className="rounded-full bg-emerald-600/20 px-3 py-1 text-xs font-semibold text-emerald-400">
            Add to cart
          </div>
        </div>
      </div>
    </div>
  );
}
