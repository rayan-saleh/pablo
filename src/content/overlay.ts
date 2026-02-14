import type { InspectorMode, TechStack, ClipboardPayload, StrategyKey, ComponentData, ComponentTree, AnimationData, FramerMotionData, GsapData, DomMutationRecording, SemanticHint, InteractionPattern, ModuleDependency } from '../shared/types';
import { REACT_BASED_STACKS } from '../shared/types';
import { detectStack, probeReactViaServiceWorker } from './detector';
import { extractElement, getStrategy } from './extractor';
import { extractAnimations, mergeAnimationData } from './animation-extractor';
import { extractFonts } from './font-extractor';
import { recordMutations } from './mutation-recorder';
import { MSG } from '../shared/messages';

let active = false;
let mode: InspectorMode = 'component';
let currentTarget: Element | null = null;
let detectedStack: TechStack = 'generic';

// Shadow DOM host for the overlay
let hostEl: HTMLDivElement | null = null;
let overlayEl: HTMLDivElement | null = null;
let labelEl: HTMLDivElement | null = null;
let spinnerEl: HTMLDivElement | null = null;
let extracting = false;

function createOverlay(): void {
  if (hostEl) return;

  hostEl = document.createElement('div');
  hostEl.id = '__pablo-overlay-host';
  const shadow = hostEl.attachShadow({ mode: 'closed' });

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
    <span>Extracting…</span>
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes __pablo-spin { to { transform: rotate(360deg); } }
    @keyframes __pablo-pulse {
      0%, 100% { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
      50% { border-color: #8b5cf6; background: rgba(139, 92, 246, 0.15); }
    }
  `;

  shadow.appendChild(style);
  shadow.appendChild(overlayEl);
  shadow.appendChild(labelEl);
  shadow.appendChild(spinnerEl);
  document.documentElement.appendChild(hostEl);
}

function destroyOverlay(): void {
  if (hostEl) {
    hostEl.remove();
    hostEl = null;
    overlayEl = null;
    labelEl = null;
    spinnerEl = null;
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
  if (spinnerEl && overlayEl) {
    const rect = overlayEl.getBoundingClientRect();
    spinnerEl.style.display = 'flex';
    spinnerEl.style.left = `${rect.left + rect.width / 2 - 50}px`;
    spinnerEl.style.top = `${rect.top + rect.height / 2 - 12}px`;
  }
}

function hideExtracting(): void {
  extracting = false;
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
  const tag = el.tagName.toLowerCase();
  const cls = el.className && typeof el.className === 'string'
    ? '.' + el.className.trim().split(/\s+/).join('.')
    : '';
  return `${tag}${cls}`;
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
 * Request page-load DOM mutation data from the service worker (runs in main world).
 * Marks the target element so collection is scoped to its subtree.
 */
function collectDomMutationsViaServiceWorker(target: Element): Promise<any[] | null> {
  return new Promise((resolve) => {
    target.setAttribute('data-pablo-target-dom', '1');
    chrome.runtime.sendMessage({ type: MSG.COLLECT_DOM_MUTATIONS }, (response) => {
      target.removeAttribute('data-pablo-target-dom');
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

/**
 * Request webpack module dependency resolution from the service worker.
 * Must be called after fiber collection (needs __pablo_last_fiber_data in main world).
 */
function collectModulesViaServiceWorker(): Promise<{
  displayName: string;
  dependencies: ModuleDependency[];
}[] | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: MSG.COLLECT_MODULES }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(response?.data ?? null);
    });
  });
}

/**
 * Merge resolved module dependencies into a component tree.
 * Walks the tree and attaches deps to nodes matching by displayName.
 */
function mergeDependenciesIntoTree(
  tree: ComponentTree,
  moduleDeps: { displayName: string; dependencies: ModuleDependency[] }[],
): void {
  const depMap = new Map<string, ModuleDependency[]>();
  for (const entry of moduleDeps) {
    depMap.set(entry.displayName, entry.dependencies);
  }

  function walk(node: ComponentTree): void {
    const deps = depMap.get(node.name);
    if (deps) {
      node.dependencies = deps;
    }
    for (const child of node.children) {
      walk(child);
    }
  }

  walk(tree);
}

// --- Semantic Analysis ---

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
  if (!active) return;

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
  if (!active || extracting) return;

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
    // Start mutation recording immediately (runs for 3s in background)
    const mutationPromise = recordMutations(target, 3000);

    // Always extract HTML (styled)
    const html = extractElement(target, detectedStack);

    // Extract animations (universal CSS layer)
    let animations: AnimationData | undefined = extractAnimations(target);
    console.log('[Pablo] Animation extraction:', animations ? 'data found' : 'none');

    // Run strategy-specific animation extraction
    const strategy = getStrategy(detectedStack);
    if (strategy.extractAnimations) {
      const strategyAnimations = strategy.extractAnimations(target);
      animations = mergeAnimationData(animations, strategyAnimations);
    }

    // Collect GSAP data from main world (works for all stacks)
    const gsapData = await collectGsapViaServiceWorker(target);
    if (gsapData) {
      console.log('[Pablo] GSAP data found:', gsapData.version || 'detected',
        'scrollTriggers:', gsapData.scrollTriggers.length, 'tweens:', gsapData.tweens.length);
      if (gsapData.timelineTree) {
        console.log('[Pablo] GSAP timeline tree captured, children:', gsapData.timelineTree.children.length);
      }
      animations = mergeAnimationData(animations, { gsap: gsapData });
    }

    // Collect page-load DOM mutations from main world
    const pageLoadMutations = await collectDomMutationsViaServiceWorker(target);
    if (pageLoadMutations && pageLoadMutations.length > 0) {
      console.log('[Pablo] Page-load mutations:', pageLoadMutations.length);
      const plRecording: DomMutationRecording = {
        duration: pageLoadMutations[pageLoadMutations.length - 1].ts - pageLoadMutations[0].ts,
        mutations: pageLoadMutations.map((m: any) => {
          let changes: Record<string, string>;
          if (m.type === 'text' || m.type === 'style') {
            changes = { old: m.old, new: m.new };
          } else {
            changes = {};
            if (m.added) changes.added = m.added.join(', ');
            if (m.removed) changes.removed = m.removed.join(', ');
          }
          return {
            timestamp: m.ts,
            type: m.type,
            target: m.target,
            changes,
          };
        }),
      };
      animations = mergeAnimationData(animations, { pageLoadRecording: plRecording });
    }

    // Attempt fiber collection for React-based sites
    let tree: ComponentTree | undefined;
    if (REACT_BASED_STACKS.has(detectedStack) || detectedStack === 'framer') {
      console.log('[Pablo] Attempting fiber collection via service worker');
      const fiberData = await collectFiberViaServiceWorker(target);
      if (fiberData) {
        console.log('[Pablo] Fiber data received, components:', fiberData.components.length);
        tree = buildComponentTree(fiberData.components, fiberData.rootComponentName);

        // Merge Framer Motion data from fiber collection
        if (fiberData.motionComponents && fiberData.motionComponents.length > 0) {
          console.log('[Pablo] Framer Motion data found:', fiberData.motionComponents.length, 'components');
          animations = mergeAnimationData(animations, {
            framerMotion: fiberData.motionComponents,
          });
        }

        // Resolve webpack module dependencies for component source code
        const moduleDeps = await collectModulesViaServiceWorker();
        if (moduleDeps && tree) {
          console.log('[Pablo] Module dependencies resolved for', moduleDeps.length, 'component(s)');
          mergeDependenciesIntoTree(tree, moduleDeps);
        }
      } else {
        console.log('[Pablo] Fiber collection returned null, using HTML only');
      }
    }

    // Infer semantic roles
    const semanticHints = inferSemanticRoles(target);

    // Detect interaction patterns
    const interactionPatterns = detectInteractionPatterns(target);

    // Extract font data
    const fonts = extractFonts(target);
    console.log('[Pablo] Font extraction:', fonts.fontFaces.length, 'font-faces,', fonts.pseudoContent.length, 'pseudo-elements');

    // Generate summary
    const summary = generateComponentSummary(target, semanticHints);

    // Await mutation recording and merge into animations
    const domRecording = await mutationPromise;
    if (domRecording) {
      console.log('[Pablo] DOM mutation recording:', domRecording.mutations.length, 'mutations');
      animations = mergeAnimationData(animations, { domRecording });
    }

    // Build clipboard payload
    const payload: ClipboardPayload = {
      source: {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
        viewport: { width: window.innerWidth, height: window.innerHeight },
      },
      detection: {
        framework: detectedStack,
        strategy: getStrategyKey(detectedStack),
      },
      component: {
        selector: buildSelector(target),
        tag: target.tagName.toLowerCase(),
        html,
        ...(tree ? { tree } : {}),
        ...(animations ? { animations } : {}),
        ...(semanticHints.length > 0 ? { semanticHints } : {}),
        ...(interactionPatterns.length > 0 ? { interactionPatterns } : {}),
        ...(fonts && (fonts.fontFaces.length > 0 || fonts.pseudoContent.length > 0) ? { fonts } : {}),
        summary,
      },
    };

    const payloadStr = JSON.stringify(payload, null, 2);
    await navigator.clipboard.writeText(payloadStr);
    console.log('[Pablo] Clipboard copy success, size:', payloadStr.length);

    chrome.runtime.sendMessage({
      type: MSG.EXTRACTION_COMPLETE,
      meta: {
        tag: target.tagName.toLowerCase(),
        stack: detectedStack,
        size: payloadStr.length,
      },
    });

    hideExtracting();
    flashGreen();
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

function onKeyDown(e: KeyboardEvent): void {
  if (!active) return;

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

export async function activate(newMode: InspectorMode): Promise<void> {
  console.log('[Pablo] Overlay activate, mode:', newMode);
  if (active) deactivate();

  mode = newMode;
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

  hideOverlay();
  destroyOverlay();

  chrome.runtime.sendMessage({
    type: MSG.STATUS_UPDATE,
    status: 'ready',
  });
}
