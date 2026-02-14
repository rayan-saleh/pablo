import type { InspectorMode, TechStack } from '../shared/types';
import { REACT_BASED_STACKS } from '../shared/types';
import { detectStack } from './detector';
import { extractElement } from './extractor';
import { collectFiberData } from './fiber-collector';
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

function setOverlayAmber(): void {
  if (overlayEl) {
    overlayEl.style.borderColor = '#f59e0b';
    overlayEl.style.background = 'rgba(245, 158, 11, 0.1)';
    overlayEl.style.animation = 'cc-pulse 1.5s ease-in-out infinite';
  }
  if (labelEl) {
    labelEl.style.background = '#f59e0b';
  }
}

function setOverlayDefault(): void {
  if (overlayEl) {
    overlayEl.style.borderColor = '#3b82f6';
    overlayEl.style.background = 'rgba(59, 130, 246, 0.1)';
    overlayEl.style.animation = '';
  }
  if (labelEl) {
    labelEl.style.background = '#3b82f6';
  }
}

function setLabelText(text: string): void {
  if (labelEl) {
    labelEl.textContent = text;
  }
}

function getPageTarget(): Element {
  return document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
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

  // Branch: React-based sites attempt LLM reconstruction
  if (REACT_BASED_STACKS.has(detectedStack)) {
    console.log('[CC] Taking React extraction path');
    await handleReactExtraction(currentTarget);
  } else {
    console.log('[CC] Taking HTML extraction path');
    await handleHtmlExtraction(currentTarget);
  }
}

async function handleHtmlExtraction(target: Element): Promise<void> {
  try {
    const html = extractElement(target, detectedStack);
    await navigator.clipboard.writeText(html);
    console.log('[CC] Clipboard copy success, size:', html.length);

    chrome.runtime.sendMessage({
      type: MSG.EXTRACTION_COMPLETE,
      meta: {
        tag: target.tagName.toLowerCase(),
        stack: detectedStack,
        size: html.length,
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

async function handleReactExtraction(target: Element): Promise<void> {
  // Attempt to collect fiber data
  const payload = collectFiberData(target);

  if (!payload) {
    // Fall back to HTML extraction if fiber collection fails
    await handleHtmlExtraction(target);
    return;
  }

  // Show reconstructing state
  chrome.runtime.sendMessage({
    type: MSG.STATUS_UPDATE,
    status: 'reconstructing',
  });
  setOverlayAmber();
  setLabelText('Reconstructing...');

  // Disable mouse tracking while reconstructing
  document.removeEventListener('mousemove', onMouseMove, true);

  try {
    // Open port to service worker for long-running reconstruction
    const port = chrome.runtime.connect({ name: 'reconstruction' });

    const result = await new Promise<{ success: boolean; code: string; error?: string }>((resolve) => {
      port.onMessage.addListener((msg) => {
        if (msg.type === MSG.RECONSTRUCTION_PROGRESS) {
          const p = msg.progress;
          setLabelText(`${p.componentName} (${p.current}/${p.total}) — ${p.phase}`);
        } else if (msg.type === MSG.RECONSTRUCTION_COMPLETE) {
          resolve({ success: true, code: msg.result.code });
          port.disconnect();
        } else if (msg.type === MSG.RECONSTRUCTION_ERROR) {
          resolve({ success: false, code: '', error: msg.error });
          port.disconnect();
        }
      });

      port.postMessage({
        type: MSG.RECONSTRUCTION_START,
        payload,
      });
    });

    console.log('[CC] Reconstruction result received, success:', result.success);
    if (result.success && result.code) {
      await navigator.clipboard.writeText(result.code);
      console.log('[CC] Clipboard copy success, size:', result.code.length);

      chrome.runtime.sendMessage({
        type: MSG.EXTRACTION_COMPLETE,
        meta: {
          tag: target.tagName.toLowerCase(),
          stack: detectedStack,
          size: result.code.length,
        },
      });

      flashGreen();
    } else {
      // Reconstruction failed — fall back to HTML extraction
      console.warn('[Component Copier] Reconstruction failed:', result.error);
      setOverlayDefault();
      await handleHtmlExtraction(target);
    }
  } catch (err) {
    console.error('[Component Copier] Reconstruction error:', err);
    // Fall back to HTML
    setOverlayDefault();
    await handleHtmlExtraction(target);
  } finally {
    // Re-enable mouse tracking
    setOverlayDefault();
    if (active) {
      document.addEventListener('mousemove', onMouseMove, true);
    }
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

export function activate(newMode: InspectorMode): void {
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
