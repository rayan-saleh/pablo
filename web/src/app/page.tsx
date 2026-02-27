import { ShowcaseCard } from "@/components/ShowcaseCard";
import { StripeMock } from "@/components/mocks/StripeMock";
import { LinearMock } from "@/components/mocks/LinearMock";
import { WebflowMock } from "@/components/mocks/WebflowMock";
import { FramerMock } from "@/components/mocks/FramerMock";
import { AllbirdsMock } from "@/components/mocks/AllbirdsMock";

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
    description: "Motion transitions, gradient text, layout animations",
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
          <div className="mt-8">
            <a
              href="#"
              className="inline-block rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-black transition-all hover:bg-zinc-200"
            >
              Install for Chrome
            </a>
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
              Real sites, real components. Original on the left, Pablo output on
              the right.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {showcaseItems.map(({ Mock, ...item }) => (
              <ShowcaseCard key={item.siteName} {...item}>
                <Mock />
              </ShowcaseCard>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
