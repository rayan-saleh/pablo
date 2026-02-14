import type { FontData, FontFaceData, PseudoContent } from '../shared/types';

/**
 * Normalize a font-family name by stripping quotes and trimming whitespace.
 */
function normalizeFontName(name: string): string {
  return name.replace(/^["']|["']$/g, '').trim();
}

/**
 * Build a relative CSS selector path from root to target element.
 */
function buildRelativeSelector(root: Element, target: Element): string {
  const parts: string[] = [];
  let current: Element | null = target;
  while (current && current !== root) {
    const parent: Element | null = current.parentElement;
    if (!parent) break;
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(current) + 1;
    const tag = current.tagName.toLowerCase();
    parts.unshift(`${tag}:nth-child(${index})`);
    current = parent;
  }
  return parts.join(' > ') || target.tagName.toLowerCase();
}

/**
 * Convert relative URLs in a @font-face src value to absolute URLs.
 */
function absolutizeSrc(src: string, baseUrl: string): string {
  return src.replace(/url\(["']?(.*?)["']?\)/g, (_match, url) => {
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
      return `url("${url}")`;
    }
    try {
      return `url("${new URL(url, baseUrl).href}")`;
    } catch {
      return `url("${url}")`;
    }
  });
}

/**
 * Extract font-face declarations and pseudo-element content from a component subtree.
 */
export function extractFonts(element: Element): FontData {
  const usedFamilies = new Set<string>();
  const pseudoContent: PseudoContent[] = [];

  // Walk all elements in the subtree
  const allElements = [element, ...Array.from(element.querySelectorAll('*'))];

  for (const el of allElements) {
    // Skip non-HTML elements (SVG internals, etc.)
    if (!(el instanceof HTMLElement) && el.namespaceURI !== 'http://www.w3.org/1999/xhtml') {
      // Still check SVG root for font-family
      if (el.tagName.toLowerCase() !== 'svg') continue;
    }

    // Collect font families from the element itself
    const computed = window.getComputedStyle(el);
    const fontFamily = computed.fontFamily;
    if (fontFamily) {
      for (const name of fontFamily.split(',')) {
        const normalized = normalizeFontName(name);
        if (normalized) usedFamilies.add(normalized);
      }
    }

    // Check ::before and ::after pseudo-elements
    for (const pseudo of ['::before', '::after'] as const) {
      const pseudoStyle = window.getComputedStyle(el, pseudo);
      const content = pseudoStyle.content;

      // Skip if no content or content is none/normal/empty
      if (!content || content === 'none' || content === 'normal' || content === '""' || content === "''") {
        continue;
      }

      const pseudoFontFamily = pseudoStyle.fontFamily;
      if (pseudoFontFamily) {
        for (const name of pseudoFontFamily.split(',')) {
          const normalized = normalizeFontName(name);
          if (normalized) usedFamilies.add(normalized);
        }
      }

      const selector = el === element
        ? el.tagName.toLowerCase()
        : buildRelativeSelector(element, el);

      pseudoContent.push({
        selector,
        pseudo,
        content,
        fontFamily: pseudoFontFamily || '',
        fontSize: pseudoStyle.fontSize || '',
        color: pseudoStyle.color || '',
      });
    }
  }

  // Scan stylesheets for matching @font-face rules
  const fontFaces: FontFaceData[] = [];
  const seenFontFaces = new Set<string>(); // Deduplicate by family+weight+style

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      // Cross-origin stylesheet, skip
      continue;
    }

    const baseUrl = sheet.href || document.baseURI;

    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;

      const style = rule.style;
      const family = normalizeFontName(style.getPropertyValue('font-family'));
      if (!family || !usedFamilies.has(family)) continue;

      const src = style.getPropertyValue('src');
      if (!src) continue;

      const weight = style.getPropertyValue('font-weight') || undefined;
      const fontStyle = style.getPropertyValue('font-style') || undefined;
      const display = style.getPropertyValue('font-display') || undefined;
      const unicodeRange = style.getPropertyValue('unicode-range') || undefined;

      // Deduplicate
      const key = `${family}|${weight || ''}|${fontStyle || ''}|${unicodeRange || ''}`;
      if (seenFontFaces.has(key)) continue;
      seenFontFaces.add(key);

      fontFaces.push({
        family,
        src: absolutizeSrc(src, baseUrl),
        ...(weight ? { weight } : {}),
        ...(fontStyle ? { style: fontStyle } : {}),
        ...(display ? { display } : {}),
        ...(unicodeRange ? { unicodeRange } : {}),
      });
    }
  }

  return { fontFaces, pseudoContent };
}
