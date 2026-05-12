# Chrome Web Store Listing

Canonical source of truth for the fields entered in the [Chrome Web Store dashboard](https://chrome.google.com/webstore/devconsole/). Keep this file in sync after every listing edit so we can diff the next change against a known-good baseline.

Live listing: https://chromewebstore.google.com/detail/pablo/bchhpiepnmnghliknoamagdpgonlpfbl

## Store Listing

### Title

`Pablo`

### Summary (short description, 132 char max)

> Copy any UI component from the web. Hover, click, get production-ready HTML + CSS with fonts, animations, GSAP & Framer Motion.

Source of truth: `extension/public/manifest.json` `description` field. If you change one, change both.

### Category

`Developer Tools`

### Language

`English (United States)`

### Detailed description

```
Pablo turns any website into a component library.

Hover any element, click once, and the full HTML + CSS lands on your clipboard, ready to paste into your editor, design tool, or AI coding agent.

WHAT PABLO CAPTURES
• Production-ready HTML structure (semantic, not flattened)
• Resolved CSS, including custom properties and computed styles
• Web fonts and @font-face declarations
• CSS animations and keyframes
• GSAP timelines and tweens
• Framer Motion variants and transitions
• Optional screenshot of the captured element for visual context

FRAMEWORK-AWARE
Pablo detects the stack behind the page (React, Next.js, Webflow, Framer, Shopify, WordPress) and picks the right extraction strategy. Webflow IX2 interactions, Framer Motion props, and React component boundaries are preserved rather than flattened to raw markup.

TWO CAPTURE MODES
• Component mode. Hover, click, copy a single element with its children.
• Page mode. Capture the full visible page content in one shot.

DESIGNED FOR THE AI WORKFLOW
The output is shaped for pasting directly into Claude, Cursor, ChatGPT, or any coding agent. Bundled context (HTML + CSS + fonts + animations + screenshot) gives the model everything it needs to recreate the component in your stack.

PRIVACY
Pablo runs entirely in your browser. Nothing is sent to a server. No telemetry, no account, no cloud capture. The only network calls are the ones the page itself makes.

OPEN SOURCE
MIT licensed. Source, issues, and roadmap at https://github.com/rayan-saleh/pablo
Website and demo at https://usepablo.dev
```

### Screenshots

Stored in `assets/chrome-web-store/screenshots/` at 1280×800:

1. `01-overview.png`: landing-page-style overview shot with the in-page copy bar visible.
2. `02-popup.png`: extension popup at current version, showing detected stack, mode toggle, capture screenshot toggle, and `start inspecting`.
3. `03-element-highlight.png`: overlay highlighting a single element on a real site (Stripe).
4. `04-copied-output.png`: focused shot of the in-page "Copy Screenshot / Copy Both / Copy Context" floating bar.
5. `05-full-page-mode.png`: `page` mode active.

### Promotional images

Stored in `assets/chrome-web-store/promotional/`:

- `small-promo-440x280.png`: small promo tile (required for category placement).
- `marquee-1400x560.png`: marquee tile (optional, for featuring).

## Privacy practices

### Single purpose

> Pablo captures the HTML, CSS, fonts, and animation context of an element or page that the user explicitly clicks, and copies it to the user's clipboard.

### Permission justifications

- **activeTab**: required so Pablo can read the DOM of the tab the user is currently looking at when they click the toolbar icon. Without it, Pablo cannot inspect the element the user wants to capture.
- **scripting**: required to inject the inspector overlay, element highlight, and extraction logic into the active tab on demand. Pablo does not inject any scripts until the user clicks "start inspecting".
- **clipboardWrite**: required to place the captured HTML + CSS bundle on the user's clipboard so they can paste it into their editor or AI tool.
- **storage**: required to remember small UI preferences across sessions (last mode used, "capture screenshot" toggle state). Nothing identifying or sensitive is stored.

### Host permissions

Pablo declares `http://*/*` and `https://*/*` in `content_scripts.matches`. This is required because the user must be able to capture components from any website they visit. The content script is registered passively; the inspector only runs once the user explicitly activates Pablo from the toolbar popup.

### Data handling

- Pablo does **not** transmit user data to any server.
- Pablo does **not** collect analytics, telemetry, or usage data.
- Pablo does **not** require an account.
- All extraction happens locally in the user's browser and ends at `navigator.clipboard.writeText`.

## Release habit

When cutting a release:

1. Bump `extension/public/manifest.json` and `extension/package.json` together.
2. If the popup, overlay, or output bar changed visibly, re-shoot the relevant screenshot under `screenshots/` at 1280×800.
3. If the short description in this file changes, mirror it into `extension/public/manifest.json` `description`.
4. Update the live listing in the CWS dashboard from this file, not the other way around.
