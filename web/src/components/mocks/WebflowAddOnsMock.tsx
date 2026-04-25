"use client";

import { FlutedGlassCanvas } from "./FlutedGlassCanvas";

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 14 15"
      fill="none"
      className="h-3 w-3 shrink-0 text-neutral-500"
      aria-hidden="true"
    >
      <circle cx="7" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.1" />
      <path d="M7 7v3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="7" cy="4.8" r="0.7" fill="currentColor" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      className="h-2.5 w-2.5 shrink-0"
      aria-hidden="true"
    >
      <path
        d="M2.5 4.5l3.5 3.5 3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OptimizeIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M11 16h10M16 11v10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AnalyzeIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M5 23l6-7 4 3 8-11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.5" />
      <ellipse
        cx="16"
        cy="16"
        rx="5"
        ry="11"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M5 16h22" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

type Column = {
  Icon: React.ComponentType;
  title: string;
  description: string;
  price: string;
  priceSubtitle: string;
  cta: string;
  selectValue: string;
  selectLabel: string;
  features: string[];
};

const columns: Column[] = [
  {
    Icon: OptimizeIcon,
    title: "Optimize",
    description: "Maximize conversions from your site.",
    price: "299",
    priceSubtitle: "based on # of page views",
    cta: "Add Optimize",
    selectValue: "25,000",
    selectLabel: "page views/mo",
    features: [
      "Up to 5 concurrent optimizations",
      "A/B testing",
      "Personalization",
      "AI Optimize",
      "Audience insights",
      "Audience targeting",
    ],
  },
  {
    Icon: AnalyzeIcon,
    title: "Analyze",
    description: "Get actionable insights on your site performance.",
    price: "9",
    priceSubtitle: "based on # of sessions",
    cta: "Add Analyze",
    selectValue: "2,000",
    selectLabel: "sessions/mo",
    features: [
      "Auto-captured page views, sessions, and visitors",
      "Auto-captured click data",
      "Site analytics overview",
      "Page-level insights",
      "Share insights",
      "Integrations with consent management solutions",
    ],
  },
  {
    Icon: GlobeIcon,
    title: "Localization Essential",
    description: "Localize your site for audiences around the world.",
    price: "9",
    priceSubtitle: "based on # of locales",
    cta: "Add Localization",
    selectValue: "1",
    selectLabel: "locales added",
    features: [
      "Machine-powered translation",
      "CMS localization",
      "Static page localization",
      "Localized SEO",
      "Style localization",
    ],
  },
  {
    Icon: GlobeIcon,
    title: "Localization Advanced",
    description: "Extend to more locales and content capabilities.",
    price: "29",
    priceSubtitle: "based on # of locales",
    cta: "Add Localization",
    selectValue: "1",
    selectLabel: "locales added",
    features: [
      "Machine-powered translation",
      "CMS localization",
      "Static page localization",
      "Localized SEO",
      "Style localization",
      "Asset localization",
      "Localize URLs",
      "Automatic visitor routing",
    ],
  },
];

export function WebflowAddOnsMock() {
  return (
    <div
      className="w-full max-w-[760px] origin-center scale-[0.78] overflow-hidden rounded-lg bg-[#171717] text-white"
      style={{
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 text-center">
        <h3 className="text-2xl font-semibold leading-tight tracking-tight">
          Add-ons
        </h3>
        <p className="mt-1 text-xs leading-snug text-white">
          Add-ons help you do more with your site.
        </p>
      </div>

      {/* Tab toggle */}
      <div className="mx-auto mb-5 flex w-fit items-center gap-1 rounded-md bg-[#363636] p-1">
        <div className="rounded bg-[#080808] px-5 py-1.5 text-[11px] font-medium leading-none">
          For Site plans
        </div>
        <div className="px-5 py-1.5 text-[11px] font-medium leading-none">
          For Enterprise
        </div>
      </div>

      {/* Pricing grid */}
      <div className="grid grid-cols-4">
        {columns.map((c, idx) => (
          <div
            key={c.title}
            className={`flex flex-col border-y border-[#363636] ${
              idx === 0 ? "border-l" : ""
            } border-r`}
          >
            {/* Icon + title + desc */}
            <div className="flex min-h-[120px] flex-col gap-1.5 px-3 pt-4">
              <c.Icon />
              <h4 className="text-[15px] font-medium leading-tight">
                {c.title}
              </h4>
              <p className="text-[10px] leading-snug text-white">
                {c.description}
              </p>
            </div>

            {/* Price */}
            <div className="flex min-h-[60px] flex-col px-3 pt-3">
              <div className="flex items-end leading-none">
                <span className="text-[22px] font-semibold">${c.price}</span>
                <span className="ml-0.5 pb-0.5 text-[13px] font-semibold text-neutral-400">
                  /mo
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-snug text-neutral-400">
                {c.priceSubtitle}
              </p>
            </div>

            {/* CTA */}
            <div className="px-3 py-3">
              <div className="rounded bg-[#146EF5] px-3 py-2 text-center text-[11px] font-medium">
                {c.cta}
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-col gap-1.5 border-t border-[#363636] px-3 py-3">
              <div className="flex items-center justify-between gap-1 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="flex items-center gap-0.5 border-b border-white pb-px pr-0.5">
                    {c.selectValue}
                    <ChevronDown />
                  </span>
                  <span>{c.selectLabel}</span>
                </span>
                <InfoIcon />
              </div>
              {c.features.map((f) => (
                <div
                  key={f}
                  className="flex items-start justify-between gap-2 text-[10px] leading-snug"
                >
                  <span>{f}</span>
                  <span className="pt-0.5">
                    <InfoIcon />
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom callouts with animated canvas bg (fluted-glass style) */}
      <div className="relative min-h-[180px] overflow-hidden border border-[#363636] bg-[#080808]">
        <FlutedGlassCanvas />

        <div className="relative grid grid-cols-2">
          <div className="border-r border-[#363636] p-5">
            <OptimizeIcon />
            <h4 className="mt-2 text-[15px] font-medium leading-tight">
              Optimize for non-Webflow sites
            </h4>
            <p className="mt-1.5 text-[10px] leading-snug text-white">
              Use Webflow Optimize, no matter where your site lives. Connect
              with our sales team to learn about pricing.
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium underline underline-offset-2">
              Contact us <span aria-hidden="true">→</span>
            </p>
          </div>
          <div className="p-5">
            <GlobeIcon />
            <h4 className="mt-2 text-[15px] font-medium leading-tight">
              Preview Localization for free
            </h4>
            <p className="mt-1.5 text-[10px] leading-snug text-white">
              You can try out basic Localization functionality for free, no
              matter what plan you&rsquo;re on. Pay only when you&rsquo;re ready
              to publish.
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium underline underline-offset-2">
              Read more <span aria-hidden="true">→</span>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
