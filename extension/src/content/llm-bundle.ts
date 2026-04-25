import type {
  AnimationData,
  FontData,
  InteractionPattern,
  LlmCaptureBundle,
  SemanticHint,
  StrategyKey,
  TechStack,
} from '../shared/types';
import { buildRelativeSelectorPath } from '../shared/selector-paths';

interface LlmCaptureLimits {
  maxScanNodes: number;
  maxClassTokens: number;
  maxCssRules: number;
  maxCssTextChars: number;
  maxInteractiveSelectors: number;
  maxImageUrls: number;
  maxFontFamilies: number;
}

const LIMITS: LlmCaptureLimits = {
  maxScanNodes: 500,
  maxClassTokens: 300,
  maxCssRules: 200,
  maxCssTextChars: 15_000,
  maxInteractiveSelectors: 40,
  maxImageUrls: 60,
  maxFontFamilies: 20,
};

const GENERIC_FONT_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
]);

interface BuildLlmBundleInput {
  target: Element;
  selector: string;
  strategy: StrategyKey;
  framework: TechStack;
  styledHtml: string;
  animations?: AnimationData;
  semanticHints?: SemanticHint[];
  interactionPatterns?: InteractionPattern[];
  fonts?: FontData;
}

export function buildLlmBundle(input: BuildLlmBundleInput): LlmCaptureBundle {
  const elements = collectElements(input.target, LIMITS.maxScanNodes);
  const classTokens = collectClassTokens(elements, LIMITS.maxClassTokens);
  const cssRulesResult = collectMatchedCssRules(elements, LIMITS);
  const cssVariables = collectRelevantCssVariables(
    input.target,
    input.styledHtml,
    cssRulesResult.rules,
  );

  const interactiveSelectors = collectInteractiveSelectors(input.target, LIMITS.maxInteractiveSelectors);
  const ariaRoles = collectAriaRoles(elements);
  const imageUrls = collectImageUrls(input.target, LIMITS.maxImageUrls);
  const svgCount = input.target.querySelectorAll('svg').length + (input.target.tagName === 'svg' ? 1 : 0);
  const fontFamilies = collectFontFamilies(elements, LIMITS.maxFontFamilies, input.fonts);
  const semanticRoles = [...new Set((input.semanticHints ?? []).map((h) => h.role))];
  const interactionTypes = [...new Set((input.interactionPatterns ?? []).map((p) => p.type))];

  return {
    version: 1,
    boundary: {
      selector: input.selector,
      tag: input.target.tagName.toLowerCase(),
    },
    structure: {
      html: input.styledHtml,
      nodeCount: elements.length,
    },
    styles: {
      classTokens,
      cssRules: cssRulesResult.rules,
      cssVariables,
      ...(cssRulesResult.truncated ? { truncated: true } : {}),
    },
    behavior: {
      interactiveSelectors,
      ariaRoles,
      ...(input.animations?.summary ? { animationSummary: input.animations.summary } : {}),
      ...(semanticRoles.length > 0 ? { semanticRoles } : {}),
      ...(interactionTypes.length > 0 ? { interactionPatterns: interactionTypes } : {}),
    },
    assets: {
      imageUrls,
      svgCount,
      fontFamilies,
    },
    env: {
      framework: input.framework,
      strategy: input.strategy,
      url: window.location.href,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    },
    prompt:
      'Rebuild this component using semantic HTML and reusable CSS. Prefer class-based styles and extracted cssRules/cssVariables. Use the inlined html only as a visual fallback for unresolved runtime styles. Preserve interaction behavior and animation summary.',
  };
}

function collectElements(root: Element, maxNodes: number): Element[] {
  const out: Element[] = [root];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  while (out.length < maxNodes) {
    const next = walker.nextNode();
    if (!next) break;
    if (next instanceof Element && next !== root) out.push(next);
  }
  return out;
}

function collectClassTokens(elements: Element[], maxClassTokens: number): string[] {
  const set = new Set<string>();
  for (const el of elements) {
    if (!el.classList || el.classList.length === 0) continue;
    for (const token of Array.from(el.classList)) {
      if (!token) continue;
      set.add(token);
      if (set.size >= maxClassTokens) return [...set].sort();
    }
  }
  return [...set].sort();
}

function collectMatchedCssRules(elements: Element[], limits: LlmCaptureLimits): { rules: string[]; truncated: boolean } {
  const matched: string[] = [];
  const keyframeNames = collectAnimationNames(elements);
  let totalChars = 0;
  let truncated = false;

  const tryPush = (ruleText: string) => {
    if (!ruleText.trim()) return;
    if (matched.length >= limits.maxCssRules) {
      truncated = true;
      return;
    }
    if (totalChars + ruleText.length > limits.maxCssTextChars) {
      truncated = true;
      return;
    }
    matched.push(ruleText);
    totalChars += ruleText.length;
  };

  const walkRuleList = (ruleList: CSSRuleList, wrapper?: string) => {
    for (const rule of Array.from(ruleList)) {
      if (matched.length >= limits.maxCssRules || totalChars >= limits.maxCssTextChars) {
        truncated = true;
        return;
      }
      if (rule instanceof CSSStyleRule) {
        const selectors = splitSelectors(rule.selectorText);
        if (isNoisyGlobalRule(selectors)) continue;
        const doesMatch = selectors.some((selector) => matchesAny(elements, selector));
        if (!doesMatch) continue;
        const css = `${rule.selectorText} { ${rule.style.cssText} }`;
        tryPush(wrapper ? `${wrapper} { ${css} }` : css);
        continue;
      }
      if (rule instanceof CSSKeyframesRule) {
        if (!keyframeNames.has(rule.name)) continue;
        tryPush(rule.cssText);
        continue;
      }
      if (rule instanceof CSSMediaRule) {
        walkRuleList(rule.cssRules, `@media ${rule.conditionText}`);
        continue;
      }
      if (rule instanceof CSSSupportsRule) {
        walkRuleList(rule.cssRules, `@supports ${rule.conditionText}`);
      }
    }
  };

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      if (!sheet.cssRules) continue;
      walkRuleList(sheet.cssRules);
    } catch {
      // Cross-origin stylesheets can throw SecurityError. Ignore safely.
    }
    if (matched.length >= limits.maxCssRules || totalChars >= limits.maxCssTextChars) {
      truncated = true;
      break;
    }
  }

  return { rules: matched, truncated };
}

function collectAnimationNames(elements: Element[]): Set<string> {
  const out = new Set<string>();
  for (const el of elements) {
    const names = window.getComputedStyle(el).animationName;
    if (!names || names === 'none') continue;
    for (const name of names.split(',')) {
      const n = name.trim();
      if (n && n !== 'none') out.add(n);
    }
  }
  return out;
}

function splitSelectors(selectorText: string): string[] {
  return selectorText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isNoisyGlobalRule(selectors: string[]): boolean {
  if (selectors.length === 0) return true;
  return selectors.every((selector) => {
    const s = selector.replace(/::(before|after)/g, '').trim();
    if (s === '*' || s === 'html' || s === 'body' || s === ':root') return true;
    if (s.includes('*') && !/[.#\[]/.test(s)) return true;
    if (/^[a-z][a-z0-9-]*$/i.test(s)) return true; // bare element reset
    return false;
  });
}

function matchesAny(elements: Element[], selector: string): boolean {
  for (const el of elements) {
    try {
      if (el.matches(selector)) return true;
    } catch {
      return false;
    }
  }
  return false;
}

function safeUrl(url: string): string {
  try {
    return new URL(url, document.baseURI).href;
  } catch {
    return url;
  }
}

function collectRelevantCssVariables(target: Element, styledHtml: string, cssRules: string[]): Record<string, string> {
  const vars = new Set<string>();
  const combined = `${styledHtml}\n${cssRules.join('\n')}`;
  const re = /var\((--[a-zA-Z0-9-_]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(combined)) !== null) {
    vars.add(match[1]);
  }

  const resolved: Record<string, string> = {};
  const computed = window.getComputedStyle(target);
  for (const name of Array.from(vars).sort()) {
    const value = computed.getPropertyValue(name).trim();
    if (value) resolved[name] = value;
  }
  return resolved;
}

function collectInteractiveSelectors(root: Element, maxInteractiveSelectors: number): string[] {
  const out = new Set<string>();
  const candidates = [root, ...Array.from(root.querySelectorAll('*'))].filter((el) =>
    isInteractiveElement(el as Element),
  ) as Element[];

  for (const el of candidates) {
    out.add(relativeSelector(root, el));
    if (out.size >= maxInteractiveSelectors) break;
  }
  return [...out];
}

function isInteractiveElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag === 'a' || tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea') return true;
  if (el.hasAttribute('onclick') || el.hasAttribute('onmousedown') || el.hasAttribute('onpointerdown')) return true;
  if (el.hasAttribute('role')) {
    const role = el.getAttribute('role');
    if (role && ['button', 'link', 'menuitem', 'tab', 'switch'].includes(role)) return true;
  }
  if (el.hasAttribute('tabindex')) return true;
  return false;
}

function collectAriaRoles(elements: Element[]): string[] {
  const out = new Set<string>();
  for (const el of elements) {
    const role = el.getAttribute('role');
    if (role) out.add(role);
  }
  return [...out].sort();
}

function relativeSelector(root: Element, target: Element): string {
  return buildRelativeSelectorPath(root, target, 'nth-of-type');
}

function collectImageUrls(root: Element, maxImageUrls: number): string[] {
  const out = new Set<string>();
  const images: Element[] = [];
  if (root.tagName === 'IMG' || root.tagName === 'SOURCE') images.push(root);
  images.push(...Array.from(root.querySelectorAll('img,source')));
  for (const el of images) {
    const src = el.getAttribute('src');
    if (src) out.add(safeUrl(src));
    const srcset = el.getAttribute('srcset');
    if (srcset) {
      for (const part of srcset.split(',')) {
        const url = part.trim().split(/\s+/)[0];
        if (url) out.add(safeUrl(url));
      }
    }
    if (out.size >= maxImageUrls) break;
  }
  return [...out];
}

function collectFontFamilies(elements: Element[], maxFontFamilies: number, fonts?: FontData): string[] {
  const out = new Set<string>();
  if (fonts) {
    for (const ff of fonts.fontFaces) out.add(ff.family);
    for (const pseudo of fonts.pseudoContent) out.add(pseudo.fontFamily);
  }

  for (const el of elements) {
    const text = (el.textContent || '').trim();
    if (!text) continue;
    const family = window.getComputedStyle(el).fontFamily;
    if (!family) continue;
    for (const token of family.split(',')) {
      const clean = token.trim().replace(/^['"]|['"]$/g, '');
      if (!clean) continue;
      if (GENERIC_FONT_FAMILIES.has(clean.toLowerCase())) continue;
      out.add(clean);
      if (out.size >= maxFontFamilies) return [...out];
    }
  }
  return [...out];
}
