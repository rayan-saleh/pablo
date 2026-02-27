import type { ScrollAnimationData, ActiveAnimationData, DomMutationRecord, ComputedStyleDiff } from '../shared/types';
import { compressMutations } from './mutation-recorder';

const TRACKED_STYLE_PROPERTIES = [
  'opacity', 'transform', 'visibility',
  'clip-path', 'filter',
  'margin-top', 'margin-left',
  'translate', 'scale', 'rotate',
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
  // Also snapshot classes
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
  // Class diff
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
        if (mutations.length >= 200) break;
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

export async function captureScrollAnimations(target: Element): Promise<ScrollAnimationData> {
  const startTime = performance.now();
  const selector = buildSelector(target);

  // Snapshot styles on target and immediate children before scrolling
  const elementsToTrack = [target, ...Array.from(target.children).slice(0, 20)];
  const beforeSnapshots = new Map<Element, Map<string, string>>();
  for (const el of elementsToTrack) {
    beforeSnapshots.set(el, snapshotStyles(el));
  }

  // Scroll target out of viewport (scroll to top of page)
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  await new Promise(r => setTimeout(r, 300));

  // Start observing mutations
  const mutationPromise = observeMutations(target, 3000);

  // Smooth scroll target into view
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Wait for scroll to complete and animations to settle
  await new Promise(r => setTimeout(r, 2500));

  // Collect active animations
  const webAnimationSnapshots = extractActiveAnimations(target);

  // Snapshot styles after scroll
  const afterSnapshots = new Map<Element, Map<string, string>>();
  for (const el of elementsToTrack) {
    afterSnapshots.set(el, snapshotStyles(el));
  }

  // Compute style diffs
  const computedStyleDiffs: ComputedStyleDiff[] = [];
  for (const el of elementsToTrack) {
    const before = beforeSnapshots.get(el);
    const after = afterSnapshots.get(el);
    if (before && after) {
      const elSelector = el === target ? selector : buildSelector(el);
      computedStyleDiffs.push(...diffStyles(elSelector, before, after));
    }
  }

  // Check if IntersectionObserver was triggered
  const w = window as any;
  let intersectionObserverTriggered = false;
  if (w.__pablo_io_log && Array.isArray(w.__pablo_io_log)) {
    intersectionObserverTriggered = w.__pablo_io_log.length > 0;
  }

  const domMutations = compressMutations(await mutationPromise);
  const duration = Math.round(performance.now() - startTime);

  return {
    webAnimationSnapshots,
    domMutations,
    computedStyleDiffs,
    intersectionObserverTriggered,
    duration,
  };
}
