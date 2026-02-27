"use client";

function ExpertCard({
  name,
  location,
  color,
  delay,
}: {
  name: string;
  location: string;
  color: string;
  delay: string;
}) {
  return (
    <div
      className="animate-[fadeIn_0.8s_ease-out_both] flex w-[130px] flex-shrink-0 flex-col gap-1.5"
      style={{ animationDelay: delay }}
    >
      <div
        className="h-[100px] w-full rounded-lg"
        style={{ background: color }}
      />
      <div className="flex items-center gap-1.5">
        <div
          className="h-5 w-5 flex-shrink-0 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${color}, rgba(255,255,255,0.2))`,
          }}
        />
        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium leading-tight text-white">
            {name}
          </p>
          <p className="truncate text-[9px] leading-tight text-white/50">
            {location}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FramerMock() {
  return (
    <div className="flex w-full max-w-[320px] flex-col gap-4 rounded-xl bg-black p-5">
      {/* Header row */}
      <div className="flex items-end justify-between gap-3">
        <h2
          className="animate-[fadeIn_0.8s_ease-out_both] text-lg font-medium leading-[1em] tracking-tight text-white"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Get pro help from handpicked experts
        </h2>
        <div className="flex flex-shrink-0 items-center gap-1 animate-[fadeIn_0.8s_ease-out_0.2s_both]">
          <span className="whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[9px] font-medium text-black">
            Get matched
          </span>
          <span className="whitespace-nowrap rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-medium text-white">
            Find an Expert
          </span>
        </div>
      </div>

      {/* Expert carousel */}
      <div className="relative overflow-hidden rounded-lg">
        <div className="flex gap-2">
          <ExpertCard
            name="Trueform"
            location="Switzerland"
            color="linear-gradient(135deg, #6366f1, #8b5cf6)"
            delay="0.3s"
          />
          <ExpertCard
            name="Alex Aperios"
            location="United Kingdom"
            color="linear-gradient(135deg, #ec4899, #f43f5e)"
            delay="0.4s"
          />
          <ExpertCard
            name="Fabian Albert"
            location="United States"
            color="linear-gradient(135deg, #14b8a6, #06b6d4)"
            delay="0.5s"
          />
        </div>
      </div>

      {/* Pagination dots */}
      <div className="flex items-center justify-center gap-1.5 animate-[fadeIn_0.8s_ease-out_0.6s_both]">
        <div className="h-1 w-1 rounded-full bg-white" />
        <div className="h-1 w-1 rounded-full bg-white/40" />
      </div>
    </div>
  );
}
