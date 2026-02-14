import type { TechStack } from '../shared/types';

export function detectStack(): TechStack {
  const result = detectStackInner();
  console.log('[CC] Detected tech stack:', result);
  return result;
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

  // React (check fiber keys on DOM elements)
  if (hasReactFiber() || document.querySelector('[data-reactroot]')) {
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

function hasReactFiber(): boolean {
  const testEl = document.querySelector('body > *');
  if (!testEl) return false;
  return Object.keys(testEl).some((key) => key.startsWith('__reactFiber$'));
}

function hasVueMarkers(): boolean {
  // Vue scoped styles add data-v-XXXX attributes to elements
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
