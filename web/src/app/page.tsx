import { ShowcaseCard } from "@/components/ShowcaseCard";
import { VideoEmbed } from "@/components/VideoEmbed";
import { StripeMock } from "@/components/mocks/StripeMock";
import { LinearMock } from "@/components/mocks/LinearMock";
import { WebflowMock } from "@/components/mocks/WebflowMock";
import { FramerMock } from "@/components/mocks/FramerMock";
import { AllbirdsMock } from "@/components/mocks/AllbirdsMock";
import { FloatingIconsHeroMock } from "@/components/mocks/FloatingIconsHeroMock";

function GitbuhIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const showcaseItems = [
  {
    siteName: "Stripe",
    strategy: "generic",
    description: "CSS animations, gradient meshes, hover states",
    imagePath: "/showcase/stripe.png",
    Mock: StripeMock,
  },
  {
    siteName: "Linear",
    strategy: "react",
    description: "Dynamic lists, status indicators, priority badges",
    imagePath: "/showcase/linear.png",
    Mock: LinearMock,
  },
  {
    siteName: "Webflow",
    strategy: "webflow",
    description: "IX2 interactions, scroll animations, entrance effects",
    imagePath: "/showcase/webflow.png",
    Mock: WebflowMock,
  },
  {
    siteName: "Framer",
    strategy: "framer",
    description: "Expert carousel, spring transitions, GSAP scroll-reveal",
    imagePath: "/showcase/framer.png",
    Mock: FramerMock,
  },
  {
    siteName: "Allbirds",
    strategy: "shopify",
    description: "Product cards, variant selectors, image galleries",
    imagePath: "/showcase/allbirds.png",
    Mock: AllbirdsMock,
  },
];

const steps = [
  {
    number: "1",
    title: "Hover",
    description: "Move your cursor over any element on any website.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
      </svg>
    ),
  },
  {
    number: "2",
    title: "Click",
    description: "Click the highlighted component to capture it.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Z" />
      </svg>
    ),
  },
  {
    number: "3",
    title: "Paste",
    description: "Production-ready HTML + CSS is on your clipboard.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
      </svg>
    ),
  },
];

const features = [
  {
    title: "17+ Framework Detection",
    description: "Auto-detects React, Vue, Angular, Svelte, Webflow, Framer, Shopify, WordPress, and more.",
  },
  {
    title: "Full Animation Fidelity",
    description: "Captures CSS transitions, @keyframes, and :hover/:active/:focus states exactly as they appear.",
  },
  {
    title: "GSAP Animation Recording",
    description: "Monkey-patches GSAP at document_start to record and replay timeline animations.",
  },
  {
    title: "React Fiber Tree Walking",
    description: "Walks the React fiber tree to extract Framer Motion props, spring physics, and variants.",
  },
  {
    title: "Webflow IX2 Interactions",
    description: "Captures Webflow IX2 scroll and entrance animations with full interaction data.",
  },
  {
    title: "Font & Pseudo-Element Extraction",
    description: "Embeds @font-face declarations and captures ::before/::after pseudo-element styles.",
  },
  {
    title: "Production-Ready Output",
    description: "Collapses shorthand properties, deduplicates styles, and cleans up browser defaults.",
  },
  {
    title: "Page-Load & Scroll Animations",
    description: "Refreshes the page and re-identifies elements to capture entrance and scroll-triggered animations.",
  },
];

const underTheHood = [
  {
    title: "Multi-World Architecture",
    description:
      "Isolated world for safe DOM inspection, main world for framework access, coordinated through a service worker message bus.",
  },
  {
    title: "Element Fingerprinting",
    description:
      "Generates stable fingerprints for DOM elements so they can be re-identified after page refresh for animation capture.",
  },
  {
    title: "GSAP Monkey-Patching",
    description:
      "Injects at document_start to intercept gsap.to/from/fromTo calls, recording all tween parameters before playback.",
  },
  {
    title: "Computed Style Diffing",
    description:
      "Diffs computed styles against browser defaults to emit only meaningful CSS declarations, not thousands of inherited values.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pablo-600/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Copy any UI component
            <br />
            <span className="bg-gradient-to-r from-pablo-400 to-pablo-600 bg-clip-text text-transparent">
              from the web
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-400">
            Hover over any element, click, and get production-ready HTML&nbsp;+
            CSS on your clipboard. Fonts, animations, and all.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://chromewebstore.google.com"
              className="inline-block rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-black transition-all hover:bg-zinc-200"
            >
              Install for Chrome
            </a>
            <a
              href="https://github.com/nicoreillmedia/pablo"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Gitbuh"
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 text-white transition-all hover:border-white/20 hover:bg-white/5"
            >
              <GitbuhIcon />
              <span className="sr-only">Gitbuh</span>
            </a>
          </div>
          <div className="mx-auto mt-12 max-w-2xl">
            <VideoEmbed />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-white/5 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              How it works
            </h2>
            <p className="mt-3 text-zinc-400">Three steps. No setup required.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-white/5 bg-zinc-900/60 p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pablo-600/20 text-sm font-bold text-pablo-400">
                    {step.number}
                  </span>
                  <span className="text-zinc-400">{step.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-white/5 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              What makes Pablo different
            </h2>
            <p className="mt-3 text-zinc-400">
              Not just screenshots — real, production-ready code.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/5 bg-zinc-900/60 p-6"
              >
                <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section className="border-t border-white/5 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              See what Pablo copies
            </h2>
            <p className="mt-3 text-zinc-400">
              These are actual Pablo outputs — live, interactive components.
              Original on the left, Pablo output on the right.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {showcaseItems.map(({ Mock, ...item }) => (
              <ShowcaseCard key={item.siteName} {...item}>
                <Mock />
              </ShowcaseCard>
            ))}
            <ShowcaseCard
              siteName="Floating Icons Hero"
              strategy="react"
              description="Framer Motion animations, spring physics, interactive repulsion"
              imagePath="/showcase/floating-icons-hero.png"
              lhsContent={<FloatingIconsHeroMock />}
            >
              <div className="flex flex-col items-center gap-3 text-zinc-600">
                <span className="text-sm font-medium">Copy result appears here</span>
              </div>
            </ShowcaseCard>
          </div>
        </div>
      </section>

      {/* Under the Hood */}
      <section id="under-the-hood" className="border-t border-white/5 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Under the hood
            </h2>
            <p className="mt-3 text-zinc-400">
              The technical details for the curious.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {underTheHood.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/5 bg-zinc-900/60 p-6"
              >
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-white/5 py-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pablo-600/8 blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Start copying components today
          </h2>
          <p className="mt-3 text-zinc-400">Free and open source.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://chromewebstore.google.com"
              className="inline-block rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-black transition-all hover:bg-zinc-200"
            >
              Install for Chrome
            </a>
            <a
              href="https://github.com/nicoreillmedia/pablo"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Gitbuh"
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 text-white transition-all hover:border-white/20 hover:bg-white/5"
            >
              <GitbuhIcon />
              <span className="sr-only">Gitbuh</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
