import type { Metadata } from "next";
import "./globals.css";
import { chromeWebStoreUrl, githubRepoUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL("https://usepablo.dev"),
  title: "Pablo. Recreate any UI component from the web.",
  description:
    "Pablo is a Chrome extension that lets you hover over any component, click, and get HTML + CSS on your clipboard. Fonts, animations, GSAP, Framer Motion, Webflow IX2, and more.",
  openGraph: {
    title: "Pablo. Recreate any UI component from the web.",
    description:
      "Hover over any element, click, and get HTML + CSS on your clipboard. Fonts, animations, and all.",
    url: "https://usepablo.dev",
    siteName: "Pablo",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pablo. Recreate any UI component from the web.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pablo. Recreate any UI component from the web.",
    description:
      "Hover over any element, click, and get HTML + CSS on your clipboard.",
    images: ["/og-image.png"],
  },
};

function GitHubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-[#0a0b10]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Pablo" className="h-6 w-6 object-contain" />
          <span className="text-[15px] font-semibold tracking-[-0.2px] text-[#f4f7fb] lowercase">Pablo</span>
        </a>
        <div className="flex items-center gap-2">
          <a
            href={chromeWebStoreUrl}
            className="flex h-[34px] items-center px-3.5 text-[11.8px] font-medium text-[#a0a8b8] border border-white/[0.12] bg-white/[0.01] transition-all duration-150 hover:border-white/[0.2] hover:text-[#d9dee7] hover:bg-white/[0.04]"
          >
            Install
          </a>
          <a
            href={githubRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[34px] items-center px-3.5 text-[11.8px] font-medium text-[#a0a8b8] border border-white/[0.12] bg-white/[0.01] transition-all duration-150 hover:border-white/[0.2] hover:text-[#d9dee7] hover:bg-white/[0.04]"
          >
            <GitHubIcon className="mr-1.5 h-3.5 w-3.5" />
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-dashed border-white/[0.1] py-10">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-6 text-xs text-[#a0a8b8]">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Pablo" className="h-4 w-4 object-contain" />
          <span className="font-semibold text-[#d9dee7] text-[13px]">pablo</span>
        </div>
        <p className="text-[#737c8d]">Recreate any UI component from the web.</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href="/privacy"
            className="flex h-[34px] items-center px-3.5 text-[11.8px] font-medium text-[#a0a8b8] border border-white/[0.12] bg-white/[0.01] transition-all duration-150 hover:border-white/[0.2] hover:text-[#d9dee7]"
          >
            Privacy
          </a>
          <a
            href={githubRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[34px] items-center px-3.5 text-[11.8px] font-medium text-[#a0a8b8] border border-white/[0.12] bg-white/[0.01] transition-all duration-150 hover:border-white/[0.2] hover:text-[#d9dee7]"
          >
            <GitHubIcon className="mr-1.5 h-3.5 w-3.5" />
            GitHub
          </a>
          <a
            href={chromeWebStoreUrl}
            className="flex h-[34px] items-center px-3.5 text-[11.8px] font-medium text-[#a0a8b8] border border-white/[0.12] bg-white/[0.01] transition-all duration-150 hover:border-white/[0.2] hover:text-[#d9dee7]"
          >
            Chrome Web Store
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Nav />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
