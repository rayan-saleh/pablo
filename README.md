<p align="center">
  <img src="extension/public/icons/logo.svg" width="80" alt="Pablo logo" />
</p>

<h1 align="center">Pablo</h1>

<p align="center">
  Copy any UI component from the web. Hover, click, clipboard.
</p>

<p align="center">
  <a href="https://chromewebstore.google.com">Chrome Web Store</a> ·
  <a href="https://getpablo.dev">Website</a> ·
  <a href="#contributing">Contributing</a>
</p>

---

<p align="center">
  <video src="web/public/demo.mp4" width="800" autoplay muted loop playsinline></video>
</p>

## What it does

Pablo is a Chrome extension that lets you hover over any element on any website, click it, and get production-ready HTML + CSS on your clipboard — fonts, animations, and all.

- **17+ framework detection** — React, Vue, Svelte, Webflow, Framer, Shopify, and more
- **Full animation capture** — CSS transitions, @keyframes, GSAP timelines, Framer Motion spring physics
- **Webflow IX2 interactions** — scroll and entrance animations with full interaction data
- **Font & pseudo-element extraction** — @font-face declarations, ::before/::after styles
- **Production-ready output** — shorthand collapsing, deduplication, browser-default cleanup
- **Page-load & scroll animations** — refreshes and re-identifies elements to capture entrance effects

## Install

**Chrome Web Store** (recommended):

[Install Pablo →](https://chromewebstore.google.com)

**Manual build:**

```bash
git clone https://github.com/nicoreillmedia/pablo.git
cd pablo
pnpm install
pnpm build:ext
```

Then load `extension/dist` as an unpacked extension in `chrome://extensions` (enable Developer mode).

## Development

```bash
pnpm install          # install all dependencies
pnpm dev:ext          # extension dev mode (hot reload)
pnpm dev:web          # landing page dev server
pnpm build:ext        # production extension build
pnpm build:web        # production website build
```

## License

[MIT](LICENSE)
