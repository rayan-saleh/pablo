import type { Metadata } from "next";
import { githubRepoUrl, supportUrl, websiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy | Pablo",
  description:
    "Privacy policy for the Pablo Chrome extension, including what data is handled locally and what is stored.",
};

const sections = [
  {
    title: "What Pablo does",
    body: "Pablo is a Chrome extension that lets you inspect an element on a webpage and copy the resulting HTML and CSS to your clipboard. When screenshot capture is enabled, Pablo can also capture an image of the selected area to help you preserve visual context.",
  },
  {
    title: "What data the extension handles",
    body: "Pablo may access page content from the active tab so it can inspect the selected element, extract styling information, and build the copied output. If you turn on screenshot capture, Pablo may also capture a screenshot of the selected area. Pablo stores one local preference in Chrome storage: whether screenshot capture is enabled.",
  },
  {
    title: "How the data is used",
    body: "The data Pablo handles is used only to power the user-facing inspection and copy flow. The extracted output is written to your clipboard when you choose to copy it. The stored preference is used to remember your screenshot setting on your device.",
  },
  {
    title: "What Pablo does not do",
    body: "Pablo does not require an account, does not sell your data, and does not send inspected page content, copied output, or captured screenshots to developer-operated servers.",
  },
  {
    title: "Retention",
    body: "Pablo does not keep a remote history of the content you inspect. Any copied output remains wherever you paste or save it, and the local screenshot preference remains in Chrome storage until you change it or remove the extension.",
  },
];

export default function PrivacyPage() {
  return (
    <section className="py-20">
      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[#7aa2f7]">Privacy Policy</p>
          <h1 className="text-[clamp(2.1rem,5vw,3.25rem)] font-semibold leading-[1.03] tracking-[-1.3px] text-[#f4f7fb]">
            Pablo keeps the extraction flow local and straightforward.
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[#a0a8b8]">
            This policy applies to the Pablo Chrome extension available at{" "}
            <a className="text-[#d9dee7] underline decoration-white/20 underline-offset-4" href={websiteUrl}>
              {websiteUrl}
            </a>.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {sections.map((section) => (
            <article
              key={section.title}
              className="border border-dashed border-white/[0.13] bg-white/[0.02] p-6"
            >
              <h2 className="text-sm font-semibold text-[#eef2f8]">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#a0a8b8]">{section.body}</p>
            </article>
          ))}
        </div>

        <article className="border border-dashed border-white/[0.13] bg-white/[0.02] p-6">
          <h2 className="text-sm font-semibold text-[#eef2f8]">Contact</h2>
          <p className="mt-3 text-sm leading-6 text-[#a0a8b8]">
            If you have a privacy question, want to report an issue, or need help with the extension,
            open an issue on GitHub.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/[0.12] px-4 py-2 text-[#d9dee7] transition-all duration-150 hover:border-white/[0.2]"
            >
              Open GitHub issue
            </a>
            <a
              href={githubRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/[0.12] px-4 py-2 text-[#d9dee7] transition-all duration-150 hover:border-white/[0.2]"
            >
              View repository
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
