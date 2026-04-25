import type { InspectorMode, TechStack, StrategyKey, ComponentData, ComponentTree, AnimationData, ComponentScreenshot, FramerMotionData, GsapData, SemanticHint, InteractionPattern } from '../shared/types';
import { REACT_BASED_STACKS } from '../shared/types';
import { detectStack, probeReactViaServiceWorker } from './detector';
import { extractElement, getStrategy } from './extractor';
import { extractAnimations, mergeAnimationData } from './animation-extractor';
import { extractFonts } from './font-extractor';
import { MSG } from '../shared/messages';
import { buildLlmBundle } from './llm-bundle';
import { buildMarkdownPayload } from './payload-builder';
import { buildRelativeSelectorPath, buildSummarySelector } from '../shared/selector-paths';
import { dataUrlToPngBlob } from './clipboard';

let active = false;
let mode: InspectorMode = 'component';
let includeScreenshot = true;
let currentTarget: Element | null = null;
let detectedStack: TechStack = 'generic';

// Shadow DOM host for the overlay
let hostEl: HTMLDivElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let overlayEl: HTMLDivElement | null = null;
let labelEl: HTMLDivElement | null = null;
let spinnerEl: HTMLDivElement | null = null;
let spinnerTextEl: HTMLSpanElement | null = null;
let extracting = false;

// Toast / pending clipboard state
let pendingScreenshotDataUrl: string | null = null;
let pendingContextText: string | null = null;
let toastEl: HTMLDivElement | null = null;
let toastVisible = false;
let dataClearTimer: ReturnType<typeof setTimeout> | null = null;

function createOverlay(): void {
  if (hostEl) return;

  hostEl = document.createElement('div');
  hostEl.id = '__pablo-overlay-host';
  shadowRoot = hostEl.attachShadow({ mode: 'closed' });

  overlayEl = document.createElement('div');
  overlayEl.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 2147483647;
    border: 2px solid #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    transition: all 0.05s ease-out;
    display: none;
  `;

  labelEl = document.createElement('div');
  labelEl.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 2147483647;
    background: #3b82f6;
    color: white;
    font: 11px/1.4 monospace;
    padding: 2px 6px;
    border-radius: 3px;
    white-space: nowrap;
    display: none;
  `;

  spinnerEl = document.createElement('div');
  spinnerEl.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 2147483647;
    display: none;
    align-items: center;
    gap: 6px;
    background: rgba(0, 0, 0, 0.75);
    color: white;
    font: 11px/1.4 -apple-system, BlinkMacSystemFont, sans-serif;
    padding: 6px 12px;
    border-radius: 6px;
    white-space: nowrap;
  `;
  spinnerEl.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 14 14" style="animation: __pablo-spin 0.8s linear infinite; flex-shrink: 0;">
      <circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <path d="M7 1.5 A5.5 5.5 0 0 1 12.5 7" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <span id="__pablo-spinner-text">Extracting…</span>
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes __pablo-spin { to { transform: rotate(360deg); } }
    @keyframes __pablo-pulse {
      0%, 100% { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
      50% { border-color: #8b5cf6; background: rgba(139, 92, 246, 0.15); }
    }
  `;

  shadowRoot.appendChild(style);
  shadowRoot.appendChild(overlayEl);
  shadowRoot.appendChild(labelEl);
  shadowRoot.appendChild(spinnerEl);
  document.documentElement.appendChild(hostEl);
  spinnerTextEl = shadowRoot.getElementById('__pablo-spinner-text') as HTMLSpanElement | null;
}

function destroyOverlay(): void {
  if (hostEl) {
    hostEl.remove();
    hostEl = null;
    shadowRoot = null;
    overlayEl = null;
    labelEl = null;
    spinnerEl = null;
    spinnerTextEl = null;
    toastEl = null;
    toastVisible = false;
  }
}

function updateOverlay(el: Element): void {
  if (!overlayEl || !labelEl) return;

  const rect = el.getBoundingClientRect();
  overlayEl.style.display = 'block';
  overlayEl.style.top = `${rect.top}px`;
  overlayEl.style.left = `${rect.left}px`;
  overlayEl.style.width = `${rect.width}px`;
  overlayEl.style.height = `${rect.height}px`;

  const tag = el.tagName.toLowerCase();
  const className = el.className && typeof el.className === 'string'
    ? '.' + el.className.trim().split(/\s+/)[0]
    : '';
  labelEl.textContent = `${tag}${className} | ${detectedStack}`;
  labelEl.style.display = 'block';
  labelEl.style.left = `${rect.left}px`;
  labelEl.style.top = `${Math.max(0, rect.top - 22)}px`;
}

function hideOverlay(): void {
  if (overlayEl) overlayEl.style.display = 'none';
  if (labelEl) labelEl.style.display = 'none';
  if (spinnerEl) spinnerEl.style.display = 'none';
}

function showExtracting(): void {
  extracting = true;
  if (overlayEl) {
    overlayEl.style.animation = '__pablo-pulse 1s ease-in-out infinite';
  }
  if (labelEl) {
    labelEl.textContent = 'Extracting…';
    labelEl.style.background = '#8b5cf6';
  }
  if (spinnerTextEl) {
    spinnerTextEl.textContent = 'Extracting…';
  }
  if (spinnerEl && overlayEl) {
    const rect = overlayEl.getBoundingClientRect();
    spinnerEl.style.display = 'flex';
    spinnerEl.style.left = `${rect.left + rect.width / 2 - 50}px`;
    spinnerEl.style.top = `${rect.top + rect.height / 2 - 12}px`;
  }
}

function hideExtracting(clearLock = true): void {
  if (clearLock) {
    extracting = false;
  }
  if (overlayEl) {
    overlayEl.style.animation = '';
  }
  if (spinnerEl) {
    spinnerEl.style.display = 'none';
  }
}

function getPageTarget(): Element {
  return document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
}

function getStrategyKey(stack: TechStack): StrategyKey {
  if (REACT_BASED_STACKS.has(stack)) return 'react';
  if (['shopify', 'wordpress', 'webflow', 'framer'].includes(stack)) return stack as StrategyKey;
  return 'generic';
}

function buildSelector(el: Element): string {
  return buildSummarySelector(el, Number.MAX_SAFE_INTEGER);
}

function normalizeBoundary(el: Element): Element {
  let seed = el;
  const pos = window.getComputedStyle(seed).position;
  if ((pos === 'absolute' || pos === 'fixed') && seed.parentElement) {
    seed = seed.parentElement;
  }

  let best = seed;
  let bestScore = boundaryScore(seed);
  let current: Element | null = seed.parentElement;
  let depth = 0;

  while (current && depth < 6) {
    const score = boundaryScore(current);
    if (score > bestScore) {
      best = current;
      bestScore = score;
    }
    if (isHardBoundary(current)) break;
    current = current.parentElement;
    depth++;
  }

  return best;
}

function isHardBoundary(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag === 'section' || tag === 'article' || tag === 'main' || tag === 'aside') return true;
  const role = el.getAttribute('role');
  return role === 'main' || role === 'region' || role === 'banner' || role === 'navigation';
}

function boundaryScore(el: Element): number {
  const rect = el.getBoundingClientRect();
  const vw = Math.max(window.innerWidth, 1);
  const vh = Math.max(window.innerHeight, 1);
  const areaRatio = (rect.width * rect.height) / (vw * vh);
  const tag = el.tagName.toLowerCase();

  let score = 0;
  if (tag === 'section' || tag === 'article' || tag === 'main') score += 5;
  if (el.querySelector('h1,h2,h3,h4,h5,h6')) score += 3;
  if (el.querySelector('button,a,[role=\"button\"],[role=\"link\"]')) score += 2;
  if (areaRatio >= 0.05 && areaRatio <= 0.95) score += 2;
  if (areaRatio > 0.95) score -= 3;
  if (rect.width < 120 || rect.height < 80) score -= 2;
  return score;
}

function chooseExtractionTarget(
  clickedTarget: Element,
  strategy: ReturnType<typeof getStrategy>,
): Element {
  return normalizeBoundary(strategy.expandSelection(clickedTarget));
}

/**
 * Request fiber collection from the service worker (runs in main world).
 * Marks the target element with data-pablo-target, sends COLLECT_FIBER, removes attribute.
 */
function collectFiberViaServiceWorker(target: Element): Promise<{
  components: ComponentData[];
  rootComponentName: string;
  motionComponents?: FramerMotionData[];
} | null> {
  return new Promise((resolve) => {
    target.setAttribute('data-pablo-target', '1');
    chrome.runtime.sendMessage({ type: MSG.COLLECT_FIBER }, (response) => {
      target.removeAttribute('data-pablo-target');
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(response?.data ?? null);
    });
  });
}

/**
 * Request GSAP animation data from the service worker (runs in main world).
 * Marks the target element so GSAP collection is scoped to its subtree.
 */
function collectGsapViaServiceWorker(target: Element): Promise<GsapData | null> {
  return new Promise((resolve) => {
    target.setAttribute('data-pablo-target-gsap', '1');
    chrome.runtime.sendMessage({ type: MSG.COLLECT_GSAP }, (response) => {
      target.removeAttribute('data-pablo-target-gsap');
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(response?.data ?? null);
    });
  });
}

/**
 * Build a component tree from flat sorted components array.
 */
function buildComponentTree(components: ComponentData[], rootName: string): ComponentTree | undefined {
  if (components.length === 0) return undefined;

  const map = new Map<string, ComponentData>();
  for (const c of components) map.set(c.displayName, c);

  function build(name: string): ComponentTree | undefined {
    const data = map.get(name);
    if (!data) return undefined;
    return {
      name: data.displayName,
      sourceCode: data.sourceCode,
      instances: data.instances,
      children: data.children
        .map(childName => build(childName))
        .filter((c): c is ComponentTree => c !== undefined),
    };
  }

  return build(rootName);
}

// --- Semantic Analysis ---

function buildRelativeSelector(root: Element, target: Element): string {
  return buildRelativeSelectorPath(root, target, 'nth-child');
}

function inferSemanticRoles(element: Element): SemanticHint[] {
  const hints: SemanticHint[] = [];
  const all = [element, ...Array.from(element.querySelectorAll('*'))];

  for (const el of all) {
    if (!(el instanceof HTMLElement)) continue;
    const tag = el.tagName.toLowerCase();
    const text = el.textContent?.trim() || '';
    const selector = el === element ? tag : buildRelativeSelector(element, el);
    const computed = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    // heading: h1-h6 or large font with short text
    if (/^h[1-6]$/.test(tag)) {
      hints.push({ selector, role: 'heading', reason: `${tag} element` });
      continue;
    }
    const fontSize = parseFloat(computed.fontSize);
    if (fontSize >= 28 && text.length > 0 && text.length < 120 && el.children.length <= 3) {
      hints.push({ selector, role: 'heading', reason: `large text (${Math.round(fontSize)}px)` });
      continue;
    }

    // badge: small text, short height, colored background, border-radius
    if (text.length > 0 && text.length < 30 && rect.height < 40 && rect.height > 0) {
      const bg = computed.backgroundColor;
      const radius = parseFloat(computed.borderRadius);
      const hasColoredBg = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
      if (hasColoredBg && radius > 0) {
        hints.push({ selector, role: 'badge', reason: 'small colored pill' });
        continue;
      }
    }

    // cta-button: a or button with short text and styled background
    if ((tag === 'a' || tag === 'button') && text.length > 0 && text.length < 40) {
      const bg = computed.backgroundColor;
      const hasColoredBg = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
      if (hasColoredBg) {
        hints.push({ selector, role: 'cta-button', reason: `${tag} with styled background` });
        continue;
      }
    }

    // image-container: div wrapping only an img
    if (tag === 'div' && el.children.length === 1 && el.children[0]?.tagName === 'IMG') {
      hints.push({ selector, role: 'image-container', reason: 'div wrapping img' });
      continue;
    }

    // video: element containing a video tag
    if (tag === 'video' || el.querySelector('video')) {
      if (tag === 'video' || (el.children.length <= 3 && el.querySelector('video'))) {
        hints.push({ selector, role: 'video', reason: 'contains video element' });
        continue;
      }
    }

    // icon: small SVG
    if (tag === 'svg' && rect.width <= 32 && rect.height <= 32 && rect.width > 0) {
      hints.push({ selector, role: 'icon', reason: `small SVG (${Math.round(rect.width)}x${Math.round(rect.height)})` });
      continue;
    }
  }

  return hints;
}

// --- Interaction Pattern Detection ---

function detectInteractionPatterns(element: Element): InteractionPattern[] {
  const patterns: InteractionPattern[] = [];

  // Pattern 1: hover-text-slide — duplicate text where one instance has opacity:0
  const textMap = new Map<string, Element[]>();
  const allEls = Array.from(element.querySelectorAll('*'));
  for (const el of allEls) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.children.length > 0) continue; // leaf text nodes only
    const text = el.textContent?.trim();
    if (!text || text.length < 2) continue;
    const list = textMap.get(text) || [];
    list.push(el);
    textMap.set(text, list);
  }
  for (const [text, elements] of textMap) {
    if (elements.length < 2) continue;
    const hasHidden = elements.some(el => {
      const style = window.getComputedStyle(el);
      return style.opacity === '0';
    });
    if (hasHidden) {
      patterns.push({
        type: 'hover-text-slide',
        description: `Duplicate text "${text.slice(0, 40)}" with one instance at opacity:0 — likely hover slide/reveal animation`,
        elements: elements.map(el => buildRelativeSelector(element, el)),
      });
    }
  }

  // Pattern 2: clip-reveal — overflow:hidden parent with transformed children
  for (const el of allEls) {
    if (!(el instanceof HTMLElement)) continue;
    const style = window.getComputedStyle(el);
    if (style.overflow !== 'hidden') continue;
    for (const child of Array.from(el.children)) {
      if (!(child instanceof HTMLElement)) continue;
      const childStyle = window.getComputedStyle(child);
      const transform = childStyle.transform;
      if (transform && transform !== 'none') {
        const n = transform.replace(/\s/g, '');
        if (n !== 'matrix(1,0,0,1,0,0)' && n !== 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)') {
          patterns.push({
            type: 'clip-reveal',
            description: 'overflow:hidden parent with transformed child — likely clip/reveal animation',
            elements: [buildRelativeSelector(element, el), buildRelativeSelector(element, child)],
          });
          break; // one per parent
        }
      }
    }
  }

  return patterns;
}

// --- Component Summary ---

function generateComponentSummary(element: Element, semanticHints?: SemanticHint[]): string {
  const rect = element.getBoundingClientRect();
  const parts: string[] = [];

  // Dimensions
  parts.push(`${Math.round(rect.width)}x${Math.round(rect.height)}px`);

  // Layout type
  const style = window.getComputedStyle(element);
  if (style.display.includes('flex')) parts.push('flex container');
  else if (style.display.includes('grid')) parts.push('grid container');
  else parts.push(style.display + ' container');

  // Headings
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
  for (const h of Array.from(headings).slice(0, 2)) {
    const text = h.textContent?.trim();
    if (text) parts.push(`heading: "${text.length > 60 ? text.slice(0, 60) + '...' : text}"`);
  }

  // Buttons/CTAs
  const buttons = element.querySelectorAll('a, button');
  const buttonTexts: string[] = [];
  for (const btn of Array.from(buttons).slice(0, 3)) {
    const text = btn.textContent?.trim();
    if (text && text.length < 40) buttonTexts.push(`"${text}"`);
  }
  if (buttonTexts.length > 0) parts.push(`buttons: ${buttonTexts.join(', ')}`);

  // Images
  const imgCount = element.querySelectorAll('img').length;
  if (imgCount > 0) parts.push(`${imgCount} image${imgCount > 1 ? 's' : ''}`);

  // Videos
  const videoCount = element.querySelectorAll('video').length;
  if (videoCount > 0) parts.push(`${videoCount} video${videoCount > 1 ? 's' : ''}`);

  // Semantic roles summary
  if (semanticHints && semanticHints.length > 0) {
    const roles = [...new Set(semanticHints.map(h => h.role))];
    parts.push(`contains: ${roles.join(', ')}`);
  }

  return parts.join(' | ');
}

// --- Event handlers ---

function onMouseMove(e: MouseEvent): void {
  if (!active || extracting || toastVisible) return;

  if (mode === 'page') {
    const target = getPageTarget();
    if (target !== currentTarget) {
      currentTarget = target;
      updateOverlay(target);
    }
    return;
  }

  // Component mode
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (!el || el === hostEl || hostEl?.contains(el)) return;
  if (el === currentTarget) return;

  currentTarget = el;
  updateOverlay(el);
}

async function onClick(e: MouseEvent): Promise<void> {
  if (!active || extracting || toastVisible) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  if (!currentTarget) return;

  const tag = currentTarget.tagName.toLowerCase();
  const cls = currentTarget.className && typeof currentTarget.className === 'string'
    ? currentTarget.className.trim().split(/\s+/)[0]
    : '';
  console.log('[Pablo] Click target:', tag + (cls ? '.' + cls : ''));

  await handleExtraction(currentTarget);
}

async function handleExtraction(target: Element): Promise<void> {
  showExtracting();
  try {
    const strategy = getStrategy(detectedStack);
    const extractionTarget = chooseExtractionTarget(target, strategy);

    const screenshot: ComponentScreenshot | undefined = includeScreenshot
      ? await captureComponentScreenshot(target)
      : undefined;

    const html = extractElement(extractionTarget, detectedStack);

    let animations: AnimationData | undefined = extractAnimations(extractionTarget);
    console.log('[Pablo] Animation extraction:', animations ? 'data found' : 'none');

    if (strategy.extractAnimations) {
      const strategyAnimations = strategy.extractAnimations(extractionTarget);
      animations = mergeAnimationData(animations, strategyAnimations);
    }

    const gsapData = await collectGsapViaServiceWorker(extractionTarget);
    if (gsapData?.detected) {
      console.log(
        '[Pablo] GSAP data found:',
        gsapData.version || 'detected',
        'scrollTriggers:',
        gsapData.scrollTriggers.length,
        'tweens:',
        gsapData.tweens.length,
      );
      animations = mergeAnimationData(animations, { gsap: gsapData });
    }

    let tree: ComponentTree | undefined;
    if (REACT_BASED_STACKS.has(detectedStack) || detectedStack === 'framer') {
      console.log('[Pablo] Attempting fiber collection via service worker');
      const fiberData = await collectFiberViaServiceWorker(extractionTarget);
      if (fiberData) {
        console.log('[Pablo] Fiber data received, components:', fiberData.components.length);
        tree = buildComponentTree(fiberData.components, fiberData.rootComponentName);
        if (fiberData.motionComponents && fiberData.motionComponents.length > 0) {
          console.log('[Pablo] Framer Motion data found:', fiberData.motionComponents.length, 'components');
          animations = mergeAnimationData(animations, {
            framerMotion: fiberData.motionComponents,
          });
        }
      } else {
        console.log('[Pablo] Fiber collection returned null, using HTML only');
      }
    }

    const semanticHints = inferSemanticRoles(extractionTarget);
    const interactionPatterns = detectInteractionPatterns(extractionTarget);
    const fonts = extractFonts(extractionTarget);
    console.log('[Pablo] Font extraction:', fonts.fontFaces.length, 'font-faces,', fonts.pseudoContent.length, 'pseudo-elements');
    void generateComponentSummary(extractionTarget, semanticHints);

    const selector = buildSelector(extractionTarget);
    const llmBundle = buildLlmBundle({
      target: extractionTarget,
      selector,
      strategy: getStrategyKey(detectedStack),
      framework: detectedStack,
      styledHtml: html,
      animations,
      semanticHints,
      interactionPatterns,
      fonts,
    });

    const result = buildMarkdownPayload({
      selector,
      tag: extractionTarget.tagName.toLowerCase(),
      url: window.location.href,
      title: document.title,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      framework: detectedStack,
      strategy: getStrategyKey(detectedStack),
      styledHtml: llmBundle.structure.html,
      cssRules: llmBundle.styles.cssRules,
      cssVariables: llmBundle.styles.cssVariables,
      animations,
      interactiveSelectors: llmBundle.behavior.interactiveSelectors,
      ariaRoles: llmBundle.behavior.ariaRoles,
      fonts,
      componentTree: tree,
      hasScreenshot: !!screenshot,
    });

    pendingScreenshotDataUrl = screenshot?.dataUrl ?? null;
    pendingContextText = result.text;
    console.log('[Pablo] Extraction ready, size:', result.text.length, 'truncated:', result.truncated, 'hasScreenshot:', !!screenshot);

    chrome.runtime.sendMessage({
      type: MSG.EXTRACTION_COMPLETE,
      meta: {
        tag: extractionTarget.tagName.toLowerCase(),
        stack: detectedStack,
        size: result.text.length,
        hasScreenshot: !!screenshot,
      },
    });

    hideExtracting();
    if (result.truncated) {
      const overKb = (result.oversize / 1024).toFixed(1);
      console.log(`[Pablo] truncated — ${overKb} KB over cap`);
    }
    showToast(!!pendingScreenshotDataUrl);
  } catch (err) {
    hideExtracting();
    if (labelEl) {
      labelEl.textContent = 'Error';
      labelEl.style.background = '#ef4444';
      setTimeout(() => {
        if (labelEl) {
          labelEl.style.background = '#3b82f6';
          if (currentTarget) {
            const tag = currentTarget.tagName.toLowerCase();
            const className = currentTarget.className && typeof currentTarget.className === 'string'
              ? '.' + currentTarget.className.trim().split(/\s+/)[0]
              : '';
            labelEl.textContent = `${tag}${className} | ${detectedStack}`;
          }
        }
      }, 2000);
    }
    console.error('[Pablo] Extraction failed:', err);
    chrome.runtime.sendMessage({
      type: MSG.STATUS_UPDATE,
      status: 'error',
    });
  }
}

function flashGreen(): void {
  if (overlayEl) {
    overlayEl.style.borderColor = '#22c55e';
    overlayEl.style.background = 'rgba(34, 197, 94, 0.15)';
  }
  if (labelEl) {
    labelEl.textContent = 'Copied!';
    labelEl.style.background = '#22c55e';
  }
  setTimeout(() => {
    if (overlayEl) {
      overlayEl.style.borderColor = '#3b82f6';
      overlayEl.style.background = 'rgba(59, 130, 246, 0.1)';
    }
    if (labelEl) {
      labelEl.style.background = '#3b82f6';
      if (currentTarget) {
        const tag = currentTarget.tagName.toLowerCase();
        const className = currentTarget.className && typeof currentTarget.className === 'string'
          ? '.' + currentTarget.className.trim().split(/\s+/)[0]
          : '';
        labelEl.textContent = `${tag}${className} | ${detectedStack}`;
      }
    }
  }, 1000);
}

function flashYellow(message: string): void {
  if (overlayEl) {
    overlayEl.style.borderColor = '#eab308';
    overlayEl.style.background = 'rgba(234, 179, 8, 0.15)';
  }
  if (labelEl) {
    labelEl.textContent = message;
    labelEl.style.background = '#eab308';
  }
  setTimeout(() => {
    if (overlayEl) {
      overlayEl.style.borderColor = '#3b82f6';
      overlayEl.style.background = 'rgba(59, 130, 246, 0.1)';
    }
    if (labelEl) {
      labelEl.style.background = '#3b82f6';
      if (currentTarget) {
        const tag = currentTarget.tagName.toLowerCase();
        const className = currentTarget.className && typeof currentTarget.className === 'string'
          ? '.' + currentTarget.className.trim().split(/\s+/)[0]
          : '';
        labelEl.textContent = `${tag}${className} | ${detectedStack}`;
      }
    }
  }, 2000);
}

// --- Toast UI ---

const BUTTON_BASE_STYLE =
  'background:transparent; border:1px solid rgba(255,255,255,0.2); color:#fff; padding:6px 12px; border-radius:4px; cursor:pointer; font:inherit;';
const BUTTON_SUCCESS_STYLE =
  'background:#22c55e; border:1px solid #22c55e; color:#fff; padding:6px 12px; border-radius:4px; cursor:pointer; font:inherit;';
const BUTTON_ERROR_STYLE =
  'background:#ef4444; border:1px solid #ef4444; color:#fff; padding:6px 12px; border-radius:4px; cursor:pointer; font:inherit;';
const DISMISS_BUTTON_STYLE =
  'background:transparent; border:1px solid rgba(255,255,255,0.2); color:#fff; padding:6px 8px; border-radius:4px; cursor:pointer; font:inherit; line-height:1;';

function setButtonState(
  btn: HTMLButtonElement,
  text: string,
  variant: 'base' | 'success' | 'error',
): void {
  btn.textContent = text;
  if (variant === 'success') btn.setAttribute('style', BUTTON_SUCCESS_STYLE);
  else if (variant === 'error') btn.setAttribute('style', BUTTON_ERROR_STYLE);
  else btn.setAttribute('style', BUTTON_BASE_STYLE);
}

function flashButtonSuccess(btn: HTMLButtonElement, originalLabel: string): void {
  setButtonState(btn, 'Copied!', 'success');
  setTimeout(() => {
    if (btn.isConnected) setButtonState(btn, originalLabel, 'base');
  }, 1200);
}

function triggerDownloadFallback(blob: Blob): void {
  if (!shadowRoot) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pablo-screenshot.png';
  a.style.display = 'none';
  shadowRoot.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.isConnected) a.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}

function isClipboardWriteAvailable(): boolean {
  return typeof navigator.clipboard?.write === 'function';
}

function createToast(hasScreenshot: boolean): HTMLDivElement {
  const toast = document.createElement('div');
  toast.className = 'pablo-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute(
    'style',
    'position:fixed; bottom:16px; left:50%; transform:translateX(-50%);' +
      ' z-index:2147483647; isolation:isolate;' +
      ' background:rgba(0,0,0,0.88); border-radius:8px;' +
      ' padding:8px 12px; display:flex; gap:8px; align-items:center;' +
      ' font:12px/1.4 monospace; color:#fff;' +
      ' pointer-events:auto; opacity:0; transition:opacity 0.2s ease-out;',
  );

  const writeAvailable = isClipboardWriteAvailable();

  if (hasScreenshot) {
    if (writeAvailable) {
      const copyShot = document.createElement('button');
      copyShot.dataset.action = 'copy-screenshot';
      copyShot.textContent = 'Copy Screenshot';
      copyShot.setAttribute('style', BUTTON_BASE_STYLE);
      toast.appendChild(copyShot);

      const copyBoth = document.createElement('button');
      copyBoth.dataset.action = 'copy-both';
      copyBoth.textContent = 'Copy Both';
      copyBoth.setAttribute('style', BUTTON_BASE_STYLE);
      toast.appendChild(copyBoth);
    } else {
      // Fallback: only download is available for the image
      const download = document.createElement('button');
      download.dataset.action = 'download-screenshot';
      download.textContent = 'Download Screenshot';
      download.setAttribute('style', BUTTON_BASE_STYLE);
      toast.appendChild(download);
    }
  }

  const copyContext = document.createElement('button');
  copyContext.dataset.action = 'copy-context';
  copyContext.textContent = 'Copy Context';
  copyContext.setAttribute('style', BUTTON_BASE_STYLE);
  toast.appendChild(copyContext);

  const dismiss = document.createElement('button');
  dismiss.dataset.action = 'dismiss';
  dismiss.setAttribute('aria-label', 'Dismiss');
  dismiss.textContent = 'x';
  dismiss.setAttribute('style', DISMISS_BUTTON_STYLE);
  toast.appendChild(dismiss);

  return toast;
}

async function copyScreenshot(btn: HTMLButtonElement): Promise<void> {
  const original = 'Copy Screenshot';
  if (!pendingScreenshotDataUrl) {
    setButtonState(btn, 'No data — extract again', 'error');
    return;
  }
  try {
    const blob = dataUrlToPngBlob(pendingScreenshotDataUrl);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    flashButtonSuccess(btn, original);
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'DataError')) {
      try {
        const blob = dataUrlToPngBlob(pendingScreenshotDataUrl);
        setButtonState(btn, 'Failed — downloading', 'error');
        triggerDownloadFallback(blob);
      } catch {
        setButtonState(btn, 'Failed', 'error');
      }
      return;
    }
    throw err;
  }
}

async function copyBoth(btn: HTMLButtonElement): Promise<void> {
  const original = 'Copy Both';
  if (!pendingScreenshotDataUrl || !pendingContextText) {
    setButtonState(btn, 'No data — extract again', 'error');
    return;
  }
  try {
    const blob = dataUrlToPngBlob(pendingScreenshotDataUrl);
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
        'text/plain': new Blob([pendingContextText], { type: 'text/plain' }),
      }),
    ]);
    flashButtonSuccess(btn, original);
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'DataError')) {
      try {
        const blob = dataUrlToPngBlob(pendingScreenshotDataUrl);
        setButtonState(btn, 'Failed — downloading', 'error');
        triggerDownloadFallback(blob);
      } catch {
        setButtonState(btn, 'Failed', 'error');
      }
      return;
    }
    throw err;
  }
}

async function copyContext(btn: HTMLButtonElement): Promise<void> {
  const original = 'Copy Context';
  if (!pendingContextText) {
    setButtonState(btn, 'No data — extract again', 'error');
    return;
  }
  try {
    await navigator.clipboard.writeText(pendingContextText);
    flashButtonSuccess(btn, original);
  } catch {
    setButtonState(btn, 'Failed to copy', 'error');
  }
}

function downloadScreenshot(btn: HTMLButtonElement): void {
  if (!pendingScreenshotDataUrl) {
    setButtonState(btn, 'No data — extract again', 'error');
    return;
  }
  try {
    const blob = dataUrlToPngBlob(pendingScreenshotDataUrl);
    triggerDownloadFallback(blob);
    flashButtonSuccess(btn, 'Download Screenshot');
  } catch {
    setButtonState(btn, 'Failed', 'error');
  }
}

function disableToastButtonsExpired(): void {
  if (!toastEl) return;
  const buttons = toastEl.querySelectorAll<HTMLButtonElement>('button[data-action]');
  for (const btn of Array.from(buttons)) {
    const action = btn.dataset.action;
    if (action === 'dismiss') continue;
    btn.disabled = true;
    btn.textContent = 'Expired — extract again';
    btn.setAttribute(
      'style',
      'background:transparent; border:1px solid rgba(255,255,255,0.2); color:rgba(255,255,255,0.5); padding:6px 12px; border-radius:4px; cursor:not-allowed; font:inherit;',
    );
  }
}

function showToast(hasScreenshot: boolean): void {
  if (toastEl) hideToast();
  if (!shadowRoot) return;

  toastEl = createToast(hasScreenshot);
  shadowRoot.appendChild(toastEl);
  toastVisible = true;

  // Entrance animation
  requestAnimationFrame(() => {
    if (toastEl) toastEl.style.opacity = '1';
  });

  // Wire up click handlers
  toastEl.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const action = target.dataset.action;
    if (!action) return;
    e.preventDefault();
    e.stopPropagation();
    switch (action) {
      case 'copy-screenshot':
        void copyScreenshot(target);
        break;
      case 'copy-both':
        void copyBoth(target);
        break;
      case 'copy-context':
        void copyContext(target);
        break;
      case 'download-screenshot':
        downloadScreenshot(target);
        break;
      case 'dismiss':
        hideToast();
        break;
    }
  });

  // 60-second mandatory data-clear timer
  if (dataClearTimer) clearTimeout(dataClearTimer);
  dataClearTimer = setTimeout(() => {
    pendingScreenshotDataUrl = null;
    pendingContextText = null;
    disableToastButtonsExpired();
  }, 60_000);
}

function hideToast(): void {
  if (toastEl) {
    toastEl.remove();
    toastEl = null;
  }
  toastVisible = false;
  pendingScreenshotDataUrl = null;
  pendingContextText = null;
  if (dataClearTimer) {
    clearTimeout(dataClearTimer);
    dataClearTimer = null;
  }
}

function onKeyDown(e: KeyboardEvent): void {
  if (!active || extracting) return;

  if (e.key === 'Escape') {
    deactivate();
    return;
  }

  if (mode !== 'component' || !currentTarget) return;

  // Arrow key navigation
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    const parent = currentTarget.parentElement;
    if (parent && parent !== document.documentElement) {
      currentTarget = parent;
      updateOverlay(currentTarget);
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    const firstChild = currentTarget.firstElementChild;
    if (firstChild) {
      currentTarget = firstChild;
      updateOverlay(currentTarget);
    }
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    const prev = currentTarget.previousElementSibling;
    if (prev) {
      currentTarget = prev;
      updateOverlay(currentTarget);
    }
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    const next = currentTarget.nextElementSibling;
    if (next) {
      currentTarget = next;
      updateOverlay(currentTarget);
    }
  }
}

// --- Public API ---

export async function activate(
  newMode: InspectorMode,
  newIncludeScreenshot = true,
): Promise<void> {
  console.log('[Pablo] Overlay activate, mode:', newMode, 'includeScreenshot:', newIncludeScreenshot);
  if (active) deactivate();

  mode = newMode;
  includeScreenshot = newIncludeScreenshot;
  detectedStack = detectStack();
  active = true;

  createOverlay();

  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);

  if (mode === 'page') {
    currentTarget = getPageTarget();
    updateOverlay(currentTarget);
  }

  // If initial detection was generic, try async React confirmation via main world
  if (detectedStack === 'generic') {
    const isReact = await probeReactViaServiceWorker();
    if (isReact) {
      console.log('[Pablo] Async React probe confirmed React — upgrading stack');
      detectedStack = 'react';
    }
  }

  chrome.runtime.sendMessage({
    type: MSG.STATUS_UPDATE,
    status: 'inspecting',
    stack: detectedStack,
  });
}

export function deactivate(): void {
  console.log('[Pablo] Overlay deactivate');
  active = false;
  currentTarget = null;

  document.removeEventListener('mousemove', onMouseMove, true);
  document.removeEventListener('click', onClick, true);
  document.removeEventListener('keydown', onKeyDown, true);

  // Clear pending clipboard state before tearing down DOM.
  pendingScreenshotDataUrl = null;
  pendingContextText = null;
  toastVisible = false;
  if (dataClearTimer) {
    clearTimeout(dataClearTimer);
    dataClearTimer = null;
  }

  hideOverlay();
  destroyOverlay();

  chrome.runtime.sendMessage({
    type: MSG.STATUS_UPDATE,
    status: 'ready',
  });
}

async function captureComponentScreenshot(target: Element): Promise<ComponentScreenshot | undefined> {
  const rect = target.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return undefined;

  const prevVisibility = hostEl ? hostEl.style.visibility : null;
  if (hostEl) hostEl.style.visibility = 'hidden';

  try {
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const response = await chrome.runtime.sendMessage({
      type: MSG.CAPTURE_SCREENSHOT,
      rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
      dpr: window.devicePixelRatio || 1,
    });
    const screenshot = response?.screenshot;
    if (screenshot && typeof screenshot.dataUrl === 'string') {
      return screenshot as ComponentScreenshot;
    }
    return undefined;
  } catch (err) {
    console.log('[Pablo] Screenshot capture failed:', err);
    return undefined;
  } finally {
    if (hostEl) hostEl.style.visibility = prevVisibility ?? '';
  }
}
