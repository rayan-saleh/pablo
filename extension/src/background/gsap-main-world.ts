export function collectGsapInMainWorld(): {
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
  timelineTree?: {
    rootId: string;
    children: any[];
    timelineVars?: Record<string, unknown>;
  };
} | null {
  function describeElement(el: Element | null): string {
    if (!el || !(el instanceof Element)) return 'unknown';
    const tag = el.tagName.toLowerCase();
    if (el.id) return `${tag}#${el.id}`;
    const cls = el.className && typeof el.className === 'string'
      ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
      : '';
    return `${tag}${cls}` || tag;
  }

  const scopeTarget = document.querySelector('[data-pablo-target-gsap]');
  if (scopeTarget) scopeTarget.removeAttribute('data-pablo-target-gsap');
  const scopeRoot: Element | Document = scopeTarget || document;

  const w = window as any;
  const gsap = w.gsap || w.TweenMax?.__proto__?.constructor || null;
  const ScrollTrigger = w.ScrollTrigger || (gsap && gsap.core?.globals?.()?.ScrollTrigger) || null;
  const hasGsapMarkers = document.querySelector('.gsap-marker-start, .gsap-marker-end, [data-scroll-container]') !== null;

  let gsapStyleSignals = 0;
  const candidates = scopeRoot.querySelectorAll(
    '[style*="opacity: 0"], [style*="opacity:0"], [style*="visibility: hidden"], [style*="translate"]',
  );
  for (const el of Array.from(candidates).slice(0, 50)) {
    const rect = el.getBoundingClientRect();
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
    timelineTree?: {
      rootId: string;
      children: any[];
      timelineVars?: Record<string, unknown>;
    };
  } = {
    detected: true,
    scrollTriggers: [],
    tweens: [],
  };

  if (gsap?.version) {
    result.version = gsap.version;
  }

  if (ScrollTrigger && typeof ScrollTrigger.getAll === 'function') {
    try {
      const triggers = ScrollTrigger.getAll();
      for (const trigger of triggers.slice(0, 30)) {
        const triggerEl = trigger.trigger;
        if (scopeTarget && triggerEl instanceof Element && !scopeTarget.contains(triggerEl)) continue;

        const scrollerEl = trigger.scroller;
        const vars = trigger.vars || {};
        result.scrollTriggers.push({
          triggerSelector: describeElement(triggerEl),
          scroller: scrollerEl && scrollerEl !== document.documentElement
            ? describeElement(scrollerEl)
            : undefined,
          start: typeof vars.start === 'string' ? vars.start : (trigger.start != null ? String(trigger.start) : undefined),
          end: typeof vars.end === 'string' ? vars.end : (trigger.end != null ? String(trigger.end) : undefined),
          pin: vars.pin ? true : undefined,
          scrub: vars.scrub != null ? vars.scrub : undefined,
          description: triggerEl ? `ScrollTrigger on ${describeElement(triggerEl)}` : 'ScrollTrigger instance',
        });
      }
    } catch {
      // Ignore GSAP API failures and keep the rest of the capture running.
    }
  }

  if (gsap && typeof gsap.globalTimeline?.getChildren === 'function') {
    try {
      const tweens = gsap.globalTimeline.getChildren(true, true, false).slice(0, 30);
      for (const tween of tweens) {
        if (!tween.targets || typeof tween.targets !== 'function') continue;
        const targets = tween.targets();
        if (!targets || targets.length === 0) continue;

        const tweenTarget = targets[0];
        if (!(tweenTarget instanceof Element)) continue;
        if (scopeTarget && !scopeTarget.contains(tweenTarget)) continue;

        const vars = tween.vars || {};
        const properties: Record<string, unknown> = {};
        for (const key of Object.keys(vars)) {
          if ([
            'onComplete', 'onUpdate', 'onStart', 'onReverseComplete', 'callbackScope',
            'lazy', 'immediateRender', 'id', 'scrollTrigger', 'overwrite',
          ].includes(key)) {
            continue;
          }
          if (typeof vars[key] === 'function') continue;
          properties[key] = vars[key];
        }

        let type = 'to';
        if (tween.data === 'isSet' || tween._dur === 0) type = 'set';
        else if (tween.data === 'isFromStart' || tween._from) type = 'from';

        result.tweens.push({
          targetSelector: describeElement(tweenTarget),
          type,
          properties,
          duration: tween._dur,
          delay: tween._delay || undefined,
          ease: vars.ease || undefined,
        });
      }
    } catch {
      // Ignore GSAP timeline failures and keep the rest of the capture running.
    }
  }

  if (gsap?.globalTimeline) {
    try {
      function walkGlobalTimeline(timeline: any, depth: number): any[] {
        if (depth > 6) return [];

        const children: any[] = [];
        let child = timeline._first;
        let count = 0;

        while (child && count < 50) {
          if (child._first !== undefined) {
            children.push({
              type: 'timeline',
              timelineId: `global_${depth}_${count}`,
              duration: child._dur,
              children: walkGlobalTimeline(child, depth + 1),
            });
          } else if (child.targets && typeof child.targets === 'function') {
            const targets = child.targets();
            const target = targets?.[0];
            children.push({
              type: 'tween',
              target: target instanceof Element ? describeElement(target) : 'object',
              tweenType: child._from ? 'from' : (child._dur === 0 ? 'set' : 'to'),
              duration: child._dur,
            });
          }

          child = child._next;
          count++;
        }

        return children;
      }

      const timelineChildren = walkGlobalTimeline(gsap.globalTimeline, 0);
      if (timelineChildren.length > 0) {
        result.timelineTree = {
          rootId: 'globalTimeline',
          children: timelineChildren,
        };
      }
    } catch {
      // Ignore timeline tree failures.
    }
  }

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

