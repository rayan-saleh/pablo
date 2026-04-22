const barScales = [
  0.047, 0.081, 0.154, 0.221, 0.315, 0.45, 0.248, 0.289, 0.128, 0.081, 0.336,
  0.289, 0.409, 0.523, 0.423, 0.758, 1, 0.53, 0.403, 0.268, 0.336, 0.369,
  0.322, 0.477, 0.591, 0.638, 0.745, 0.57, 0.45, 0.409, 0.523,
];

export function StripeMock() {
  return (
    <div
      className="relative flex w-[340px] flex-col overflow-hidden rounded-md bg-white text-left"
      style={{ aspectRatio: "400 / 676" }}
    >
      {/* Corner gradient blob */}
      <div className="pointer-events-none absolute -right-24 -top-20 h-[340px] w-[340px] rounded-full opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(127,125,252) 0%, rgb(244,75,204) 33%, rgb(229,237,245) 66%)",
        }}
      />

      {/* Arrow icon top-right */}
      <div className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#061b31]">
          <path d="M13.75 6.75L10.25 6.75L10.25 5L15.5 5L15.5 10.25L13.75 10.25L13.75 6.75Z" fill="currentColor" />
          <path d="M6.75 10.25L5 10.25L5 15.5L10.25 15.5L10.25 13.75L6.75 13.75L6.75 10.25Z" fill="currentColor" />
        </svg>
      </div>

      {/* Title */}
      <div className="relative z-10 px-6 pt-6">
        <h3
          className="font-light tracking-[-0.3px] text-[#061b31]"
          style={{ fontSize: 22, lineHeight: "26px", fontFamily: "'SF Pro Display', sohne-var, system-ui, sans-serif" }}
        >
          Enable any billing model
        </h3>
      </div>

      {/* Graphic area with gradient mesh */}
      <div className="relative mt-8 flex-1 overflow-hidden">
        {/* Radial gradients backdrop */}
        <div
          className="pointer-events-none absolute -left-24 -right-24 -bottom-16 h-[520px] opacity-85"
          style={{
            backgroundImage:
              "radial-gradient(50% 50% at 50% 80%, rgba(83,58,253,0.55) 0%, rgba(83,58,253,0) 70%), radial-gradient(50% 50% at 50% 55%, rgba(243,99,243,0.55) 0%, rgba(243,99,243,0) 70%), radial-gradient(50% 50% at 50% 35%, rgba(255,207,94,0.5) 0%, rgba(255,207,94,0) 70%)",
          }}
        />
        {/* White fade top */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24"
          style={{ backgroundImage: "linear-gradient(rgb(255,255,255) 40%, rgba(255,255,255,0))" }}
        />

        <div className="relative flex flex-col items-center gap-3.5 px-6 pb-6">
          {/* Plan card */}
          <div className="w-[260px] rounded-md bg-white p-3.5 shadow-[0_16px_32px_rgba(50,50,93,0.12)]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#e5edf5]">
                <svg width="19" height="22" viewBox="0 0 19 22" fill="none" className="text-[#7f7dfc]">
                  <circle cx="9.49984" cy="9.03817" r="2.10572" fill="currentColor" />
                  <path
                    d="m5.24446 14.8277 8.11104 5.2102m2.1787-7.1237c-2.1407 3.3326-6.5777 4.2988-9.91026 2.1581-3.33257-2.1407-4.29876-6.57765-2.15807-9.91022C5.60657 1.82952 10.0435.863324 13.3761 3.00402c3.3326 2.1407 4.2987 6.57765 2.1581 9.91018Z"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[14px] text-[#061b31]">Pro Plan</span>
                <span className="text-[12px] font-light text-[#50617a]">Billed monthly</span>
              </div>
            </div>
            <div className="mt-3.5 flex flex-col gap-0.5">
              <div className="text-[12px] text-[#061b31]">Tokens</div>
              <div className="text-[11px] font-light text-[#50617a]">
                <span className="tabular-nums">$0.01</span> per <span className="tabular-nums">1,000</span> units
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#7f7dfc]">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.99999 2.24167c-2.45306 0-4.44166 1.98861-4.44166 4.44167 0 .8816.25594 1.70145.69807 2.39167h7.48719c.44211-.69022.69811-1.51007.69811-2.39167 0-2.45306-1.98864-4.44167-4.44171-4.44167M10.2677 10.1c.7502-.93588 1.199-2.12386 1.199-3.41666 0-3.01916-2.44755-5.46667-5.46671-5.46667-3.01915 0-5.466665 2.44751-5.466665 5.46667 0 1.2928.448758 2.48078 1.198995 3.41666z"
                    fill="currentColor"
                  />
                  <path
                    d="M7.76132 4.42004c.10393-.09677.23665-.14405.36869-.14236.13385.00171.26701.05373.3688.15552.10436.10436.15641.24169.15555.37894-.0008.12868-.0481.25728-.14238.35855l-2.44667 2.6279c-.13315.14301-.31448.21329-.49495.20995-.16437-.00304-.32802-.06716-.45388-.19301-.12934-.12934-.19347-.29861-.19312-.46755.00037-.17592.07066-.35149.21006-.48128z"
                    fill="currentColor"
                  />
                </svg>
                <span className="text-[12px] text-[#273951]">Usage meter</span>
              </div>
              <div className="relative h-3.5 w-full overflow-hidden rounded bg-[#f8fafd]">
                <div className="absolute inset-y-[2px] left-[2px] w-[68%] overflow-hidden rounded-sm">
                  <div
                    className="h-full w-full rounded-sm"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, rgb(114,50,241) 3%, rgb(251,118,250) 50%, rgb(255,207,94))",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Chart card */}
          <div className="w-[260px] rounded-md bg-white p-3.5 shadow-[0_16px_32px_rgba(50,50,93,0.12)]">
            <div className="text-[11px] font-light text-[#50617a]">
              Tokens used in the last <span className="tabular-nums">30</span> days
            </div>
            <div className="mt-0.5 text-[12px] tracking-[-0.4px] text-[#061b31] tabular-nums">
              1,940,877,992
            </div>
            <div className="mt-3 flex h-[120px] items-end justify-center gap-[2.5px]">
              {barScales.map((scale, i) => (
                <div
                  key={i}
                  className="w-[4px] rounded-[1px] bg-[#7f7dfc] origin-bottom"
                  style={{ height: "100%", transform: `scaleY(${scale})` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
