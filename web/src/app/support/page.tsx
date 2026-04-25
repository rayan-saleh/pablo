import type { Metadata } from "next";
import { githubRepoUrl, supportUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Support | Pablo",
  description:
    "Support resources for Pablo, including where to report issues and what information to include when something breaks.",
};

const troubleshootingItems = [
  "The URL of the page where the problem happened",
  "Whether you were in component mode or full-page mode",
  "Whether screenshot capture was enabled",
  "What you expected Pablo to copy versus what actually happened",
  "A screenshot or screen recording if the issue is visual",
];

export default function SupportPage() {
  return (
    <section className="py-20">
      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[#7aa2f7]">Support</p>
          <h1 className="text-[clamp(2.1rem,5vw,3.25rem)] font-semibold leading-[1.03] tracking-[-1.3px] text-[#f4f7fb]">
            Help, bug reports, and reviewer notes all live here.
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[#a0a8b8]">
            The fastest support path for Pablo is GitHub Issues. This page also works as the support
            URL for the Chrome Web Store listing.
          </p>
        </div>

        <article className="border border-dashed border-white/[0.13] bg-white/[0.02] p-6">
          <h2 className="text-sm font-semibold text-[#eef2f8]">Primary support channel</h2>
          <p className="mt-3 text-sm leading-6 text-[#a0a8b8]">
            Open a GitHub issue for bug reports, extraction regressions, broken sites, or feature
            requests. Issue templates are already enabled in this repository.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/[0.12] px-4 py-2 text-[#d9dee7] transition-all duration-150 hover:border-white/[0.2]"
            >
              Open issue
            </a>
            <a
              href={githubRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/[0.12] px-4 py-2 text-[#d9dee7] transition-all duration-150 hover:border-white/[0.2]"
            >
              View repo
            </a>
          </div>
        </article>

        <article className="border border-dashed border-white/[0.13] bg-white/[0.02] p-6">
          <h2 className="text-sm font-semibold text-[#eef2f8]">What to include in a report</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#a0a8b8]">
            {troubleshootingItems.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </article>

        <article className="border border-dashed border-white/[0.13] bg-white/[0.02] p-6">
          <h2 className="text-sm font-semibold text-[#eef2f8]">Chrome Web Store reviewer guidance</h2>
          <p className="mt-3 text-sm leading-6 text-[#a0a8b8]">
            If you are reviewing Pablo for store approval, open the extension popup, start
            inspecting, hover a component on the active page, and click it to generate the copied
            result. If screenshot capture is enabled, Pablo will also capture the selected area so
            the copied context can include a visual reference.
          </p>
        </article>
      </div>
    </section>
  );
}
