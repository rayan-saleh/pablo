export function installEnhancedAnimationRecorderInMainWorld(): void {
  const w = window as any;
  if (w.__pablo_enhanced_anim_installed) return;
  w.__pablo_enhanced_anim_installed = true;

  const snapshots: any[] = [];
  w.__pablo_anim_snapshots = snapshots;
  const MAX_SNAPSHOTS = 200;
  const t0 = performance.now();

  function captureSnapshot() {
    if (snapshots.length >= MAX_SNAPSHOTS) return;

    try {
      const animations = document.getAnimations();
      for (const anim of animations) {
        if (snapshots.length >= MAX_SNAPSHOTS) break;

        const effect = anim.effect;
        if (!effect) continue;
        const timing = effect.getTiming();
        const target = (effect as any).target;
        if (!target || !(target instanceof Element)) continue;

        let targetSelector = target.tagName.toLowerCase();
        if (target.id) targetSelector = `${targetSelector}#${target.id}`;
        else if (target.className && typeof target.className === 'string') {
          targetSelector += `.${target.className.trim().split(/\s+/).slice(0, 2).join('.')}`;
        }

        const keyframes: any[] = [];
        if ('getKeyframes' in effect) {
          for (const keyframe of (effect as KeyframeEffect).getKeyframes()) {
            const properties: Record<string, string> = {};
            for (const [key, value] of Object.entries(keyframe)) {
              if (['offset', 'computedOffset', 'easing', 'composite'].includes(key)) continue;
              if (typeof value === 'string') properties[key] = value;
            }
            keyframes.push({
              offset: keyframe.offset ?? keyframe.computedOffset ?? 0,
              properties,
            });
          }
        }

        let animationName = 'web-animation';
        if (anim instanceof CSSAnimation) animationName = anim.animationName;
        else if (anim instanceof CSSTransition) animationName = `transition:${anim.transitionProperty}`;

        snapshots.push({
          timestamp: Math.round(performance.now() - t0),
          targetSelector,
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
    } catch {
      // Ignore browser animation API failures and keep capture going.
    }
  }

  const interval = setInterval(captureSnapshot, 100);
  setTimeout(() => clearInterval(interval), 5000);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', captureSnapshot);
  } else {
    captureSnapshot();
  }
}

export function installIntersectionObserverHookInMainWorld(): void {
  const w = window as any;
  if (w.__pablo_io_hook_installed) return;
  w.__pablo_io_hook_installed = true;

  const log: any[] = [];
  w.__pablo_io_log = log;
  const MAX_LOG = 50;
  const OriginalIntersectionObserver = window.IntersectionObserver;

  w.IntersectionObserver = (function(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    const wrappedCallback: IntersectionObserverCallback = (entries, observer) => {
      for (const entry of entries) {
        if (log.length >= MAX_LOG) break;
        const target = entry.target;
        let selector = target.tagName.toLowerCase();
        if (target.id) selector = `${selector}#${target.id}`;
        else if (target.className && typeof target.className === 'string') {
          selector += `.${target.className.trim().split(/\s+/).slice(0, 2).join('.')}`;
        }
        log.push({
          timestamp: Math.round(performance.now()),
          selector,
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
        });
      }
      return callback(entries, observer);
    };

    return new OriginalIntersectionObserver(wrappedCallback, options);
  } as unknown) as typeof window.IntersectionObserver;

  w.IntersectionObserver.prototype = OriginalIntersectionObserver.prototype;
}

export function collectEntranceAnimationsInMainWorld(): any[] | null {
  const w = window as any;
  const snapshots = w.__pablo_anim_snapshots;
  if (!snapshots || snapshots.length === 0) return null;

  const scope = document.querySelector('[data-pablo-entrance-target]');
  if (scope) scope.removeAttribute('data-pablo-entrance-target');
  if (!scope) return snapshots.slice(0, 100);
  const scopeElement = scope;

  function matchesScope(selector: string): boolean {
    try {
      const elements = document.querySelectorAll(selector.split('.')[0] || '*');
      for (const el of Array.from(elements)) {
        if (scopeElement.contains(el) || scopeElement === el) return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  return snapshots.filter((snapshot: any) => matchesScope(snapshot.targetSelector)).slice(0, 100);
}

export function collectIntersectionDataInMainWorld(): any[] | null {
  const w = window as any;
  const log = w.__pablo_io_log;
  if (!log || log.length === 0) return null;
  return log.slice(0, 50);
}
