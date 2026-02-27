import type { TechStack } from '../shared/types';
import { MSG } from '../shared/messages';

export function detectStack(): TechStack {
  const result = detectStackInner();
  console.log('[Pablo] Detected tech stack:', result);
  return result;
}

/**
 * Async confirmation: asks the service worker to probe for React in the main world.
 * Returns true if React fiber keys are found on DOM elements.
 */
export function probeReactViaServiceWorker(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: MSG.PROBE_REACT }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(false);
        return;
      }
      resolve(response?.isReact === true);
    });
  });
}

function detectStackInner(): TechStack {
  // --- CMS / Builders (unique markers, most specific) ---

  // Shopify
  if (document.querySelector('div[id*="shopify-section-"]')) {
    return 'shopify';
  }

  // WordPress
  if (
    document.querySelector('meta[name="generator"][content^="WordPress"]') ||
    document.querySelector('link[href*="/wp-content/"]') ||
    document.querySelector('script[src*="/wp-includes/"]')
  ) {
    return 'wordpress';
  }

  // Webflow
  if (document.documentElement.hasAttribute('data-wf-site')) {
    return 'webflow';
  }

  // Framer
  if (
    document.querySelector('meta[name="generator"][content^="Framer"]') ||
    document.querySelector('[data-framer-hydrate-v2]')
  ) {
    return 'framer';
  }

  // Wix
  if (document.querySelector('meta[name="generator"][content*="Wix"]')) {
    return 'wix';
  }

  // Squarespace
  if (document.querySelector('meta[name="generator"][content*="Squarespace"]')) {
    return 'squarespace';
  }

  // --- Meta-frameworks (before parent frameworks) ---

  // Next.js
  if (document.getElementById('__next') || document.querySelector('script#__NEXT_DATA__')) {
    return 'nextjs';
  }

  // Gatsby
  if (document.getElementById('___gatsby')) {
    return 'gatsby';
  }

  // Remix
  if (
    document.querySelector('script[id="__remixContext"]') ||
    document.querySelector('link[href*="remix"]')
  ) {
    return 'remix';
  }

  // Nuxt
  if (document.getElementById('__nuxt') || document.querySelector('script[id="__NUXT_DATA__"]')) {
    return 'nuxt';
  }

  // SvelteKit
  if (document.querySelector('script[id="__sveltekit"]')) {
    return 'sveltekit';
  }

  // Astro
  if (document.querySelector('meta[name="generator"][content*="Astro"]')) {
    return 'astro';
  }

  // --- Parent frameworks ---

  // React — DOM-only heuristics that work from isolated world
  if (probeReactDOM()) {
    return 'react';
  }

  // Vue (scoped style attributes like data-v-*)
  if (hasVueMarkers()) {
    return 'vue';
  }

  // Angular
  if (
    document.querySelector('[ng-version]') ||
    hasAngularAttributes()
  ) {
    return 'angular';
  }

  // Svelte (class names containing svelte- hash)
  if (document.querySelector('[class*="svelte-"]')) {
    return 'svelte';
  }

  // Solid
  if (document.querySelector('script[id="_$HY_data"]')) {
    return 'solid';
  }

  return 'generic';
}

/**
 * DOM-only heuristics for React detection that work from the isolated world.
 * No inline scripts needed — checks attributes and asset patterns.
 */
function probeReactDOM(): boolean {
  // 1. [data-reactroot] attribute (classic React)
  if (document.querySelector('[data-reactroot]')) {
    return true;
  }

  // 2. Next.js asset paths (catches Next.js sites even without #__next)
  if (
    document.querySelector('script[src*="/_next/"]') ||
    document.querySelector('link[href*="/_next/"]')
  ) {
    return true;
  }

  // 3. CSS Modules class pattern: ComponentName_class__hash (common in React/Next.js builds)
  // e.g. HeroSection_hero__top__5T9rA
  const cssModulesPattern = /^[A-Z][a-zA-Z]+_[a-zA-Z]+__[a-zA-Z0-9]{5,}$/;
  const sampleElements = document.querySelectorAll('body *[class]');
  const toCheck = Array.from(sampleElements).slice(0, 100);
  for (const el of toCheck) {
    const classes = el.className;
    if (typeof classes !== 'string') continue;
    for (const cls of classes.split(/\s+/)) {
      if (cssModulesPattern.test(cls)) {
        return true;
      }
    }
  }

  return false;
}

function hasVueMarkers(): boolean {
  const el = document.querySelector('body > *');
  if (!el) return false;
  const all = [el, ...Array.from(el.querySelectorAll('*')).slice(0, 50)];
  return all.some((node) =>
    Array.from(node.attributes).some((attr) => /^data-v-[a-f0-9]+$/.test(attr.name))
  );
}

function hasAngularAttributes(): boolean {
  const el = document.querySelector('body > *');
  if (!el) return false;
  const all = [el, ...Array.from(el.querySelectorAll('*')).slice(0, 50)];
  return all.some((node) =>
    Array.from(node.attributes).some((attr) =>
      attr.name.startsWith('_nghost-') || attr.name.startsWith('_ngcontent-')
    )
  );
}
