import { ShowcaseCard } from "@/components/ShowcaseCard";
import { VideoEmbed } from "@/components/VideoEmbed";
import { StripeMock } from "@/components/mocks/StripeMock";
import { WebflowAddOnsMock } from "@/components/mocks/WebflowAddOnsMock";
import { FloatingIconsHeroMock } from "@/components/mocks/FloatingIconsHeroMock";
import { FloatingIconsHeroCopied } from "@/components/mocks/FloatingIconsHeroCopied";
import { DotTxtHeroMock } from "@/components/mocks/DotTxtHeroMock";
import { chromeWebStoreUrl, githubRepoUrl } from "@/lib/site";

function GitHubIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function ChromeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728Z" />
    </svg>
  );
}

const steps = [
  {
    number: "1",
    title: "Hover",
    description: "Move your cursor over any element on any website.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
      </svg>
    ),
  },
  {
    number: "2",
    title: "Click",
    description: "Click the highlighted component to capture it.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Z" />
      </svg>
    ),
  },
  {
    number: "3",
    title: "Paste",
    description: "HTML + CSS is on your clipboard.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-28">
        {/* Radial gradient accents */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[16%] bottom-[12%] h-[288px] w-[544px] rounded-full bg-[rgba(73,114,217,0.09)] blur-[80px]" />
          <div className="absolute right-[16%] top-[12%] h-[256px] w-[416px] rounded-full bg-[rgba(155,116,255,0.05)] blur-[80px]" />
        </div>

        <div className="mx-auto max-w-4xl px-6">
          <h1 className="text-[clamp(2.5rem,5vw,3.6rem)] font-semibold leading-[1.02] tracking-[-1.7px] text-[#f4f7fb]">
            Recreate any component from the web.
          </h1>
          <p className="mt-5 text-xl font-semibold leading-[1.5] text-[#c8ced8]">
            Hover. Click. Paste. Done.
          </p>
          <p className="mt-4 text-sm leading-6 text-[#a0a8b8]">
            Pablo grabs HTML&nbsp;+ CSS from any website and puts it on your
            clipboard. Fonts, animations, and all.
          </p>

          {/* Dashed separators */}
          <div className="mt-5 flex flex-col gap-2">
            <div className="dashed-separator w-[320px]" />
            <div className="dashed-separator w-[240px]" />
          </div>

          {/* CTA buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={chromeWebStoreUrl}
              className="group flex h-12 items-center gap-3 border border-white/[0.12] bg-gradient-to-r from-[#151923] to-[#0f1219] px-4 text-[13.4px] text-[#eef3ff] transition-all duration-200 hover:shadow-[0_0_24px_rgba(122,162,247,0.08)] hover:border-white/[0.18]"
              style={{
                backgroundImage: 'radial-gradient(256px 128px at 16% 50%, rgba(122, 162, 247, 0.14), transparent 78%), linear-gradient(#151923, #0f1219)',
              }}
            >
              <ChromeIcon className="h-4 w-4 text-[#7aa2f7]" />
              <span>Install</span>
            </a>
            <a
              href={githubRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center gap-2 border border-white/[0.12] px-4 text-[11.8px] text-[#a0a8b8] transition-all duration-150 hover:border-white/[0.2] hover:text-[#d9dee7]"
            >
              <GitHubIcon className="h-4 w-4" />
              <span>[view on github]</span>
            </a>
          </div>

          {/* Video embed */}
          <div className="mt-12">
            <VideoEmbed videoSrc="/demo.mp4" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-dashed border-white/[0.1] py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-[#d9dee7] tracking-[-0.5px]">
              + How it works
            </h2>
            <p className="mt-2 text-xs text-[#737c8d]">Three steps. No setup required.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="border border-dashed border-white/[0.13] bg-white/[0.01] p-5"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center bg-[#7aa2f7] text-[10px] font-bold text-[#070f1f]">
                    {step.number}
                  </span>
                  <span className="text-[#a0a8b8]">{step.icon}</span>
                </div>
                <h3 className="text-sm font-semibold text-[#eef2f8]">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-[#a0a8b8]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section className="border-t border-dashed border-white/[0.1] py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-[#d9dee7] tracking-[-0.5px]">
              + See what Pablo recreates
            </h2>
            <p className="mt-2 text-xs text-[#737c8d]">
              Actual Pablo outputs. Drag the slider to compare.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <ShowcaseCard
              siteName="Stripe"
              strategy="generic"
              description="CSS animations, gradient meshes, hover states"
              imagePath="/showcase/stripe.png"
              lhsContent={
                <div className="absolute inset-0 flex items-center justify-center bg-[#0b0d12] p-9">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/showcase/stripe.png"
                    alt="Stripe screenshot"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              }
            >
              <StripeMock />
            </ShowcaseCard>
            <ShowcaseCard
              siteName="Webflow"
              strategy="webflow"
              description="IX2 interactions, scroll animations, entrance effects"
              imagePath="/showcase/webflow-addons.png"
              lhsContent={
                <div className="absolute inset-0 flex items-center justify-center bg-[#0b0d12] p-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/showcase/webflow-addons.png"
                    alt="Webflow Add-ons screenshot"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              }
            >
              <WebflowAddOnsMock />
            </ShowcaseCard>
            <ShowcaseCard
              siteName=".txt"
              strategy="react"
              description="Pixel hero, terminal CLI demo, schema-contract popup"
              imagePath="/showcase/txt.png"
              lhsContent={
                <div className="absolute inset-0 flex items-center justify-center bg-[#0b0d12] p-9">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/showcase/txt.png"
                    alt=".txt screenshot"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              }
            >
              <DotTxtHeroMock />
            </ShowcaseCard>
            <ShowcaseCard
              siteName="Floating Icons Hero"
              strategy="react"
              description="Framer Motion animations, spring physics, interactive repulsion"
              imagePath="/showcase/floating-icons-hero.png"
              lhsContent={<FloatingIconsHeroMock />}
            >
              <FloatingIconsHeroCopied />
            </ShowcaseCard>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-dashed border-white/[0.1] py-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(73,114,217,0.06)] blur-[80px]" />
        </div>
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-xl font-semibold text-[#d9dee7] tracking-[-0.5px]">
            Start recreating components today
          </h2>
          <p className="mt-2 text-xs text-[#737c8d]">Free and open source.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={chromeWebStoreUrl}
              className="group flex h-12 items-center gap-3 border border-white/[0.12] bg-gradient-to-r from-[#151923] to-[#0f1219] px-4 text-[13.4px] text-[#eef3ff] transition-all duration-200 hover:shadow-[0_0_24px_rgba(122,162,247,0.08)] hover:border-white/[0.18]"
              style={{
                backgroundImage: 'radial-gradient(256px 128px at 16% 50%, rgba(122, 162, 247, 0.14), transparent 78%), linear-gradient(#151923, #0f1219)',
              }}
            >
              <ChromeIcon className="h-4 w-4 text-[#7aa2f7]" />
              <span>Install</span>
            </a>
            <a
              href={githubRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center gap-2 border border-white/[0.12] px-4 text-[11.8px] text-[#a0a8b8] transition-all duration-150 hover:border-white/[0.2] hover:text-[#d9dee7]"
            >
              <GitHubIcon className="h-4 w-4" />
              <span>[view on github]</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
