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
          <svg className="h-7 w-6" viewBox="0 0 360 416" xmlns="http://www.w3.org/2000/svg">
            <g transform="scale(.351562 .351648)" fill="currentColor">
              <path d="m497.344 25.6627c13.829-1.0667 28.573.0127 42.368 1.296 69.443 6.4606 149.31 31.5859 203.803 76.3953 14.848 12.21 28.043 26.704 39.911 41.794 65.907 83.802 88.911 195.387 98.992 299.294 4.51 46.483 16.068 247.895-1.742 280.726-10.69 19.706-32.51 44.952-47.387 62.564-17.39 20.588-34.642 41.134-53.487 60.425-16.204 16.587-34.103 32.527-48.822 50.417 8.648-4.728 17.009-10.265 25.561-15.196 17.024-9.816 34.045-19.647 51.173-29.281 4.076-2.292 8.16-4.774 12.497-6.521 6.675 1.755 18.977 7.223 25.284 10.157 17.164 7.984 34.317 16.764 51.249 25.282 30.853 15.523 63.6 29.89 93.416 47.221-2.954 8.763-19.713 24.864-26.999 32.515-93.642 97.499-216.438 161.909-349.876 183.529-32.891 5.38-66.133 8.35-99.457 8.88-40.234-.73-80.35-4.6-119.984-11.56-118.468-20.92-228.43-75.45-316.7984-157.096-14.0777-13.022-41.1166-40.07-51.8441-55.408 28.3849-15.535 56.5229-29.564 85.4565-43.934 29.555-14.679 57.718-29.045 88.255-41.596 8.268 3.425 20.6 12.335 28.839 17.08 20.434 11.768 41.435 25.247 62.247 36.251-3.117-3.54-6.57-6.899-9.865-10.293-44.628-45.959-91.889-89.307-129.071-141.872-14.405-20.365-19.985-26.097-21.113-51.936-2.183-50.042-2.257-100.051-.235-150.116 5.482-142.985 20.1-302.171 118.057-414.892 18.972-21.823 42.298-39.0777 67.289-53.177 56.027-31.6085 118.365-47.4889 182.283-50.9483zm-71.761 905.8373c-18.339-17.286-38.635-35.64-56.677-52.565-89.928-84.357-142.4-164.927-143.562-291.681-.09-9.842-.812-23.983.314-33.82 7.567 7.873 14.583 16.493 22.043 24.436 25.748 27.414 56.718 52.969 96.382 53.347 7.957.076 13.987-.459 21.796-1.724 37.553-7.658 66.044-28.527 98.628-47.347 11.884-6.863 26.701-13.867 40.621-14.263 38.232.164 70.608 30.616 104.087 46.594 83.684 39.94 131.779.645 183.829-61.336 1.613 11.96-.032 34.792-.616 47.258-3.488 74.47-25.013 140.257-71.052 199.471-19.126 24.598-38.264 44.902-60.949 66.502-20.765 19.771-46.078 41.055-64.085 63.119 88.452-62.066 189.835-142.774 209.212-255.215 3.555-20.628 6.109-52.109 7.027-73.871 3.296-78.073-.809-177.81-46.113-244.557-16.126-23.761-42.99-43.323-71.37-47.949-9.97-1.625-19.93-1.567-30-.94-54.017 4.124-103.759 29.935-155.345 43.48-5.766 1.514-29.8-9.881-36.524-11.474-36.475-12.644-73.559-25.445-111.965-30.575-6.987-.934-14.443.069-21.11-.52-52.801-4.667-89.279 39.3-107.857 83.333-4.756 11.271-8.404 24.449-11.549 36.361-16.149 62.457-18.939 128.278-14.41 192.406 2.103 29.778 5.876 57.912 14.451 86.468 21.16 70.461 77.013 125.049 131.545 171.559 19.674 16.78 50.705 41.977 73.249 53.503z" />
            </g>
          </svg>
          <span className="text-lg font-bold tracking-tight">Pablo</span>
        </a>
        <div className="flex items-center gap-6">
          <a
            href="#how-it-works"
            className="hidden text-sm text-zinc-400 transition-colors hover:text-white sm:inline"
          >
            How it works
          </a>
          <a
            href="#features"
            className="hidden text-sm text-zinc-400 transition-colors hover:text-white sm:inline"
          >
            Features
          </a>
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
          <svg className="h-5 w-4" viewBox="0 0 360 416" xmlns="http://www.w3.org/2000/svg">
            <g transform="scale(.351562 .351648)" fill="currentColor">
              <path d="m497.344 25.6627c13.829-1.0667 28.573.0127 42.368 1.296 69.443 6.4606 149.31 31.5859 203.803 76.3953 14.848 12.21 28.043 26.704 39.911 41.794 65.907 83.802 88.911 195.387 98.992 299.294 4.51 46.483 16.068 247.895-1.742 280.726-10.69 19.706-32.51 44.952-47.387 62.564-17.39 20.588-34.642 41.134-53.487 60.425-16.204 16.587-34.103 32.527-48.822 50.417 8.648-4.728 17.009-10.265 25.561-15.196 17.024-9.816 34.045-19.647 51.173-29.281 4.076-2.292 8.16-4.774 12.497-6.521 6.675 1.755 18.977 7.223 25.284 10.157 17.164 7.984 34.317 16.764 51.249 25.282 30.853 15.523 63.6 29.89 93.416 47.221-2.954 8.763-19.713 24.864-26.999 32.515-93.642 97.499-216.438 161.909-349.876 183.529-32.891 5.38-66.133 8.35-99.457 8.88-40.234-.73-80.35-4.6-119.984-11.56-118.468-20.92-228.43-75.45-316.7984-157.096-14.0777-13.022-41.1166-40.07-51.8441-55.408 28.3849-15.535 56.5229-29.564 85.4565-43.934 29.555-14.679 57.718-29.045 88.255-41.596 8.268 3.425 20.6 12.335 28.839 17.08 20.434 11.768 41.435 25.247 62.247 36.251-3.117-3.54-6.57-6.899-9.865-10.293-44.628-45.959-91.889-89.307-129.071-141.872-14.405-20.365-19.985-26.097-21.113-51.936-2.183-50.042-2.257-100.051-.235-150.116 5.482-142.985 20.1-302.171 118.057-414.892 18.972-21.823 42.298-39.0777 67.289-53.177 56.027-31.6085 118.365-47.4889 182.283-50.9483z" />
            </g>
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
        <p className="text-zinc-600">
          Built by{" "}
          <a
            href="https://github.com/nicoreillmedia"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Nico Reill
          </a>
        </p>
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
