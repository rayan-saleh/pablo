import type { TechStack, StrategyKey, Strategy } from '../shared/types';
import { REACT_BASED_STACKS } from '../shared/types';
import { genericStrategy } from './strategies/generic';
import { shopifyStrategy } from './strategies/shopify';
import { wordpressStrategy } from './strategies/wordpress';
import { webflowStrategy } from './strategies/webflow';
import { framerStrategy } from './strategies/framer';
import { reactStrategy } from './strategies/react';

const VISUAL_PROPERTIES = [
  'display', 'position', 'top', 'right', 'bottom', 'left', 'float', 'z-index',
  'overflow', 'overflow-x', 'overflow-y',
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
  'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat',
  'color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
  'letter-spacing', 'text-align', 'text-decoration', 'text-transform', 'white-space',
  'opacity', 'visibility', 'cursor', 'box-shadow', 'text-shadow',
  'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
  'justify-content', 'align-items', 'align-self', 'gap',
  'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row',
  'transform', 'transition', 'box-sizing', 'object-fit',
  'animation-name', 'animation-duration', 'animation-timing-function',
  'animation-delay', 'animation-iteration-count', 'animation-direction',
  'animation-fill-mode', 'animation-play-state',
  'transition-property', 'transition-duration', 'transition-timing-function', 'transition-delay',
  'will-change',
];

const strategies: Record<StrategyKey, Strategy> = {
  generic: genericStrategy,
  shopify: shopifyStrategy,
  wordpress: wordpressStrategy,
  webflow: webflowStrategy,
  framer: framerStrategy,
  react: reactStrategy,
};

function getStrategyKey(stack: TechStack): StrategyKey {
  if (REACT_BASED_STACKS.has(stack)) return 'react';
  if (stack in strategies) return stack as StrategyKey;
  return 'generic';
}

export function getStrategy(stack: TechStack): Strategy {
  return strategies[getStrategyKey(stack)];
}

export function extractElement(element: Element, stack: TechStack): string {
  const strategyKey = getStrategyKey(stack);
  console.log('[CC] Extraction start:', element.tagName.toLowerCase(), 'strategy:', strategyKey);
  const strategy = getStrategy(stack);
  const target = strategy.expandSelection(element);
  const clone = target.cloneNode(true) as Element;

  // Walk original + clone in parallel, applying computed styles
  applyComputedStyles(target, clone);

  // Run strategy-specific cleanup
  strategy.cleanup(clone);

  // Strip class, id, data-* from all elements
  stripAttributes(clone);

  // Merge consecutive identical-style spans (e.g. per-character Framer spans)
  mergeAdjacentSpans(clone);

  const html = clone.outerHTML;
  console.log('[CC] Final HTML size:', html.length);

  return html;
}

// Cache of default computed styles per tag name, so we only create one
// reference element per tag type during extraction.
const defaultStyleCache = new Map<string, Map<string, string>>();

function getDefaultStyles(tagName: string): Map<string, string> {
  const cached = defaultStyleCache.get(tagName);
  if (cached) return cached;

  const ref = document.createElement(tagName);
  // Append off-screen so it gets real computed styles
  ref.style.position = 'absolute';
  ref.style.visibility = 'hidden';
  ref.style.pointerEvents = 'none';
  document.body.appendChild(ref);

  const computed = window.getComputedStyle(ref);
  const defaults = new Map<string, string>();
  for (const prop of VISUAL_PROPERTIES) {
    defaults.set(prop, computed.getPropertyValue(prop));
  }

  // Correct for the properties we manually set on the reference element —
  // otherwise real defaults (position:static, visibility:visible) appear as non-default
  defaults.set('position', 'static');
  defaults.set('visibility', 'visible');

  document.body.removeChild(ref);
  defaultStyleCache.set(tagName, defaults);
  return defaults;
}

function applyComputedStyles(original: Element, clone: Element): void {
  // Clear cache at the start of each extraction
  defaultStyleCache.clear();

  const origElements = [original, ...Array.from(original.querySelectorAll('*'))];
  const cloneElements = [clone, ...Array.from(clone.querySelectorAll('*'))];

  for (let i = 0; i < origElements.length; i++) {
    const origEl = origElements[i];
    const cloneEl = cloneElements[i];
    if (!origEl || !cloneEl) continue;

    // Skip computed style extraction for SVG child elements — they use
    // attributes (d, fill, viewBox, etc.) rather than CSS box-model properties.
    // Applying box-model styles to <path>, <rect>, etc. just adds noise.
    const isSvgChild = origEl.namespaceURI === 'http://www.w3.org/2000/svg' && origEl.tagName !== 'svg';
    if (isSvgChild) continue;

    const computed = window.getComputedStyle(origEl);
    const defaults = getDefaultStyles(origEl.tagName);
    const styles: string[] = [];
    const position = computed.getPropertyValue('position');

    for (const prop of VISUAL_PROPERTIES) {
      const value = computed.getPropertyValue(prop);
      if (!value) continue;

      // Skip if it matches the browser default for this element type
      const defaultValue = defaults.get(prop);
      if (value === defaultValue) continue;

      // top/right/bottom/left are irrelevant on statically positioned elements
      if (position === 'static' && (prop === 'top' || prop === 'right' || prop === 'bottom' || prop === 'left')) {
        continue;
      }

      // Skip z-index on statically positioned elements (it has no effect)
      if (position === 'static' && prop === 'z-index') continue;

      styles.push(`${prop}: ${value}`);
    }

    if (styles.length > 0) {
      cloneEl.setAttribute('style', styles.join('; '));
    }

    // Fix relative image URLs
    if (cloneEl.tagName === 'IMG') {
      const src = origEl.getAttribute('src');
      if (src) {
        cloneEl.setAttribute('src', new URL(src, document.baseURI).href);
      }
      const srcset = origEl.getAttribute('srcset');
      if (srcset) {
        cloneEl.setAttribute('srcset', fixSrcset(srcset));
      }
    }

    // Fix background-image URLs
    const bgImage = computed.getPropertyValue('background-image');
    if (bgImage && bgImage !== 'none') {
      const fixed = bgImage.replace(/url\(["']?(?!data:)(.*?)["']?\)/g, (_match, url) => {
        return `url("${new URL(url, document.baseURI).href}")`;
      });
      const currentStyle = cloneEl.getAttribute('style') || '';
      cloneEl.setAttribute('style', currentStyle.replace(/background-image:\s*[^;]+/, `background-image: ${fixed}`));
    }

    // Fix anchor hrefs
    if (cloneEl.tagName === 'A') {
      const href = origEl.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        try {
          cloneEl.setAttribute('href', new URL(href, document.baseURI).href);
        } catch {
          // Keep original href if URL construction fails
        }
      }
    }
  }
}

/**
 * Merge consecutive sibling <span> elements that have the same style attribute
 * and only contain text (no child elements). This collapses per-character spans
 * (common in Framer/Webflow) into single spans.
 */
function mergeAdjacentSpans(root: Element): void {
  // Process depth-first so inner spans merge before outer ones
  for (const child of Array.from(root.children)) {
    mergeAdjacentSpans(child);
  }

  const children = Array.from(root.childNodes);
  let i = 0;

  while (i < children.length) {
    const node = children[i];

    // Only merge <span> elements that contain only text
    if (!isTextOnlySpan(node)) {
      i++;
      continue;
    }

    const anchor = node as Element;
    const anchorStyle = anchor.getAttribute('style') || '';
    let merged = anchor.textContent || '';

    // Consume all following siblings with the same tag + style
    let j = i + 1;
    while (j < children.length) {
      const next = children[j];

      // Allow merging across whitespace text nodes between spans
      if (next.nodeType === Node.TEXT_NODE && next.textContent?.trim() === '') {
        j++;
        continue;
      }

      if (!isTextOnlySpan(next)) break;

      const nextEl = next as Element;
      const nextStyle = nextEl.getAttribute('style') || '';
      if (nextStyle !== anchorStyle) break;

      merged += nextEl.textContent || '';
      nextEl.remove();
      j++;
    }

    // Update the anchor with merged text
    if (merged !== (anchor.textContent || '')) {
      anchor.textContent = merged;
    }

    // Remove consumed whitespace text nodes between merged spans
    let k = i + 1;
    while (k < root.childNodes.length) {
      const check = root.childNodes[k];
      if (check === anchor) { k++; continue; }
      if (check.nodeType === Node.TEXT_NODE && check.textContent?.trim() === '' && k < root.childNodes.length) {
        // Only remove if the next real node was already merged (no longer in DOM)
        if (!check.nextSibling || check.nextSibling === root.childNodes[k + 1]) break;
        check.remove();
      } else {
        break;
      }
    }

    i++;
    // Re-read children since DOM changed
    children.length = 0;
    children.push(...Array.from(root.childNodes));
  }
}

function isTextOnlySpan(node: Node): boolean {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  const el = node as Element;
  if (el.tagName !== 'SPAN') return false;
  // Only merge spans whose children are all text nodes (no nested elements)
  return el.children.length === 0;
}

// Attributes that should always be preserved
const KEEP_ATTRS = new Set([
  'style', 'src', 'srcset', 'href', 'alt', 'type', 'target', 'rel',
]);

// SVG-specific attributes that must be kept for rendering
const SVG_ATTRS = new Set([
  'd', 'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
  'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-miterlimit',
  'opacity', 'fill-opacity', 'stroke-opacity', 'fill-rule', 'clip-rule', 'clip-path',
  'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
  'width', 'height', 'transform', 'points', 'pathLength',
  'text-anchor', 'dominant-baseline', 'font-size', 'font-family', 'font-weight',
  'dx', 'dy', 'offset', 'stop-color', 'stop-opacity', 'gradientTransform',
  'gradientUnits', 'spreadMethod', 'fx', 'fy',
  'markerWidth', 'markerHeight', 'refX', 'refY', 'orient',
  'preserveAspectRatio', 'xlink:href',
]);

const SVG_NS = 'http://www.w3.org/2000/svg';

function isSvgElement(node: Element): boolean {
  return node.namespaceURI === SVG_NS || node.closest('svg') !== null || node.tagName === 'svg';
}

function stripAttributes(clone: Element): void {
  const all = [clone, ...Array.from(clone.querySelectorAll('*'))];
  for (const node of all) {
    const toRemove: string[] = [];
    const inSvg = isSvgElement(node);
    for (const attr of Array.from(node.attributes)) {
      if (KEEP_ATTRS.has(attr.name)) continue;
      if (inSvg && SVG_ATTRS.has(attr.name)) continue;
      // Keep id/class refs inside SVG (needed for clip-path url(#id) references)
      if (inSvg && (attr.name === 'id' || attr.name === 'class')) continue;
      toRemove.push(attr.name);
    }
    for (const name of toRemove) {
      node.removeAttribute(name);
    }
  }
}

function fixSrcset(srcset: string): string {
  return srcset
    .split(',')
    .map((entry) => {
      const parts = entry.trim().split(/\s+/);
      if (parts[0]) {
        parts[0] = new URL(parts[0], document.baseURI).href;
      }
      return parts.join(' ');
    })
    .join(', ');
}
