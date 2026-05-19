<p align="center">
  <img src="./web/public/logo.png" width="96" alt="Pablo logo" />
</p>

# Pablo

Copy UI from the web.

Pablo is a Chrome extension that lets you hover an element, click it, and copy clean HTML + CSS to your clipboard.

[Watch demo](./web/public/demo.mp4) · [Chrome Web Store](https://chromewebstore.google.com/detail/pablo/bchhpiepnmnghliknoamagdpgonlpfbl) · [Website](https://usepablo.dev)

[![Pablo demo](./web/public/demo.gif)](./web/public/demo.mp4)

## How it works

Click the toolbar icon, hover any element, and click. Pablo reads the live DOM, computed CSS, web fonts, keyframes, GSAP timelines, and Framer Motion props, detects the site's stack (React, Next, Webflow, Framer, Shopify, WordPress), and copies a clean HTML + CSS bundle to your clipboard, ready to paste into your editor or AI agent.

Unlike DevTools "Copy outerHTML", the output is production-ready: resolved styles, fonts, and animations included, component structure preserved instead of flattened. Runs entirely in the browser. No servers, no account.

## Privacy

No network calls, no analytics, no account. Pablo reads the DOM, writes to your clipboard, and stops there.

- Manifest permissions: `activeTab`, `scripting`, `clipboardWrite`, `storage` ([manifest.json](./extension/public/manifest.json))
- Verify yourself: `grep -rE "fetch\(|XMLHttpRequest|sendBeacon|WebSocket" extension/src` returns only one match, a `fetch()` on a local `data:` URL ([background/main.ts](./extension/src/background/main.ts)) used to decode an in-memory screenshot. No remote endpoints.

## Install

```bash
pnpm install
pnpm build:ext
```

Then load `extension/dist` in `chrome://extensions` with Developer mode enabled.

## Develop

```bash
pnpm dev:ext
pnpm dev:web
```

## Release

```bash
pnpm release:ext
```

This creates `artifacts/pablo-extension-vX.Y.Z.zip` from `extension/dist`.

To publish a GitHub release artifact, push a matching tag such as `vX.Y.Z`.
The release workflow will verify that the tag matches `extension/public/manifest.json`,
then test, build, zip, and attach the extension package to the GitHub release.

## Chrome Web Store Assets

- Store screenshots live in `assets/chrome-web-store/screenshots/`
- Promo tiles and other listing art live in `assets/chrome-web-store/promotional/`
- Notes for the listing and asset naming live in `assets/chrome-web-store/README.md`

## Website Deploys

The website (`web/`) auto-deploys through Vercel's git integration.

- Pushes to `main` create a production deployment at [usepablo.dev](https://usepablo.dev)
- Pull requests to `main` get preview deployments
- Manual fallback: `cd web && vercel --prod --yes`

The custom domain `usepablo.dev` is configured in the Vercel project.

## License

[MIT](./LICENSE)
