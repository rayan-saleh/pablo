import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://getpablo.dev"),
  title: "Pablo — Copy any UI component from the web",
  description:
    "Pablo is a Chrome extension that lets you hover over any component, click, and get production-ready HTML + CSS on your clipboard. Fonts, animations, GSAP, Framer Motion, Webflow IX2, and more.",
  openGraph: {
    title: "Pablo — Copy any UI component from the web",
    description:
      "Hover over any element, click, and get production-ready HTML + CSS on your clipboard. Fonts, animations, and all.",
    url: "https://getpablo.dev",
    siteName: "Pablo",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pablo — Copy any UI component from the web",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pablo — Copy any UI component from the web",
    description:
      "Hover over any element, click, and get production-ready HTML + CSS on your clipboard.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

function GitbuhIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2.5">
          <svg className="h-7 w-7" viewBox="0 0 100 100" fill="currentColor">
            <path fill-rule="evenodd" d="M50 4C25 4 4 25 4 50s21 46 46 46 46-21 46-46S75 4 50 4zm0 7c21.5 0 39 17.5 39 39S71.5 89 50 89 11 71.5 11 50s17.5-39 39-39z"/>
            <rect x="48.5" y="16" width="3" height="62" rx="1.5"/>
            <circle cx="33" cy="42" r="7"/>
            <path d="M67 35l7 7-7 7-7-7z"/>
            <path d="M45 50l5 14 8-10z"/>
            <path d="M30 74q20 8 40 0-20 5-40 0z"/>
          </svg>
          <span className="text-lg font-bold tracking-tight">Pablo</span>
        </a>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/nicoreillmedia/pablo"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Gitbuh"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            <GitbuhIcon />
            <span className="sr-only">Gitbuh</span>
          </a>
          <a
            href="https://chromewebstore.google.com"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-zinc-200"
          >
            Install Extension
          </a>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5" viewBox="0 0 100 100" fill="currentColor">
            <path fill-rule="evenodd" d="M50 4C25 4 4 25 4 50s21 46 46 46 46-21 46-46S75 4 50 4zm0 7c21.5 0 39 17.5 39 39S71.5 89 50 89 11 71.5 11 50s17.5-39 39-39z"/>
            <rect x="48.5" y="16" width="3" height="62" rx="1.5"/>
            <circle cx="33" cy="42" r="7"/>
            <path d="M67 35l7 7-7 7-7-7z"/>
            <path d="M45 50l5 14 8-10z"/>
            <path d="M30 74q20 8 40 0-20 5-40 0z"/>
          </svg>
          <span className="font-semibold text-zinc-400">Pablo</span>
        </div>
        <p>Copy any UI component from the web. Built with care.</p>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/nicoreillmedia/pablo"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Gitbuh"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            <GitbuhIcon />
            <span className="sr-only">Gitbuh</span>
          </a>
          <a
            href="https://chromewebstore.google.com"
            className="transition-colors hover:text-zinc-300"
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
