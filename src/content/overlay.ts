import type { InspectorMode, TechStack, ClipboardPayload, StrategyKey, ComponentData, ComponentTree, AnimationData, FramerMotionData, GsapData } from '../shared/types';
import { REACT_BASED_STACKS } from '../shared/types';
import { detectStack, probeReactViaServiceWorker } from './detector';
import { extractElement, getStrategy } from './extractor';
import { extractAnimations, mergeAnimationData } from './animation-extractor';
import { MSG } from '../shared/messages';

let active = false;
let mode: InspectorMode = 'component';
let currentTarget: Element | null = null;
let detectedStack: TechStack = 'generic';

// Shadow DOM host for the overlay
let hostEl: HTMLDivElement | null = null;
let overlayEl: HTMLDivElement | null = null;
let labelEl: HTMLDivElement | null = null;

function createOverlay(): void {
  if (hostEl) return;

  hostEl = document.createElement('div');
  hostEl.id = '__cc-overlay-host';
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

  shadow.appendChild(overlayEl);
  shadow.appendChild(labelEl);
  document.documentElement.appendChild(hostEl);
}

function destroyOverlay(): void {
  if (hostEl) {
    hostEl.remove();
    hostEl = null;
    overlayEl = null;
    labelEl = null;
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
 * Marks the target element with data-cc-target, sends COLLECT_FIBER, removes attribute.
 */
function collectFiberViaServiceWorker(target: Element): Promise<{
  components: ComponentData[];
  rootComponentName: string;
  motionComponents?: FramerMotionData[];
} | null> {
  return new Promise((resolve) => {
    target.setAttribute('data-cc-target', '1');
    chrome.runtime.sendMessage({ type: MSG.COLLECT_FIBER }, (response) => {
      target.removeAttribute('data-cc-target');
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
 */
function collectGsapViaServiceWorker(): Promise<GsapData | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: MSG.COLLECT_GSAP }, (response) => {
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
  if (!active) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  if (!currentTarget) return;

  const tag = currentTarget.tagName.toLowerCase();
  const cls = currentTarget.className && typeof currentTarget.className === 'string'
    ? currentTarget.className.trim().split(/\s+/)[0]
    : '';
  console.log('[CC] Click target:', tag + (cls ? '.' + cls : ''));

  await handleExtraction(currentTarget);
}

async function handleExtraction(target: Element): Promise<void> {
  try {
    // Always extract HTML (styled)
    const html = extractElement(target, detectedStack);

    // Extract animations (universal CSS layer)
    let animations: AnimationData | undefined = extractAnimations(target);
    console.log('[CC] Animation extraction:', animations ? 'data found' : 'none');

    // Run strategy-specific animation extraction
    const strategy = getStrategy(detectedStack);
    if (strategy.extractAnimations) {
      const strategyAnimations = strategy.extractAnimations(target);
      animations = mergeAnimationData(animations, strategyAnimations);
    }

    // Collect GSAP data from main world (works for all stacks)
    const gsapData = await collectGsapViaServiceWorker();
    if (gsapData) {
      console.log('[CC] GSAP data found:', gsapData.version || 'detected',
        'scrollTriggers:', gsapData.scrollTriggers.length, 'tweens:', gsapData.tweens.length);
      animations = mergeAnimationData(animations, { gsap: gsapData });
    }

    // Attempt fiber collection for React-based sites
    let tree: ComponentTree | undefined;
    if (REACT_BASED_STACKS.has(detectedStack) || detectedStack === 'framer') {
      console.log('[CC] Attempting fiber collection via service worker');
      const fiberData = await collectFiberViaServiceWorker(target);
      if (fiberData) {
        console.log('[CC] Fiber data received, components:', fiberData.components.length);
        tree = buildComponentTree(fiberData.components, fiberData.rootComponentName);

        // Merge Framer Motion data from fiber collection
        if (fiberData.motionComponents && fiberData.motionComponents.length > 0) {
          console.log('[CC] Framer Motion data found:', fiberData.motionComponents.length, 'components');
          animations = mergeAnimationData(animations, {
            framerMotion: fiberData.motionComponents,
          });
        }
      } else {
        console.log('[CC] Fiber collection returned null, using HTML only');
      }
    }

    // Build clipboard payload
    const payload: ClipboardPayload = {
      source: {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
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
      },
    };

    const payloadStr = JSON.stringify(payload, null, 2);
    await navigator.clipboard.writeText(payloadStr);
    console.log('[CC] Clipboard copy success, size:', payloadStr.length);

    chrome.runtime.sendMessage({
      type: MSG.EXTRACTION_COMPLETE,
      meta: {
        tag: target.tagName.toLowerCase(),
        stack: detectedStack,
        size: payloadStr.length,
      },
    });

    flashGreen();
  } catch (err) {
    console.error('[Component Copier] Extraction failed:', err);
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
    setTimeout(() => {
      if (overlayEl) {
        overlayEl.style.borderColor = '#3b82f6';
        overlayEl.style.background = 'rgba(59, 130, 246, 0.1)';
      }
    }, 500);
  }
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
  console.log('[CC] Overlay activate, mode:', newMode);
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
      console.log('[CC] Async React probe confirmed React — upgrading stack');
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
  console.log('[CC] Overlay deactivate');
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
