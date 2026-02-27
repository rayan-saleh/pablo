import type { TechStack, StrategyKey, Strategy } from '../shared/types';
import { REACT_BASED_STACKS } from '../shared/types';
import { genericStrategy } from './strategies/generic';
import { shopifyStrategy } from './strategies/shopify';
import { wordpressStrategy } from './strategies/wordpress';
import { webflowStrategy } from './strategies/webflow';
import { framerStrategy } from './strategies/framer';
import { reactStrategy } from './strategies/react';

// --- HTML Pretty-Printer ---

const INLINE_ELEMENTS = new Set([
  'span', 'a', 'em', 'strong', 'b', 'i', 'img', 'br',
]);

const VOID_ELEMENTS = new Set([
  'img', 'br', 'hr', 'input',
]);

const MAX_FORMAT_SIZE = 200_000; // 200KB guard

function formatHtml(html: string): string {
  if (html.length > MAX_FORMAT_SIZE) return html;

  // Tokenize into tags and text segments
  const tokens: string[] = [];
  const tagRegex = /(<\/?[a-zA-Z][^>]*\/?>)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      const text = html.slice(lastIndex, match.index);
      if (text.trim()) tokens.push(text);
    }
    tokens.push(match[1]);
    lastIndex = tagRegex.lastIndex;
  }
  if (lastIndex < html.length) {
    const text = html.slice(lastIndex);
    if (text.trim()) tokens.push(text);
  }

  const lines: string[] = [];
  let depth = 0;
  const indent = () => '  '.repeat(depth);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const isTag = token.startsWith('<');

    if (!isTag) {
      // Text content — will be handled inline with surrounding tags where possible
      lines.push(indent() + token.trim());
      continue;
    }

    const isClosing = token.startsWith('</');
    const selfClosing = token.endsWith('/>');
    const tagNameMatch = token.match(/<\/?([a-zA-Z][a-zA-Z0-9]*)/);
    const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';
    const isVoid = VOID_ELEMENTS.has(tagName);
    const isInline = INLINE_ELEMENTS.has(tagName);

    if (isClosing) {
      depth = Math.max(0, depth - 1);
      // If the previous line is the matching open tag with only text between,
      // collapse them onto one line
      if (isInline && lines.length >= 2) {
        const prev = lines[lines.length - 1];
        const prevPrev = lines[lines.length - 2];
        const openPattern = new RegExp(`^\\s*<${tagName}[\\s>]`);
        if (!prev.trim().startsWith('<') && openPattern.test(prevPrev)) {
          const collapsed = prevPrev.trimEnd() + prev.trim() + token;
          lines.splice(lines.length - 2, 2, collapsed);
          continue;
        }
      }
      lines.push(indent() + token);
      continue;
    }

    if (selfClosing || isVoid) {
      lines.push(indent() + token);
      continue;
    }

    // Opening tag
    lines.push(indent() + token);
    if (!isInline) {
      depth++;
    } else {
      // For inline elements, check if next token is text and the one after is the closing tag
      const next = tokens[i + 1];
      const nextNext = tokens[i + 2];
      if (next && !next.startsWith('<') && nextNext && nextNext === `</${tagName}>`) {
        // Collapse: <span>text</span> on one line
        lines[lines.length - 1] = indent() + token + next.trim() + nextNext;
        i += 2;
        continue;
      }
      depth++;
    }
  }

  return lines.join('\n');
}

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
];

// Values that are always defaults regardless of element context
const ALWAYS_DEFAULT = new Map<string, string>([
  ['min-width', 'auto'],
  ['min-height', 'auto'],
  ['opacity', '1'],
  ['max-width', 'none'],
  ['max-height', 'none'],
  ['visibility', 'visible'],
  ['text-transform', 'none'],
  ['letter-spacing', 'normal'],
  ['white-space', 'normal'],
  ['object-fit', 'fill'],
  ['background-repeat', 'repeat'],
  ['background-size', 'auto'],
  ['background-position', '0% 0%'],
  ['background-image', 'none'],
]);

/**
 * Simplify CSS transform matrix() into human-readable functions.
 * Returns null if the transform is identity (should be omitted).
 */
function simplifyTransform(value: string): string | null {
  const n = value.replace(/\s/g, '');
  if (n === 'matrix(1,0,0,1,0,0)' || n === 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)') {
    return null; // identity
  }
  const m = n.match(/^matrix\(([^)]+)\)$/);
  if (!m) return value; // not a simple matrix(), keep as-is
  const parts = m[1].split(',').map(Number);
  if (parts.length !== 6 || parts.some(isNaN)) return value;
  const [a, b, c, d, tx, ty] = parts;
  const isRotatedOrSkewed = b !== 0 || c !== 0;
  if (isRotatedOrSkewed) return value; // complex transform, keep matrix

  const funcs: string[] = [];
  if (tx !== 0 || ty !== 0) {
    if (ty === 0) funcs.push(`translateX(${round1(tx)}px)`);
    else if (tx === 0) funcs.push(`translateY(${round1(ty)}px)`);
    else funcs.push(`translate(${round1(tx)}px, ${round1(ty)}px)`);
  }
  if (a !== 1 || d !== 1) {
    if (a === d) funcs.push(`scale(${round3(a)})`);
    else if (d === 1) funcs.push(`scaleX(${round3(a)})`);
    else if (a === 1) funcs.push(`scaleY(${round3(d)})`);
    else funcs.push(`scale(${round3(a)}, ${round3(d)})`);
  }
  if (funcs.length === 0) return null; // identity
  return funcs.join(' ');
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Round sub-pixel CSS values to 1 decimal place.
 * e.g. "12.3456px" → "12.3px", "0.00px" → "0px"
 */
function roundCSSValue(value: string): string {
  return value.replace(/(-?\d+\.\d{2,})(px|%|em|rem|vw|vh|vmin|vmax)/g, (_match, num, unit) => {
    const rounded = Math.round(parseFloat(num) * 10) / 10;
    // Drop trailing .0 → "12.0px" becomes "12px"
    const str = rounded === Math.trunc(rounded) ? String(Math.trunc(rounded)) : String(rounded);
    return str + unit;
  });
}

/**
 * Remove all border-related properties when all 4 sides are invisible
 * (width: 0px or style: none).
 */
function removeInvisibleBorders(styles: Map<string, string>): void {
  const allInvisible = ['top', 'right', 'bottom', 'left'].every(side => {
    const w = styles.get(`border-${side}-width`);
    const s = styles.get(`border-${side}-style`);
    return w === '0px' || s === 'none';
  });
  if (!allInvisible) return;
  for (const side of ['top', 'right', 'bottom', 'left']) {
    styles.delete(`border-${side}-width`);
    styles.delete(`border-${side}-style`);
    styles.delete(`border-${side}-color`);
  }
}

/**
 * Collapse transition-* longhands into the transition shorthand.
 */
function collapseTransitionShorthand(styles: Map<string, string>): void {
  const prop = styles.get('transition-property');
  const dur = styles.get('transition-duration');
  const timing = styles.get('transition-timing-function');
  const delay = styles.get('transition-delay');
  if (!prop || !dur) return;

  // All must be present (or we skip timing/delay if they're defaults)
  const parts = [prop, dur];
  if (timing && timing !== 'ease') parts.push(timing);
  if (delay && delay !== '0s') parts.push(delay);

  styles.delete('transition-property');
  styles.delete('transition-duration');
  styles.delete('transition-timing-function');
  styles.delete('transition-delay');
  styles.set('transition', parts.join(' '));
}

/**
 * Collapse animation-* longhands into the animation shorthand.
 */
function collapseAnimationShorthand(styles: Map<string, string>): void {
  const name = styles.get('animation-name');
  const dur = styles.get('animation-duration');
  if (!name || name === 'none' || !dur) return;

  const timing = styles.get('animation-timing-function');
  const delay = styles.get('animation-delay');
  const iterations = styles.get('animation-iteration-count');
  const direction = styles.get('animation-direction');
  const fill = styles.get('animation-fill-mode');
  const playState = styles.get('animation-play-state');

  // Build shorthand: duration | timing | delay | iterations | direction | fill | playState | name
  const parts = [dur];
  if (timing && timing !== 'ease') parts.push(timing);
  if (delay && delay !== '0s') parts.push(delay);
  if (iterations && iterations !== '1') parts.push(iterations);
  if (direction && direction !== 'normal') parts.push(direction);
  if (fill && fill !== 'none') parts.push(fill);
  if (playState && playState !== 'running') parts.push(playState);
  parts.push(name);

  for (const p of [
    'animation-name', 'animation-duration', 'animation-timing-function',
    'animation-delay', 'animation-iteration-count', 'animation-direction',
    'animation-fill-mode', 'animation-play-state',
  ]) {
    styles.delete(p);
  }
  styles.set('animation', parts.join(' '));
}

/**
 * When position is absolute/fixed and all 4 edges are set,
 * width/height are derived and can be removed.
 */
function removeRedundantDimensions(styles: Map<string, string>): void {
  const pos = styles.get('position');
  if (pos !== 'absolute' && pos !== 'fixed') return;
  const hasAll4 = styles.has('top') && styles.has('right') && styles.has('bottom') && styles.has('left');
  if (!hasAll4) return;
  styles.delete('width');
  styles.delete('height');
}

function removeInvisibleBorderColors(styles: Map<string, string>): void {
  for (const side of ['top', 'right', 'bottom', 'left']) {
    const width = styles.get(`border-${side}-width`);
    const bstyle = styles.get(`border-${side}-style`);
    if (width === '0px' || bstyle === 'none') {
      styles.delete(`border-${side}-color`);
    }
  }
}

function removeRedundantOverflow(styles: Map<string, string>): void {
  const overflow = styles.get('overflow');
  if (!overflow) return;
  if (styles.get('overflow-x') === overflow) styles.delete('overflow-x');
  if (styles.get('overflow-y') === overflow) styles.delete('overflow-y');
}

function collapseShorthands(styles: Map<string, string>): void {
  const BOX_GROUPS: [string, string[]][] = [
    ['margin', ['margin-top', 'margin-right', 'margin-bottom', 'margin-left']],
    ['padding', ['padding-top', 'padding-right', 'padding-bottom', 'padding-left']],
    ['border-width', ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width']],
    ['border-style', ['border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style']],
    ['border-color', ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color']],
    ['border-radius', ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius']],
  ];

  for (const [shorthand, longhands] of BOX_GROUPS) {
    const values = longhands.map(p => styles.get(p));
    if (values.some(v => v === undefined)) continue;

    const [top, right, bottom, left] = values as string[];
    let collapsed: string;
    if (top === right && right === bottom && bottom === left) {
      collapsed = top;
    } else if (top === bottom && right === left) {
      collapsed = `${top} ${right}`;
    } else if (right === left) {
      collapsed = `${top} ${right} ${bottom}`;
    } else {
      collapsed = `${top} ${right} ${bottom} ${left}`;
    }

    for (const p of longhands) styles.delete(p);
    styles.set(shorthand, collapsed);
  }

  // Collapse border: width style color when all sides are uniform
  const width = styles.get('border-width');
  const bstyle = styles.get('border-style');
  const color = styles.get('border-color');
  if (width && bstyle && color && !width.includes(' ') && !bstyle.includes(' ') && !color.includes(' ')) {
    styles.delete('border-width');
    styles.delete('border-style');
    styles.delete('border-color');
    styles.set('border', `${width} ${bstyle} ${color}`);
  }
}

function postProcessStyles(styles: Map<string, string>): void {
  removeInvisibleBorders(styles);
  removeInvisibleBorderColors(styles);
  removeRedundantOverflow(styles);
  removeRedundantDimensions(styles);
  collapseTransitionShorthand(styles);
  collapseAnimationShorthand(styles);
  collapseShorthands(styles);
}

function serializeStyles(styles: Map<string, string>): string {
  return [...styles].map(([p, v]) => `${p}: ${v}`).join('; ');
}

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
  console.log('[Pablo] Extraction start:', element.tagName.toLowerCase(), 'strategy:', strategyKey);
  const strategy = getStrategy(stack);
  const target = strategy.expandSelection(element);
  const clone = target.cloneNode(true) as Element;

  // Walk original + clone in parallel, applying computed styles
  const frameworkDefaults = strategy.getFrameworkDefaults?.() ?? null;
  applyComputedStyles(target, clone, frameworkDefaults);

  // Run strategy-specific cleanup
  strategy.cleanup(clone);

  // Strip class, id, data-* from all elements
  stripAttributes(clone);

  // Merge consecutive identical-style spans (e.g. per-character Framer spans)
  mergeAdjacentSpans(clone);

  // Collapse 4+ consecutive identical siblings into 2 + comment + last
  deduplicateRepeatedSiblings(clone);

  const html = formatHtml(clone.outerHTML);
  console.log('[Pablo] Final HTML size:', html.length);

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

function applyComputedStyles(original: Element, clone: Element, frameworkDefaults: Map<string, string> | null): void {
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
    const styles = new Map<string, string>();
    const position = computed.getPropertyValue('position');
    const tagName = origEl.tagName;
    const isClickable = tagName === 'A' || tagName === 'BUTTON' || origEl.closest('a, button') !== null;

    for (const prop of VISUAL_PROPERTIES) {
      const value = computed.getPropertyValue(prop);
      if (!value) continue;

      // Skip if it matches the browser default for this element type
      const defaultValue = defaults.get(prop);
      if (value === defaultValue) continue;

      // Skip always-default values (context-independent)
      if (ALWAYS_DEFAULT.get(prop) === value) continue;

      // top/right/bottom/left are irrelevant on statically positioned elements
      if (position === 'static' && (prop === 'top' || prop === 'right' || prop === 'bottom' || prop === 'left')) {
        continue;
      }

      // Skip z-index on statically positioned elements (it has no effect)
      if (position === 'static' && prop === 'z-index') continue;

      // Simplify transforms — skip identity, convert matrix to readable form
      if (prop === 'transform') {
        const simplified = simplifyTransform(value);
        if (simplified === null) continue; // identity
        styles.set(prop, simplified);
        continue;
      }

      // cursor:pointer is the browser default on clickable elements
      if (prop === 'cursor' && value === 'pointer' && isClickable) continue;

      styles.set(prop, roundCSSValue(value));
    }

    // Filter framework defaults (e.g. Framer runtime noise)
    if (frameworkDefaults) {
      for (const [fdProp, fdValue] of frameworkDefaults) {
        if (styles.get(fdProp) !== fdValue) continue;
        // Positional props: only remove when position:relative and z-index:auto
        if (fdProp === 'top' || fdProp === 'right' || fdProp === 'bottom' || fdProp === 'left') {
          if (position !== 'relative') continue;
          const zIndex = computed.getPropertyValue('z-index');
          if (zIndex !== 'auto') continue;
        }
        styles.delete(fdProp);
      }
    }

    postProcessStyles(styles);

    if (styles.size > 0) {
      cloneEl.setAttribute('style', serializeStyles(styles));
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

    // Materialize ::before and ::after pseudo-elements as <span data-pseudo>
    for (const pseudo of ['before', 'after'] as const) {
      const pseudoStyle = window.getComputedStyle(origEl, `::${pseudo}`);
      const content = pseudoStyle.content;
      if (!content || content === 'none' || content === 'normal' || content === '""' || content === "''") {
        continue;
      }

      const span = document.createElement('span');
      span.setAttribute('data-pseudo', pseudo);

      // Strip outer quotes from content value (e.g. '"\\e001"' -> '\e001')
      let textContent = content;
      if ((textContent.startsWith('"') && textContent.endsWith('"')) ||
          (textContent.startsWith("'") && textContent.endsWith("'"))) {
        textContent = textContent.slice(1, -1);
      }
      span.textContent = textContent;

      // Apply key styles from the pseudo-element
      const inlineStyles: string[] = [];
      const pFontFamily = pseudoStyle.fontFamily;
      if (pFontFamily) inlineStyles.push(`font-family: ${pFontFamily}`);
      const pFontSize = pseudoStyle.fontSize;
      if (pFontSize) inlineStyles.push(`font-size: ${pFontSize}`);
      const pColor = pseudoStyle.color;
      if (pColor) inlineStyles.push(`color: ${pColor}`);
      const pDisplay = pseudoStyle.display;
      if (pDisplay && pDisplay !== 'none') inlineStyles.push(`display: ${pDisplay}`);
      if (inlineStyles.length > 0) {
        span.setAttribute('style', inlineStyles.join('; '));
      }

      if (pseudo === 'before') {
        cloneEl.insertBefore(span, cloneEl.firstChild);
      } else {
        cloneEl.appendChild(span);
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

/**
 * Fingerprint an element's structure: tag + sorted child tag names + sorted attr names.
 */
function elementStructureKey(el: Element): string {
  const childTags = Array.from(el.children).map(c => c.tagName).join(',');
  const attrs = Array.from(el.attributes).map(a => a.name).sort().join(',');
  return `${el.tagName}|${childTags}|${attrs}`;
}

/**
 * When 4+ consecutive siblings have identical structure, keep first 2 + last 1
 * and insert a comment summarizing the omitted elements.
 */
function deduplicateRepeatedSiblings(root: Element): void {
  // Process children first (depth-first)
  for (const child of Array.from(root.children)) {
    deduplicateRepeatedSiblings(child);
  }

  const children = Array.from(root.children);
  let i = 0;

  while (i < children.length) {
    const key = elementStructureKey(children[i]);
    let j = i + 1;
    while (j < children.length && elementStructureKey(children[j]) === key) {
      j++;
    }
    const runLength = j - i;

    if (runLength >= 4) {
      const tag = children[i].tagName.toLowerCase();
      const keep1 = children[i];     // first
      const keep2 = children[i + 1]; // second
      const keepLast = children[j - 1]; // last
      const omitted = runLength - 3;

      // Remove elements between keep2 and keepLast
      for (let k = i + 2; k < j - 1; k++) {
        children[k].remove();
      }

      // Insert comment after keep2
      const comment = document.createComment(
        ` ...${omitted} more identical ${tag} elements (${runLength} total) `
      );
      keep2.after(comment);

      // Re-read children since DOM changed
      children.length = 0;
      children.push(...Array.from(root.children));
      i = Array.from(root.children).indexOf(keepLast) + 1;
    } else {
      i = j;
    }
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
  'style', 'src', 'srcset', 'href', 'alt', 'type', 'target', 'rel', 'data-pseudo',
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
