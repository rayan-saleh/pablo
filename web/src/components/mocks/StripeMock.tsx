"use client";

import { useState, useRef, useCallback } from "react";

export function StripeMock() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 200, y: -338 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      });
    },
    []
  );

  const barHeights = [
    0.047, 0.08, 0.154, 0.221, 0.315, 0.45, 0.248, 0.289, 0.128, 0.08,
    0.336, 0.289, 0.409, 0.523, 0.423, 0.758, 1.0, 0.53, 0.403, 0.268,
    0.336, 0.369, 0.322, 0.477, 0.591, 0.638, 0.745, 0.57, 0.45, 0.409,
  ];

  return (
    <div
      ref={cardRef}
      className="group relative select-none"
      style={{
        width: 240,
        height: 240,
        cursor: "pointer",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient border layer */}
      <div
        className="absolute inset-[-1px] overflow-hidden rounded-[6px] transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle at ${mousePos.x + 120}px ${mousePos.y + 120}px, rgba(127,125,252,0.6), rgba(244,75,204,0.4) 33%, rgba(229,237,245,0) 66%)`,
        }}
      />

      {/* Main white card */}
      <div className="absolute inset-0 overflow-hidden rounded-[5px] bg-white">
        {/* Title + expand icon */}
        <div className="relative z-10 flex items-start justify-between px-3.5 pt-3">
          <h3
            className="text-[13px] font-light leading-tight tracking-tight transition-transform duration-700"
            style={{
              color: "#061b31",
              transitionTimingFunction: "cubic-bezier(0.165, 0.84, 0.44, 1)",
              transform: isHovered
                ? "translateX(-2px) translateY(-3px)"
                : "none",
            }}
          >
            Enable any billing model
          </h3>
          <div
            className="flex h-5 w-5 items-center justify-center transition-transform duration-700"
            style={{
              transitionTimingFunction: "cubic-bezier(0.165, 0.84, 0.44, 1)",
              transform: isHovered
                ? "translateX(2px) translateY(-3px)"
                : "none",
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.75 6.75L10.25 6.75L10.25 5L15.5 5L15.5 10.25L13.75 10.25L13.75 6.75Z"
                fill="#061b31"
              />
              <path
                d="M6.75 10.25L5 10.25L5 15.5L10.25 15.5L10.25 13.75L6.75 13.75L6.75 10.25Z"
                fill="#061b31"
              />
            </svg>
          </div>
        </div>

        {/* Content area with background glows */}
        <div className="relative mt-1 flex flex-col items-center gap-2 px-3">
          {/* Background gradient blobs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute rounded-full opacity-[0.85]"
              style={{
                width: 180,
                height: 120,
                bottom: -30,
                left: "50%",
                transform: "translateX(-50%)",
                backgroundImage:
                  "radial-gradient(50% 50%, rgba(83,58,253,0.8) 62.5%, rgba(83,58,253,0) 100%)",
              }}
            />
            <div
              className="absolute rounded-full opacity-[0.85]"
              style={{
                width: 180,
                height: 110,
                bottom: 30,
                left: "50%",
                transform: "translateX(-50%)",
                backgroundImage:
                  "radial-gradient(50% 50%, rgba(243,99,243,0.8) 53.85%, rgba(243,99,243,0) 100%)",
              }}
            />
            <div
              className="absolute rounded-full opacity-[0.85]"
              style={{
                width: 180,
                height: 110,
                bottom: 80,
                left: "50%",
                transform: "translateX(-50%)",
                backgroundImage:
                  "radial-gradient(50% 50%, rgb(255,207,94) 41.35%, rgba(255,207,94,0) 100%)",
              }}
            />
            <div
              className="absolute"
              style={{
                width: 180,
                height: 90,
                bottom: 115,
                left: "50%",
                transform: "translateX(-50%)",
                backgroundImage:
                  "linear-gradient(rgb(255,255,255) 41.35%, rgba(255,255,255,0))",
              }}
            />
          </div>

          {/* Pro Plan card */}
          <div
            className="relative z-10 w-full rounded-[4px] bg-white"
            style={{
              boxShadow: "rgba(50,50,93,0.12) 0px 8px 16px 0px",
            }}
          >
            <div className="flex flex-col gap-1.5 p-2">
              {/* Plan header */}
              <div className="flex items-center gap-1.5">
                <div
                  className="flex h-5 w-5 items-center justify-center rounded"
                  style={{ border: "1px solid #e5edf5" }}
                >
                  <svg
                    width="10"
                    height="12"
                    viewBox="0 0 19 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="9.5"
                      cy="9.04"
                      r="2.1"
                      fill="rgb(127,125,252)"
                    />
                    <path
                      d="m5.24 14.83 8.11 5.21m2.18-7.12c-2.14 3.33-6.58 4.3-9.91 2.16-3.33-2.14-4.3-6.58-2.16-9.91C5.61 1.83 10.04.86 13.38 3c3.33 2.14 4.3 6.58 2.16 9.91Z"
                      stroke="rgb(127,125,252)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span
                    className="text-[8px] font-normal leading-tight"
                    style={{ color: "#061b31" }}
                  >
                    Pro Plan
                  </span>
                  <span
                    className="text-[7px] font-light leading-tight"
                    style={{ color: "#50617a" }}
                  >
                    Billed monthly
                  </span>
                </div>
              </div>

              {/* Tokens */}
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-[7px] font-normal leading-tight"
                  style={{ color: "#061b31" }}
                >
                  Tokens
                </span>
                <span
                  className="text-[6px] font-light leading-tight"
                  style={{ color: "#50617a" }}
                >
                  AED&nbsp;0.04 per 1,000 units
                </span>
              </div>

              {/* Usage meter */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-0.5">
                  <svg
                    width="7"
                    height="7"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M6 2.24c-2.45 0-4.44 1.99-4.44 4.44 0 .88.26 1.7.7 2.39h7.49c.44-.69.7-1.51.7-2.39 0-2.45-1.99-4.44-4.45-4.44M10.27 10.1c.75-.94 1.2-2.12 1.2-3.42 0-3.02-2.45-5.47-5.47-5.47S.53 3.66.53 6.68c0 1.29.45 2.48 1.2 3.42z"
                      fill="#50617a"
                    />
                    <path
                      d="M7.76 4.42a.5.5 0 0 1 .37-.14c.13 0 .27.05.37.16a.5.5 0 0 1 .16.38.5.5 0 0 1-.14.36l-2.45 2.63a.55.55 0 0 1-.49.21.55.55 0 0 1-.45-.19.55.55 0 0 1-.2-.47c0-.18.07-.35.21-.48z"
                      fill="#50617a"
                    />
                  </svg>
                  <span
                    className="text-[7px] font-normal"
                    style={{ color: "#273951" }}
                  >
                    Usage meter
                  </span>
                </div>
                <div
                  className="relative h-[6px] w-full overflow-hidden rounded-[3px]"
                  style={{ backgroundColor: "#f8fafd" }}
                >
                  <div
                    className="absolute left-[1px] top-[1px] h-[4px] overflow-hidden rounded-[2px]"
                    style={{ width: "82%" }}
                  >
                    <div
                      className="h-full w-full rounded-[2px]"
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, rgb(114,50,241) 3.13%, rgb(251,118,250) 50%, rgb(255,207,94))",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage chart card */}
          <div
            className="relative z-10 w-full rounded-[4px] bg-white"
            style={{
              boxShadow: "rgba(50,50,93,0.12) 0px 8px 16px 0px",
            }}
          >
            <div className="p-2">
              <div
                className="text-[6px] font-light leading-tight"
                style={{ color: "#50617a" }}
              >
                Tokens used in the last 30 days
              </div>
              <div
                className="mt-0.5 text-[7px] font-normal leading-tight"
                style={{ color: "#061b31", letterSpacing: "-0.02em" }}
              >
                1,990,847,618
              </div>
            </div>
            <div className="flex items-end justify-center gap-[1.5px] px-2 pb-2">
              {barHeights.map((h, i) => (
                <div
                  key={i}
                  className="rounded-[0.5px]"
                  style={{
                    width: 3,
                    height: 50,
                    backgroundColor: "rgb(127,125,252)",
                    transform: `scaleY(${h})`,
                    transformOrigin: "bottom",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
