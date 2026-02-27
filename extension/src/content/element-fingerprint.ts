import type { ElementFingerprint } from '../shared/types';

function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

function buildCSSSelector(el: Element): string {
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current !== document.documentElement) {
    if (current.id) {
      parts.unshift(`#${CSS.escape(current.id)}`);
      break;
    }
    const tag = current.tagName.toLowerCase();
    const parent: Element | null = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const currentTag = current.tagName;
      const sameTag = siblings.filter((s: Element) => s.tagName === currentTag);
      if (sameTag.length === 1) {
        parts.unshift(tag);
      } else {
        const index = siblings.indexOf(current) + 1;
        parts.unshift(`${tag}:nth-child(${index})`);
      }
    } else {
      parts.unshift(tag);
    }
    current = parent;
  }
  return parts.join(' > ');
}

function buildXPath(el: Element): string {
  const parts: string[] = [];
  let current: Node | null = el;
  while (current && current !== document) {
    if (current.nodeType !== Node.ELEMENT_NODE) {
      current = current.parentNode;
      continue;
    }
    const elem = current as Element;
    const tag = elem.tagName.toLowerCase();
    const parent = elem.parentNode;
    if (parent) {
      const siblings = Array.from(parent.childNodes).filter(
        n => n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName === elem.tagName,
      );
      if (siblings.length === 1) {
        parts.unshift(tag);
      } else {
        const index = siblings.indexOf(elem) + 1;
        parts.unshift(`${tag}[${index}]`);
      }
    } else {
      parts.unshift(tag);
    }
    current = parent;
  }
  return '/' + parts.join('/');
}

export function buildElementFingerprint(el: Element): ElementFingerprint {
  const rect = el.getBoundingClientRect();
  const docWidth = document.documentElement.scrollWidth || 1;
  const docHeight = document.documentElement.scrollHeight || 1;

  const dataAttributes: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith('data-') && !attr.name.startsWith('data-pablo-')) {
      dataAttributes[attr.name] = attr.value;
    }
  }

  const textContent = (el.textContent || '').trim().slice(0, 200);

  return {
    cssSelector: buildCSSSelector(el),
    xpathSelector: buildXPath(el),
    id: el.id || null,
    dataAttributes,
    ariaLabel: el.getAttribute('aria-label'),
    textContentHash: djb2Hash(textContent),
    tagName: el.tagName.toLowerCase(),
    childCount: el.children.length,
    boundingRect: {
      relativeTop: (rect.top + window.scrollY) / docHeight,
      relativeLeft: (rect.left + window.scrollX) / docWidth,
      width: rect.width,
      height: rect.height,
    },
  };
}

export function resolveElementFingerprint(fp: ElementFingerprint): Element | null {
  // 1. CSS selector exact match
  try {
    const el = document.querySelector(fp.cssSelector);
    if (el && el.tagName.toLowerCase() === fp.tagName) return el;
  } catch { /* invalid selector */ }

  // 2. ID lookup
  if (fp.id) {
    const el = document.getElementById(fp.id);
    if (el) return el;
  }

  // 3. XPath evaluation
  try {
    const result = document.evaluate(
      fp.xpathSelector, document, null,
      XPathResult.FIRST_ORDERED_NODE_TYPE, null,
    );
    const el = result.singleNodeValue as Element | null;
    if (el && el.tagName.toLowerCase() === fp.tagName) return el;
  } catch { /* xpath error */ }

  // 4. Data attribute selectors
  const dataKeys = Object.keys(fp.dataAttributes);
  if (dataKeys.length > 0) {
    const selector = dataKeys
      .map(k => `[${k}="${CSS.escape(fp.dataAttributes[k])}"]`)
      .join('');
    try {
      const el = document.querySelector(`${fp.tagName}${selector}`);
      if (el) return el;
    } catch { /* invalid selector */ }
  }

  // 5. Fuzzy matching: query by tagName, score by text hash + child count + geometry
  const candidates = document.querySelectorAll(fp.tagName);
  let bestScore = 0;
  let bestEl: Element | null = null;
  const docWidth = document.documentElement.scrollWidth || 1;
  const docHeight = document.documentElement.scrollHeight || 1;

  for (const candidate of Array.from(candidates)) {
    let score = 0;
    const textContent = (candidate.textContent || '').trim().slice(0, 200);
    if (djb2Hash(textContent) === fp.textContentHash) score += 50;
    if (candidate.children.length === fp.childCount) score += 10;

    const rect = candidate.getBoundingClientRect();
    const relTop = (rect.top + window.scrollY) / docHeight;
    const relLeft = (rect.left + window.scrollX) / docWidth;
    const topDiff = Math.abs(relTop - fp.boundingRect.relativeTop);
    const leftDiff = Math.abs(relLeft - fp.boundingRect.relativeLeft);
    const widthDiff = Math.abs(rect.width - fp.boundingRect.width) / Math.max(fp.boundingRect.width, 1);
    const heightDiff = Math.abs(rect.height - fp.boundingRect.height) / Math.max(fp.boundingRect.height, 1);

    if (topDiff < 0.05 && leftDiff < 0.05) score += 20;
    if (widthDiff < 0.1 && heightDiff < 0.1) score += 15;

    // Match data attributes
    for (const key of dataKeys) {
      if (candidate.getAttribute(key) === fp.dataAttributes[key]) score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestEl = candidate;
    }
  }

  // Threshold: need at least text hash match or strong geometry match
  if (bestScore >= 40) return bestEl;
  return null;
}
