import { MSG, type ExtensionMessage } from '../shared/messages';

// --- Main-world functions (self-contained, no closures) ---

/**
 * Probes for React by checking DOM elements for __reactFiber$ keys.
 * Runs in the page's main world via chrome.scripting.executeScript.
 */
function probeReactInMainWorld(): boolean {
  const candidates: Element[] = [];

  // Common React root containers
  for (const sel of ['#__next', '#root', '#app', '#main']) {
    const el = document.querySelector(sel);
    if (el) candidates.push(el);
  }

  // Also check direct children of body
  for (const child of Array.from(document.body.children).slice(0, 5)) {
    if (!candidates.includes(child)) candidates.push(child);
  }

  // For each candidate, check it + a few of its descendants
  for (const root of candidates) {
    const toCheck = [root, ...Array.from(root.querySelectorAll('*')).slice(0, 20)];
    for (const el of toCheck) {
      const keys = Object.keys(el);
      if (keys.some(k =>
        k.startsWith('__reactFiber$') ||
        k.startsWith('__reactInternalInstance$') ||
        k.startsWith('__reactContainer$')
      )) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Collects React fiber data from the element marked with [data-cc-target].
 * Runs in the page's main world via chrome.scripting.executeScript.
 * Returns serialized component tree data or null.
 */
function collectFiberInMainWorld(): {
  components: {
    displayName: string;
    sourceCode: string;
    instances: { props: Record<string, unknown> }[];
    children: string[];
  }[];
  rootComponentName: string;
  motionComponents: {
    componentName: string;
    initial?: Record<string, unknown>;
    animate?: Record<string, unknown>;
    exit?: Record<string, unknown>;
    whileHover?: Record<string, unknown>;
    whileTap?: Record<string, unknown>;
    whileInView?: Record<string, unknown>;
    transition?: Record<string, unknown>;
    variants?: Record<string, unknown>;
    layoutId?: string;
    layout?: boolean | string;
  }[];
} | null {
  const MAX_COMPONENT_TYPES = 50;

  const target = document.querySelector('[data-cc-target]');
  if (!target) return null;

  // Remove marker immediately so it doesn't leak into collected HTML
  target.removeAttribute('data-cc-target');

  // --- Helpers (all inlined for main world isolation) ---

  function getFiber(element: Element): any {
    const fiberKey = Object.keys(element).find(k => k.startsWith('__reactFiber$'));
    return fiberKey ? (element as any)[fiberKey] : null;
  }

  function unwrapComponentType(type: any): any {
    if (!type) return type;
    if (type.$$typeof?.toString() === 'Symbol(react.memo)') {
      return unwrapComponentType(type.type);
    }
    if (type.$$typeof?.toString() === 'Symbol(react.forward_ref)') {
      return unwrapComponentType(type.render);
    }
    if (type.$$typeof?.toString() === 'Symbol(react.lazy)') {
      if (type._payload?._result) {
        return unwrapComponentType(type._payload._result);
      }
    }
    return type;
  }

  function getComponentName(type: any): string {
    if (!type) return 'Unknown';
    return type.displayName || type.name || 'Anonymous';
  }

  function findComponentFiber(fiber: any): any {
    let current = fiber;
    let firstComponent: any = null;
    let hops = 0;
    while (current && hops < 30) {
      if (current.tag === 0 || current.tag === 1) {
        if (!firstComponent) firstComponent = current;
        const rawType = unwrapComponentType(current.type);
        const name = getComponentName(rawType);
        if (name !== 'Anonymous' && name !== 'Unknown') return current;
      }
      current = current.return;
      hops++;
    }
    return firstComponent;
  }

  function findDomNode(fiber: any): Element | null {
    let node = fiber;
    while (node) {
      if ((node.tag === 5 || node.tag === 6) && node.stateNode instanceof Element) {
        return node.stateNode;
      }
      node = node.child;
    }
    return null;
  }

  function sanitizeValue(value: unknown, seen: WeakSet<object>, depth: number): unknown {
    if (depth > 10) return '[MaxDepth]';
    if (value === null || value === undefined) return value;

    switch (typeof value) {
      case 'string':
        return value.length > 500 ? value.slice(0, 500) + '...' : value;
      case 'number':
      case 'boolean':
        return value;
      case 'function':
        return '[Function]';
      case 'symbol':
        return value.toString();
      case 'object': {
        if ((value as any).$$typeof?.toString()?.includes('react.element')) {
          return '[ReactElement]';
        }
        if (seen.has(value as object)) return '[Circular]';
        seen.add(value as object);

        if (Array.isArray(value)) {
          return value.slice(0, 20).map(v => sanitizeValue(v, seen, depth + 1));
        }

        const result: Record<string, unknown> = {};
        const keys = Object.keys(value as object);
        for (const key of keys.slice(0, 30)) {
          if (key === 'children') {
            result[key] = '[Children]';
            continue;
          }
          result[key] = sanitizeValue((value as any)[key], seen, depth + 1);
        }
        return result;
      }
      default:
        return String(value);
    }
  }

  function sanitizeProps(props: Record<string, unknown>): Record<string, unknown> {
    return sanitizeValue(props, new WeakSet(), 0) as Record<string, unknown>;
  }

  // --- Framer Motion prop keys ---
  const MOTION_PROP_KEYS = [
    'initial', 'animate', 'exit', 'whileHover', 'whileTap', 'whileInView',
    'transition', 'variants', 'layoutId', 'layout',
  ];

  function isMotionComponent(props: Record<string, unknown>): boolean {
    return MOTION_PROP_KEYS.some(key => key in props && props[key] !== undefined);
  }

  function extractMotionProps(
    componentName: string,
    props: Record<string, unknown>,
  ): {
    componentName: string;
    initial?: Record<string, unknown>;
    animate?: Record<string, unknown>;
    exit?: Record<string, unknown>;
    whileHover?: Record<string, unknown>;
    whileTap?: Record<string, unknown>;
    whileInView?: Record<string, unknown>;
    transition?: Record<string, unknown>;
    variants?: Record<string, unknown>;
    layoutId?: string;
    layout?: boolean | string;
  } {
    const motion: Record<string, unknown> = { componentName };
    for (const key of MOTION_PROP_KEYS) {
      if (key in props && props[key] !== undefined) {
        const val = props[key];
        if (key === 'layoutId' && typeof val === 'string') {
          motion[key] = val;
        } else if (key === 'layout' && (typeof val === 'boolean' || typeof val === 'string')) {
          motion[key] = val;
        } else if (typeof val === 'object' && val !== null) {
          motion[key] = sanitizeValue(val, new WeakSet(), 0);
        }
      }
    }
    return motion as any;
  }

  // --- Main collection logic ---

  const fiber = getFiber(target);
  if (!fiber) return null;

  const rootFiber = findComponentFiber(fiber);
  if (!rootFiber) return null;

  interface CollectedComponent {
    displayName: string;
    sourceCode: string;
    instances: { props: Record<string, unknown> }[];
    children: string[];
  }

  const componentMap = new Map<string, CollectedComponent>();
  const typeToName = new Map<Function, string>();
  const motionComponents: {
    componentName: string;
    initial?: Record<string, unknown>;
    animate?: Record<string, unknown>;
    exit?: Record<string, unknown>;
    whileHover?: Record<string, unknown>;
    whileTap?: Record<string, unknown>;
    whileInView?: Record<string, unknown>;
    transition?: Record<string, unknown>;
    variants?: Record<string, unknown>;
    layoutId?: string;
    layout?: boolean | string;
  }[] = [];
  const seenMotionComponents = new Set<string>();

  function collectChildNames(parentFiber: any, parentName: string): void {
    const parentData = componentMap.get(parentName)!;
    let child = parentFiber.child;
    while (child) {
      if (child.tag === 0 || child.tag === 1) {
        const rawType = unwrapComponentType(child.type);
        const childName = getComponentName(rawType);
        if (!typeToName.has(rawType)) typeToName.set(rawType, childName);
        const name = typeToName.get(rawType)!;
        if (!parentData.children.includes(name)) parentData.children.push(name);
      }
      child = child.sibling;
    }
  }

  const MAX_SOURCE_LENGTH = 2000;
  const MAX_INSTANCES_PER_TYPE = 3;

  function walkFiber(fiber: any): void {
    if (!fiber) return;

    const isComponent = fiber.tag === 0 || fiber.tag === 1;
    if (isComponent) {
      const rawType = unwrapComponentType(fiber.type);
      const name = getComponentName(rawType);
      if (!typeToName.has(rawType)) typeToName.set(rawType, name);
      const displayName = typeToName.get(rawType)!;

      if (!componentMap.has(displayName)) {
        let sourceCode = '';
        try {
          sourceCode = rawType.toString();
          if (sourceCode.length > MAX_SOURCE_LENGTH) {
            sourceCode = sourceCode.slice(0, MAX_SOURCE_LENGTH) + '...';
          }
        } catch { sourceCode = '/* source unavailable */'; }
        componentMap.set(displayName, { displayName, sourceCode, instances: [], children: [] });
      }

      const data = componentMap.get(displayName)!;
      const fiberProps = fiber.memoizedProps || {};
      if (data.instances.length < MAX_INSTANCES_PER_TYPE) {
        data.instances.push({
          props: sanitizeProps(fiberProps),
        });
      }

      // Detect Framer Motion components
      if (isMotionComponent(fiberProps) && !seenMotionComponents.has(displayName)) {
        seenMotionComponents.add(displayName);
        motionComponents.push(extractMotionProps(displayName, fiberProps));
      }

      collectChildNames(fiber, displayName);
    }

    if (fiber.child) walkFiber(fiber.child);
    if (fiber.sibling) walkFiber(fiber.sibling);
  }

  walkFiber(rootFiber);

  if (componentMap.size === 0 || componentMap.size > MAX_COMPONENT_TYPES) return null;

  // Topological sort: leaves first
  const visited = new Set<string>();
  const sorted: CollectedComponent[] = [];

  function visit(name: string) {
    if (visited.has(name)) return;
    visited.add(name);
    const data = componentMap.get(name);
    if (!data) return;
    for (const childName of data.children) visit(childName);
    sorted.push(data);
  }

  for (const name of componentMap.keys()) visit(name);

  const rootName = getComponentName(unwrapComponentType(rootFiber.type));

  return { components: sorted, rootComponentName: rootName, motionComponents };
}

/**
 * Collects GSAP animation data from the page's main world.
 * Checks for window.gsap, ScrollTrigger instances, and active tweens.
 */
function collectGsapInMainWorld(): {
  detected: boolean;
  version?: string;
  scrollTriggers: {
    triggerSelector: string;
    scroller?: string;
    start?: string;
    end?: string;
    pin?: boolean;
    scrub?: boolean | number;
    description?: string;
  }[];
  tweens: {
    targetSelector: string;
    type: string;
    properties: Record<string, unknown>;
    duration?: number;
    delay?: number;
    ease?: string;
  }[];
} | null {
  // Helper to describe an element as a CSS selector
  function describeElement(el: Element | null): string {
    if (!el || !(el instanceof Element)) return 'unknown';
    const tag = el.tagName.toLowerCase();
    if (el.id) return `${tag}#${el.id}`;
    const cls = el.className && typeof el.className === 'string'
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';
    return `${tag}${cls}` || tag;
  }

  // Search for GSAP in various locations
  const w = window as any;
  const gsap = w.gsap || w.TweenMax?.__proto__?.constructor || null;
  const ScrollTrigger = w.ScrollTrigger || (gsap && gsap.core?.globals?.()?.ScrollTrigger) || null;

  // Also check for GSAP markers in the DOM (even if gsap object isn't on window)
  const hasGsapMarkers = document.querySelector('.gsap-marker-start, .gsap-marker-end, [data-scroll-container]') !== null;

  // Check if any elements have GSAP-set inline styles (opacity:0 is a strong signal)
  let gsapStyleSignals = 0;
  const allElements = document.querySelectorAll('[style*="opacity: 0"], [style*="opacity:0"], [style*="visibility: hidden"], [style*="translate"]');
  // Filter to only count elements that look like scroll-reveal targets (not intentionally hidden elements like screen-reader text)
  for (const el of Array.from(allElements).slice(0, 50)) {
    const rect = el.getBoundingClientRect();
    // Skip tiny elements (likely screen-reader only)
    if (rect.width < 10 || rect.height < 10) continue;
    const style = el.getAttribute('style') || '';
    if (style.includes('opacity: 0') || style.includes('opacity:0')) {
      gsapStyleSignals++;
    }
  }

  if (!gsap && !ScrollTrigger && !hasGsapMarkers && gsapStyleSignals === 0) {
    return null;
  }

  const result: {
    detected: boolean;
    version?: string;
    scrollTriggers: any[];
    tweens: any[];
  } = {
    detected: true,
    scrollTriggers: [],
    tweens: [],
  };

  // Get GSAP version
  if (gsap?.version) {
    result.version = gsap.version;
  }

  // Enumerate ScrollTrigger instances
  if (ScrollTrigger && typeof ScrollTrigger.getAll === 'function') {
    try {
      const triggers = ScrollTrigger.getAll();
      for (const trigger of triggers.slice(0, 30)) {
        const triggerEl = trigger.trigger;
        const scrollerEl = trigger.scroller;
        const vars = trigger.vars || {};

        result.scrollTriggers.push({
          triggerSelector: describeElement(triggerEl),
          scroller: scrollerEl && scrollerEl !== document.documentElement ? describeElement(scrollerEl) : undefined,
          start: typeof vars.start === 'string' ? vars.start : (trigger.start != null ? String(trigger.start) : undefined),
          end: typeof vars.end === 'string' ? vars.end : (trigger.end != null ? String(trigger.end) : undefined),
          pin: vars.pin ? true : undefined,
          scrub: vars.scrub != null ? vars.scrub : undefined,
          description: triggerEl ? `ScrollTrigger on ${describeElement(triggerEl)}` : 'ScrollTrigger instance',
        });
      }
    } catch {
      // ScrollTrigger.getAll failed
    }
  }

  // Enumerate active tweens from the global timeline
  if (gsap && typeof gsap.globalTimeline?.getChildren === 'function') {
    try {
      const tweens = gsap.globalTimeline.getChildren(true, true, false).slice(0, 30);
      for (const tween of tweens) {
        if (!tween.targets || typeof tween.targets !== 'function') continue;
        const targets = tween.targets();
        if (!targets || targets.length === 0) continue;

        const target = targets[0];
        if (!(target instanceof Element)) continue;

        const vars = tween.vars || {};
        const properties: Record<string, unknown> = {};
        for (const key of Object.keys(vars)) {
          if (['onComplete', 'onUpdate', 'onStart', 'onReverseComplete', 'callbackScope',
               'lazy', 'immediateRender', 'id', 'scrollTrigger', 'overwrite'].includes(key)) continue;
          if (typeof vars[key] === 'function') continue;
          properties[key] = vars[key];
        }

        // Determine tween type
        let type = 'to';
        if (tween.data === 'isSet' || tween._dur === 0) type = 'set';
        else if (tween.data === 'isFromStart' || tween._from) type = 'from';

        result.tweens.push({
          targetSelector: describeElement(target),
          type,
          properties,
          duration: tween._dur,
          delay: tween._delay || undefined,
          ease: vars.ease || undefined,
        });
      }
    } catch {
      // Timeline enumeration failed
    }
  }

  // If we found no API data but detected signals, still report detection
  if (result.scrollTriggers.length === 0 && result.tweens.length === 0) {
    if (gsapStyleSignals > 0) {
      result.scrollTriggers.push({
        triggerSelector: 'multiple-elements',
        description: `${gsapStyleSignals} elements with inline opacity:0 detected (likely GSAP scroll-reveal)`,
      });
    }
    if (hasGsapMarkers) {
      result.scrollTriggers.push({
        triggerSelector: 'page',
        description: 'GSAP ScrollTrigger debug markers detected in DOM',
      });
    }
  }

  return result;
}

// --- Message routing ---

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  console.log('[CC] Service worker received message:', message.type);

  switch (message.type) {
    case MSG.STATUS_UPDATE:
    case MSG.EXTRACTION_COMPLETE:
      break;

    case MSG.ACTIVATE_INSPECTOR:
    case MSG.DEACTIVATE_INSPECTOR:
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId) {
          chrome.tabs.sendMessage(tabId, message, () => {
            void chrome.runtime.lastError;
          });
        }
      });
      break;

    case MSG.DETECT_STACK:
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId) {
          chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
              sendResponse({ stack: 'generic' });
              return;
            }
            sendResponse(response);
          });
        } else {
          sendResponse({ stack: 'generic' });
        }
      });
      return true;

    case MSG.PROBE_REACT: {
      const tabId = sender.tab?.id;
      if (!tabId) {
        sendResponse({ isReact: false });
        return true;
      }
      chrome.scripting.executeScript({
        target: { tabId },
        world: 'MAIN',
        func: probeReactInMainWorld,
      }).then((results) => {
        const isReact = results?.[0]?.result === true;
        sendResponse({ isReact });
      }).catch(() => {
        sendResponse({ isReact: false });
      });
      return true;
    }

    case MSG.COLLECT_FIBER: {
      const tabId = sender.tab?.id;
      if (!tabId) {
        sendResponse({ data: null });
        return true;
      }
      chrome.scripting.executeScript({
        target: { tabId },
        world: 'MAIN',
        func: collectFiberInMainWorld,
      }).then((results) => {
        sendResponse({ data: results?.[0]?.result ?? null });
      }).catch(() => {
        sendResponse({ data: null });
      });
      return true;
    }

    case MSG.COLLECT_GSAP: {
      const tabId = sender.tab?.id;
      if (!tabId) {
        sendResponse({ data: null });
        return true;
      }
      chrome.scripting.executeScript({
        target: { tabId },
        world: 'MAIN',
        func: collectGsapInMainWorld,
      }).then((results) => {
        sendResponse({ data: results?.[0]?.result ?? null });
      }).catch(() => {
        sendResponse({ data: null });
      });
      return true;
    }
  }

  sendResponse({ ok: true });
  return true;
});
