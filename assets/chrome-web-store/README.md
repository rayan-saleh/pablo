# Chrome Web Store Assets

This folder is the source of truth for Pablo's Chrome Web Store listing assets.

## Suggested Layout

- `screenshots/`
  - Real product screenshots used in the store listing
  - Recommended naming:
    - `01-popup-ready.png`
    - `02-element-highlight.png`
    - `03-copied-output.png`
    - `04-full-page-mode.png`
- `promotional/`
  - Promo tiles, icon source files, and any store-specific artwork

## Why keep them here

- They stay versioned with the release workflow
- They are easy to review in pull requests
- They do not get bundled into the public website by default

## Release Habit

When you cut a release, update screenshots here if the UI changed enough that the listing should change too.
