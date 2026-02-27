import type { InteractionAnimationData, ActiveAnimationData, DomMutationRecord, ComputedStyleDiff } from '../shared/types';
import { compressMutations } from './mutation-recorder';

const TRACKED_STYLE_PROPERTIES = [
  'opacity', 'transform', 'visibility', 'background-color', 'color',
  'border-color', 'box-shadow', 'text-decoration', 'outline',
  'scale', 'translate', 'rotate', 'filter',
];

function buildSelector(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (el.id) return `${tag}#${el.id}`;
  const cls = el.className && typeof el.className === 'string'
    ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
    : '';
  return `${tag}${cls}` || tag;
}

function snapshotStyles(el: Element): Map<string, string> {
  const computed = window.getComputedStyle(el);
  const styles = new Map<string, string>();
  for (const prop of TRACKED_STYLE_PROPERTIES) {
    styles.set(prop, computed.getPropertyValue(prop));
  }
  styles.set('__class', el.className && typeof el.className === 'string' ? el.className : '');
  return styles;
}

function diffStyles(
  selector: string,
  before: Map<string, string>,
  after: Map<string, string>,
): ComputedStyleDiff[] {
  const diffs: ComputedStyleDiff[] = [];
  for (const [prop, beforeVal] of before) {
    if (prop === '__class') continue;
    const afterVal = after.get(prop) || '';
    if (beforeVal !== afterVal) {
      diffs.push({ selector, property: prop, before: beforeVal, after: afterVal });
    }
  }
  const beforeClass = before.get('__class') || '';
  const afterClass = after.get('__class') || '';
  if (beforeClass !== afterClass) {
    diffs.push({ selector, property: 'class', before: beforeClass, after: afterClass });
  }
  return diffs;
}

function extractActiveAnimations(element: Element): ActiveAnimationData[] {
  const results: ActiveAnimationData[] = [];
  let animations: Animation[];
  try {
    animations = element.getAnimations({ subtree: true });
  } catch {
    return results;
  }

  for (const anim of animations) {
    const timing = anim.effect?.getTiming();
    if (!timing) continue;

    const keyframes: { offset: number; properties: Record<string, string> }[] = [];
    if (anim.effect && 'getKeyframes' in anim.effect) {
      const kfs = (anim.effect as KeyframeEffect).getKeyframes();
      for (const kf of kfs) {
        const props: Record<string, string> = {};
        for (const [key, value] of Object.entries(kf)) {
          if (key === 'offset' || key === 'computedOffset' || key === 'easing' || key === 'composite') continue;
          if (typeof value === 'string') props[key] = value;
        }
        keyframes.push({
          offset: (kf.offset ?? kf.computedOffset ?? 0) as number,
          properties: props,
        });
      }
    }

    let animationName = '';
    if (anim instanceof CSSAnimation) animationName = anim.animationName;
    else if (anim instanceof CSSTransition) animationName = `transition:${anim.transitionProperty}`;
    else animationName = 'web-animation';

    results.push({
      animationName,
      playState: anim.playState,
      timing: {
        duration: typeof timing.duration === 'number' ? timing.duration : 0,
        delay: timing.delay ?? 0,
        easing: (timing.easing as string) ?? 'linear',
        iterations: timing.iterations ?? 1,
        direction: (timing.direction as string) ?? 'normal',
        fill: (timing.fill as string) ?? 'none',
      },
      keyframes,
    });
  }
  return results;
}

function observeMutations(
  target: Element,
  durationMs: number,
): Promise<DomMutationRecord[]> {
  return new Promise((resolve) => {
    const mutations: DomMutationRecord[] = [];
    const startTime = performance.now();

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (mutations.length >= 100) break;
        const timestamp = Math.round(performance.now() - startTime);
        const targetEl = record.target instanceof Element
          ? record.target
          : record.target.parentElement;
        if (!targetEl) continue;
        const selector = buildSelector(targetEl);

        if (record.type === 'attributes' && record.attributeName === 'style') {
          mutations.push({
            timestamp,
            type: 'style',
            target: selector,
            changes: {
              old: (record.oldValue || '').slice(0, 300),
              new: (targetEl.getAttribute('style') || '').slice(0, 300),
            },
          });
        } else if (record.type === 'attributes' && record.attributeName === 'class') {
          mutations.push({
            timestamp,
            type: 'class',
            target: selector,
            changes: {
              old: (record.oldValue || ''),
              new: (targetEl.getAttribute('class') || ''),
            },
          });
        }
      }
    });

    observer.observe(target, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['style', 'class'],
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(mutations);
    }, durationMs);
  });
}

interface PhaseResult {
  webAnimations: ActiveAnimationData[];
  domMutations: DomMutationRecord[];
  computedStyleDiffs: ComputedStyleDiff[];
}

function getTrackElements(target: Element): Element[] {
  return [target, ...Array.from(target.children).slice(0, 10)];
}

async function simulateHover(target: Element): Promise<PhaseResult> {
  const elements = getTrackElements(target);
  const beforeSnapshots = new Map<Element, Map<string, string>>();
  for (const el of elements) beforeSnapshots.set(el, snapshotStyles(el));

  const mutationPromise = observeMutations(target, 1200);
  const rect = target.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  // Enter
  target.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, clientX: cx, clientY: cy }));
  target.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false, clientX: cx, clientY: cy }));
  target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: cx, clientY: cy }));
  target.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: cx, clientY: cy }));

  await new Promise(r => setTimeout(r, 900));
  const webAnimations = extractActiveAnimations(target);

  const afterSnapshots = new Map<Element, Map<string, string>>();
  for (const el of elements) afterSnapshots.set(el, snapshotStyles(el));

  // Leave
  target.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, clientX: cx, clientY: cy }));
  target.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false, clientX: cx, clientY: cy }));
  target.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientX: cx, clientY: cy }));

  const computedStyleDiffs: ComputedStyleDiff[] = [];
  for (const el of elements) {
    const before = beforeSnapshots.get(el);
    const after = afterSnapshots.get(el);
    if (before && after) {
      computedStyleDiffs.push(...diffStyles(buildSelector(el), before, after));
    }
  }

  const domMutations = compressMutations(await mutationPromise);
  return { webAnimations, domMutations, computedStyleDiffs };
}

async function simulateClick(target: Element): Promise<PhaseResult> {
  const elements = getTrackElements(target);
  const beforeSnapshots = new Map<Element, Map<string, string>>();
  for (const el of elements) beforeSnapshots.set(el, snapshotStyles(el));

  const mutationPromise = observeMutations(target, 1800);
  const rect = target.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const preventNav = (e: Event) => e.preventDefault();
  target.addEventListener('click', preventNav, { capture: true, once: true });

  target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: cx, clientY: cy }));
  target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: cx, clientY: cy }));
  await new Promise(r => setTimeout(r, 100));
  target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: cx, clientY: cy }));
  target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: cx, clientY: cy }));
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: cx, clientY: cy }));

  await new Promise(r => setTimeout(r, 1500));
  target.removeEventListener('click', preventNav, { capture: true } as EventListenerOptions);

  const webAnimations = extractActiveAnimations(target);
  const afterSnapshots = new Map<Element, Map<string, string>>();
  for (const el of elements) afterSnapshots.set(el, snapshotStyles(el));

  const computedStyleDiffs: ComputedStyleDiff[] = [];
  for (const el of elements) {
    const before = beforeSnapshots.get(el);
    const after = afterSnapshots.get(el);
    if (before && after) {
      computedStyleDiffs.push(...diffStyles(buildSelector(el), before, after));
    }
  }

  const domMutations = compressMutations(await mutationPromise);
  return { webAnimations, domMutations, computedStyleDiffs };
}

async function simulateFocus(target: Element): Promise<PhaseResult> {
  // Find focusable child or use target itself
  const focusable = target.querySelector('input, textarea, button, a, select, [tabindex]') || target;
  const elements = getTrackElements(target);
  const beforeSnapshots = new Map<Element, Map<string, string>>();
  for (const el of elements) beforeSnapshots.set(el, snapshotStyles(el));

  const mutationPromise = observeMutations(target, 1300);

  focusable.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  focusable.dispatchEvent(new FocusEvent('focus', { bubbles: false }));
  if (focusable instanceof HTMLElement) {
    try { focusable.focus(); } catch { /* some elements can't be focused */ }
  }

  await new Promise(r => setTimeout(r, 1000));
  const webAnimations = extractActiveAnimations(target);

  const afterSnapshots = new Map<Element, Map<string, string>>();
  for (const el of elements) afterSnapshots.set(el, snapshotStyles(el));

  // Blur
  focusable.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  focusable.dispatchEvent(new FocusEvent('blur', { bubbles: false }));
  if (focusable instanceof HTMLElement) {
    try { focusable.blur(); } catch { /* */ }
  }

  const computedStyleDiffs: ComputedStyleDiff[] = [];
  for (const el of elements) {
    const before = beforeSnapshots.get(el);
    const after = afterSnapshots.get(el);
    if (before && after) {
      computedStyleDiffs.push(...diffStyles(buildSelector(el), before, after));
    }
  }

  const domMutations = compressMutations(await mutationPromise);
  return { webAnimations, domMutations, computedStyleDiffs };
}

function hasData(result: PhaseResult): boolean {
  return result.webAnimations.length > 0 ||
    result.domMutations.length > 0 ||
    result.computedStyleDiffs.length > 0;
}

export async function captureInteractionAnimations(target: Element): Promise<InteractionAnimationData> {
  const data: InteractionAnimationData = {};

  const hoverResult = await simulateHover(target);
  if (hasData(hoverResult)) data.hover = hoverResult;

  const clickResult = await simulateClick(target);
  if (hasData(clickResult)) data.click = clickResult;

  const focusResult = await simulateFocus(target);
  if (hasData(focusResult)) data.focus = focusResult;

  return data;
}
