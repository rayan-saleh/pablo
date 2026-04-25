<p align="center">
  <img src="./web/public/logo.png" width="96" alt="Pablo logo" />
</p>

# Pablo

Copy UI from the web.

Pablo is a Chrome extension that lets you hover an element, click it, and copy clean HTML + CSS to your clipboard.

[Watch demo](./web/public/demo.mp4) · [Chrome Web Store](https://chromewebstore.google.com) · [Website](https://getpablo.dev)

[![Pablo demo](./web/public/demo.gif)](./web/public/demo.mp4)

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

To publish a GitHub release artifact, push a matching tag such as `v0.2.0`.
The release workflow will verify that the tag matches `extension/public/manifest.json`,
then test, build, zip, and attach the extension package to the GitHub release.

## Chrome Web Store Assets

- Store screenshots live in `assets/chrome-web-store/screenshots/`
- Promo tiles and other listing art live in `assets/chrome-web-store/promotional/`
- Notes for the listing and asset naming live in `assets/chrome-web-store/README.md`

## License

[MIT](./LICENSE)
