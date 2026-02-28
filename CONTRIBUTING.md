# Contributing to Pablo

Thanks for your interest in contributing to Pablo! This guide will help you get up and running.

## Prerequisites

- **Node.js** 18+
- **pnpm** 8+
- **Chrome** (for testing the extension)

## Dev Setup

Clone the repo and install dependencies:

```bash
git clone https://github.com/<your-fork>/pablo.git
cd pablo
pnpm install
```

### Running in Development

Start the Chrome extension in dev/watch mode:

```bash
pnpm dev:ext
```

Start the website in dev mode:

```bash
pnpm dev:web
```

### Building

Build the Chrome extension:

```bash
pnpm build:ext
```

Build the website:

```bash
pnpm build:web
```

## Loading the Extension in Chrome

1. Run `pnpm build:ext` (or `pnpm dev:ext` for watch mode).
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `extension/dist` directory.
5. The Pablo extension icon should appear in your toolbar.

## PR Workflow

1. **Fork** the repository on GitHub.
2. **Create a branch** for your change:
   ```bash
   git checkout -b my-feature
   ```
3. **Make your changes** and commit them with a clear message.
4. **Push** your branch to your fork:
   ```bash
   git push origin my-feature
   ```
5. **Open a Pull Request** against the `main` branch of the upstream repo.

Please keep PRs focused on a single change. If you're fixing a bug and adding a feature, open separate PRs.

## Code Style

- **TypeScript** is used throughout the project.
- **Tailwind CSS** is used for styling in the `web/` package.
- Keep things simple -- avoid adding dependencies unless truly necessary.
- Follow the existing patterns in the codebase.
