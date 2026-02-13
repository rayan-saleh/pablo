import type { TechStack } from '../shared/types';

export function detectStack(): TechStack {
  // Shopify
  if (
    (window as any).Shopify ||
    document.querySelector('div[id*="shopify-section-"]')
  ) {
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
  if (
    document.documentElement.hasAttribute('data-wf-site') ||
    (window as any).Webflow
  ) {
    return 'webflow';
  }

  // Framer
  if (
    document.querySelector('meta[name="generator"][content^="Framer"]') ||
    document.querySelector('[data-framer-hydrate-v2]')
  ) {
    return 'framer';
  }

  // React
  if (hasReactFiber() || document.getElementById('__next') || document.getElementById('___gatsby') || document.querySelector('[data-reactroot]')) {
    return 'react';
  }

  return 'generic';
}

function hasReactFiber(): boolean {
  const testEl = document.querySelector('body > *');
  if (!testEl) return false;
  return Object.keys(testEl).some((key) => key.startsWith('__reactFiber$'));
}
