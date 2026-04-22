import type {
  AnimationData,
  CSSAnimationData,
  CSSTransitionData,
  KeyframeDefinition,
  PseudoStateStyles,
  PseudoState,
  ActiveAnimationData,
  ScrollTriggerData,
  GsapData,
  DomMutationRecording,
  EntranceAnimationData,
  ScrollAnimationData,
  InteractionAnimationData,
} from '../shared/types';

const MAX_SUBTREE_ELEMENTS = 200;

const PSEUDO_STATES: PseudoState[] = ['hover', 'active', 'focus', 'focus-within', 'focus-visible'];

const SCROLL_DATA_ATTRS = ['data-aos', 'data-scroll', 'data-sal', 'data-scroll-speed', 'data-scroll-direction'];

const SCROLL_CLASS_PATTERNS = [
  /\baos-/, /\bwow\b/, /\bscroll-/, /\breveal\b/, /\bfade-in\b/, /\bslide-in\b/,
];

// --- Web Animations API ---

export function extractActiveAnimations(element: Element): ActiveAnimationData[] {
  const results: ActiveAnimationData[] = [];

  let animations: Animation[];
  try {
    animations = element.getAnimations({ subtree: true });
  } catch {
    return results;
  }

  for (const anim of animations) {
    if (!(anim instanceof CSSAnimation || anim instanceof CSSTransition || anim.constructor.name === 'Animation')) {
      continue;
    }

    const timing = anim.effect?.getTiming();
    if (!timing) continue;

    const keyframes: { offset: number; properties: Record<string, string> }[] = [];
    if (anim.effect && 'getKeyframes' in anim.effect) {
      const kfs = (anim.effect as KeyframeEffect).getKeyframes();
      for (const kf of kfs) {
        const props: Record<string, string> = {};
        for (const [key, value] of Object.entries(kf)) {
          if (key === 'offset' || key === 'computedOffset' || key === 'easing' || key === 'composite') continue;
          if (typeof value === 'string') {
            props[key] = value;
          }
        }
        keyframes.push({
          offset: (kf.offset ?? kf.computedOffset ?? 0) as number,
          properties: props,
        });
      }
    }

    let animationName = '';
    if (anim instanceof CSSAnimation) {
      animationName = anim.animationName;
    } else if (anim instanceof CSSTransition) {
      animationName = `transition:${anim.transitionProperty}`;
    } else {
      animationName = 'web-animation';
    }

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

// --- CSS Animation Properties ---

function extractCSSAnimationProperties(element: Element): CSSAnimationData[] {
  const computed = window.getComputedStyle(element);
  const names = computed.animationName;
  if (!names || names === 'none') return [];

  const nameList = splitCSSList(names);
  const durations = splitCSSList(computed.animationDuration);
  const timings = splitCSSList(computed.animationTimingFunction);
  const delays = splitCSSList(computed.animationDelay);
  const iterations = splitCSSList(computed.animationIterationCount);
  const directions = splitCSSList(computed.animationDirection);
  const fillModes = splitCSSList(computed.animationFillMode);
  const playStates = splitCSSList(computed.animationPlayState);

  return nameList.map((name, i) => ({
    name,
    duration: getByIndex(durations, i),
    timingFunction: getByIndex(timings, i),
    delay: getByIndex(delays, i),
    iterationCount: getByIndex(iterations, i),
    direction: getByIndex(directions, i),
    fillMode: getByIndex(fillModes, i),
    playState: getByIndex(playStates, i),
  }));
}

// --- CSS Transition Properties ---

function extractCSSTransitionProperties(element: Element): CSSTransitionData[] {
  const computed = window.getComputedStyle(element);
  const properties = computed.transitionProperty;
  if (!properties || properties === 'all' || properties === 'none') {
    if (properties === 'all') {
      const dur = computed.transitionDuration;
      if (dur && dur !== '0s') {
        return [{
          property: 'all',
          duration: dur,
          timingFunction: computed.transitionTimingFunction || 'ease',
          delay: computed.transitionDelay || '0s',
        }];
      }
    }
    return [];
  }

  const propList = splitCSSList(properties);
  const durations = splitCSSList(computed.transitionDuration);
  const timings = splitCSSList(computed.transitionTimingFunction);
  const delays = splitCSSList(computed.transitionDelay);

  return propList
    .map((prop, i) => ({
      property: prop,
      duration: getByIndex(durations, i),
      timingFunction: getByIndex(timings, i),
      delay: getByIndex(delays, i),
    }))
    .filter(t => t.duration !== '0s');
}

// --- Pseudo-State Styles ---

function extractPseudoStateStyles(element: Element): PseudoStateStyles {
  const stateStyles: PseudoStateStyles = {};
  const baseComputed = window.getComputedStyle(element);

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      // Cross-origin stylesheet — skip
      continue;
    }

    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSStyleRule)) {
        // Check @media rules
        if (rule instanceof CSSMediaRule) {
          extractPseudoFromRules(rule.cssRules, element, baseComputed, stateStyles);
        }
        continue;
      }
      processPseudoRule(rule, element, baseComputed, stateStyles);
    }
  }

  return stateStyles;
}

function extractPseudoFromRules(
  rules: CSSRuleList,
  element: Element,
  baseComputed: CSSStyleDeclaration,
  stateStyles: PseudoStateStyles,
): void {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule) {
      processPseudoRule(rule, element, baseComputed, stateStyles);
    }
  }
}

function processPseudoRule(
  rule: CSSStyleRule,
  element: Element,
  baseComputed: CSSStyleDeclaration,
  stateStyles: PseudoStateStyles,
): void {
  const selectorText = rule.selectorText;

  for (const pseudo of PSEUDO_STATES) {
    const pseudoSuffix = `:${pseudo}`;
    if (!selectorText.includes(pseudoSuffix)) continue;

    // Strip the pseudo-class to get the base selector
    const baseSelector = selectorText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.includes(pseudoSuffix))
      .map(s => s.replace(new RegExp(`:${pseudo}(?![\\w-])`, 'g'), ''))
      .filter(Boolean);

    for (const sel of baseSelector) {
      try {
        if (!element.matches(sel)) continue;
      } catch {
        continue;
      }

      const props: Record<string, string> = {};
      for (let i = 0; i < rule.style.length; i++) {
        const prop = rule.style[i];
        const value = rule.style.getPropertyValue(prop);
        const baseValue = baseComputed.getPropertyValue(prop);
        if (value && value !== baseValue) {
          props[prop] = value;
        }
      }

      if (Object.keys(props).length > 0) {
        stateStyles[pseudo] = { ...(stateStyles[pseudo] || {}), ...props };
      }
    }
  }
}

// --- @keyframes Extraction ---

function extractKeyframeDefinitions(animationNames: string[]): KeyframeDefinition[] {
  if (animationNames.length === 0) return [];

  const nameSet = new Set(animationNames);
  const definitions: KeyframeDefinition[] = [];
  const seen = new Set<string>();

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }

    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSKeyframesRule && nameSet.has(rule.name) && !seen.has(rule.name)) {
        seen.add(rule.name);
        const keyframes: { offset: string; properties: Record<string, string> }[] = [];

        for (const kfRule of Array.from(rule.cssRules)) {
          if (kfRule instanceof CSSKeyframeRule) {
            const properties: Record<string, string> = {};
            for (let i = 0; i < kfRule.style.length; i++) {
              const prop = kfRule.style[i];
              properties[prop] = kfRule.style.getPropertyValue(prop);
            }
            keyframes.push({ offset: kfRule.keyText, properties });
          }
        }

        definitions.push({ name: rule.name, keyframes });
      }
    }
  }

  return definitions;
}

// --- Scroll Trigger Heuristics ---

function extractScrollTriggers(element: Element): ScrollTriggerData[] {
  const triggers: ScrollTriggerData[] = [];
  const elements = [element, ...Array.from(element.querySelectorAll('*')).slice(0, MAX_SUBTREE_ELEMENTS)];

  for (const el of elements) {
    // Check data attributes
    for (const attr of SCROLL_DATA_ATTRS) {
      const value = el.getAttribute(attr);
      if (value !== null) {
        const attrBase = attr.replace('data-', '');
        triggers.push({
          type: attrBase,
          description: `Element has ${attr}="${value}"`,
        });
      }
    }

    // Check for AOS extended attributes
    const aosType = el.getAttribute('data-aos');
    if (aosType) {
      const aosDuration = el.getAttribute('data-aos-duration');
      const aosDelay = el.getAttribute('data-aos-delay');
      if (aosDuration || aosDelay) {
        const parts = [];
        if (aosDuration) parts.push(`duration=${aosDuration}`);
        if (aosDelay) parts.push(`delay=${aosDelay}`);
        triggers.push({
          type: 'aos-config',
          description: `AOS config: ${parts.join(', ')}`,
        });
      }
    }

    // Check CSS classes
    const classList = el.className && typeof el.className === 'string' ? el.className : '';
    for (const pattern of SCROLL_CLASS_PATTERNS) {
      if (pattern.test(classList)) {
        triggers.push({
          type: 'css-class',
          description: `Scroll-related class detected: "${classList.match(pattern)?.[0]}"`,
        });
      }
    }

    // Check scroll-timeline CSS property
    const computed = window.getComputedStyle(el);
    const scrollTimeline = computed.getPropertyValue('scroll-timeline-name');
    if (scrollTimeline && scrollTimeline !== 'none') {
      triggers.push({
        type: 'scroll-timeline',
        description: `CSS scroll-timeline-name: ${scrollTimeline}`,
      });
    }
  }

  // Deduplicate by description
  const seen = new Set<string>();
  return triggers.filter(t => {
    if (seen.has(t.description)) return false;
    seen.add(t.description);
    return true;
  });
}

// --- Summary Generator ---

function generateSummary(data: Partial<AnimationData>): string {
  const parts: string[] = [];

  if (data.cssTransitions && data.cssTransitions.length > 0) {
    const props = data.cssTransitions.map(t => t.property).join(', ');
    const timing = data.cssTransitions[0];
    parts.push(`CSS transitions on: ${props} (${timing.duration} ${timing.timingFunction})`);
  }

  if (data.cssAnimations && data.cssAnimations.length > 0) {
    const names = data.cssAnimations.map(a => a.name).join(', ');
    parts.push(`CSS animations: ${names}`);
  }

  if (data.stateStyles) {
    const states = Object.keys(data.stateStyles) as PseudoState[];
    for (const state of states) {
      const props = Object.keys(data.stateStyles[state]!);
      if (props.length > 0) {
        parts.push(`${state} state changes: ${props.join(', ')}`);
      }
    }
  }

  if (data.activeAnimations && data.activeAnimations.length > 0) {
    const names = data.activeAnimations.map(a => a.animationName).join(', ');
    parts.push(`Active animations: ${names}`);
  }

  if (data.scrollTriggers && data.scrollTriggers.length > 0) {
    parts.push(`Scroll triggers detected (${data.scrollTriggers.length})`);
  }

  if (data.framerMotion && data.framerMotion.length > 0) {
    const names = data.framerMotion.map(m => m.componentName).join(', ');
    parts.push(`Framer Motion components: ${names}`);
  }

  if (data.webflowIX2 && data.webflowIX2.length > 0) {
    parts.push(`Webflow IX2 interactions: ${data.webflowIX2.length}`);
  }

  if (data.gsap?.detected) {
    const gsapParts: string[] = [`GSAP${data.gsap.version ? ' v' + data.gsap.version : ''} detected`];
    if (data.gsap.scrollTriggers.length > 0) {
      gsapParts.push(`${data.gsap.scrollTriggers.length} ScrollTrigger instance(s)`);
    }
    if (data.gsap.tweens.length > 0) {
      gsapParts.push(`${data.gsap.tweens.length} active tween(s)`);
    }
    if (data.gsap.timelineTree) {
      gsapParts.push(`timeline tree captured (${data.gsap.timelineTree.children.length} children)`);
    }
    parts.push(gsapParts.join(', '));
  }

  if (data.domRecording) {
    parts.push(`DOM mutation recording: ${data.domRecording.mutations.length} mutation(s) over ${data.domRecording.duration}ms`);
  }

  if (data.entranceAnimations) {
    const ea = data.entranceAnimations;
    const eaParts: string[] = [];
    if (ea.webAnimationSnapshots.length > 0) {
      eaParts.push(`${ea.webAnimationSnapshots.length} animation(s)`);
    }
    if (ea.computedStyleDiffs.length > 0) {
      eaParts.push(`${ea.computedStyleDiffs.length} style diff(s)`);
    }
    if (ea.domMutations.length > 0) {
      eaParts.push(`${ea.domMutations.length} mutation(s)`);
    }
    if (eaParts.length > 0) {
      parts.push(`Entrance animations: ${eaParts.join(', ')} over ${ea.duration}ms`);
    }
  }

  if (data.scrollAnimations) {
    const sa = data.scrollAnimations;
    const saParts: string[] = [];
    if (sa.intersectionObserverTriggered) saParts.push('IntersectionObserver triggered');
    if (sa.webAnimationSnapshots.length > 0) saParts.push(`${sa.webAnimationSnapshots.length} animation(s)`);
    if (sa.computedStyleDiffs.length > 0) saParts.push(`${sa.computedStyleDiffs.length} style diff(s)`);
    if (sa.domMutations.length > 0) saParts.push(`${sa.domMutations.length} mutation(s)`);
    if (saParts.length > 0) {
      parts.push(`Scroll animations: ${saParts.join(', ')} over ${sa.duration}ms`);
    }
  }

  if (data.interactionAnimations) {
    const ia = data.interactionAnimations;
    const iaParts: string[] = [];
    if (ia.hover) {
      const count = ia.hover.webAnimations.length + ia.hover.computedStyleDiffs.length + ia.hover.domMutations.length;
      if (count > 0) iaParts.push(`hover (${count} change(s))`);
    }
    if (ia.click) {
      const count = ia.click.webAnimations.length + ia.click.computedStyleDiffs.length + ia.click.domMutations.length;
      if (count > 0) iaParts.push(`click (${count} change(s))`);
    }
    if (ia.focus) {
      const count = ia.focus.webAnimations.length + ia.focus.computedStyleDiffs.length + ia.focus.domMutations.length;
      if (count > 0) iaParts.push(`focus (${count} change(s))`);
    }
    if (iaParts.length > 0) {
      parts.push(`Interaction animations: ${iaParts.join(', ')}`);
    }
  }

  return parts.join('. ') + (parts.length > 0 ? '.' : '');
}

// --- Main Orchestrator ---

export function extractAnimations(element: Element): AnimationData | undefined {
  const activeAnimations = extractActiveAnimations(element);

  const cssAnimations = extractCSSAnimationProperties(element);
  const cssTransitions = extractCSSTransitionProperties(element);

  // Also collect from subtree (limited)
  const subtreeElements = Array.from(element.querySelectorAll('*')).slice(0, MAX_SUBTREE_ELEMENTS);
  for (const child of subtreeElements) {
    cssAnimations.push(...extractCSSAnimationProperties(child));
    cssTransitions.push(...extractCSSTransitionProperties(child));
  }

  // Deduplicate CSS animations by name
  const seenAnimNames = new Set<string>();
  const dedupedAnimations = cssAnimations.filter(a => {
    if (seenAnimNames.has(a.name)) return false;
    seenAnimNames.add(a.name);
    return true;
  });

  // Deduplicate CSS transitions by property
  const seenTransProps = new Set<string>();
  const dedupedTransitions = cssTransitions.filter(t => {
    if (seenTransProps.has(t.property)) return false;
    seenTransProps.add(t.property);
    return true;
  });

  const stateStyles = extractPseudoStateStyles(element);

  // Collect all animation names for @keyframes lookup
  const allAnimNames = [
    ...dedupedAnimations.map(a => a.name),
    ...activeAnimations
      .map(a => a.animationName)
      .filter(n => !n.startsWith('transition:')),
  ];
  const uniqueAnimNames = [...new Set(allAnimNames)];
  const keyframeDefinitions = extractKeyframeDefinitions(uniqueAnimNames);

  const scrollTriggers = extractScrollTriggers(element);

  const data: AnimationData = {
    cssAnimations: dedupedAnimations,
    cssTransitions: dedupedTransitions,
    keyframeDefinitions,
    stateStyles,
    activeAnimations,
    scrollTriggers,
    framerMotion: [],
    webflowIX2: [],
    summary: '',
  };

  // Check if anything was actually detected
  const hasData =
    data.cssAnimations.length > 0 ||
    data.cssTransitions.length > 0 ||
    data.keyframeDefinitions.length > 0 ||
    Object.keys(data.stateStyles).length > 0 ||
    data.activeAnimations.length > 0 ||
    data.scrollTriggers.length > 0;

  if (!hasData) return undefined;

  data.summary = generateSummary(data);
  return data;
}

/**
 * Merge framework-specific animation data into existing AnimationData.
 * Creates AnimationData if it doesn't exist yet.
 */
export function mergeAnimationData(
  base: AnimationData | undefined,
  partial: Partial<AnimationData>,
): AnimationData | undefined {
  const merged: AnimationData = base ?? {
    cssAnimations: [],
    cssTransitions: [],
    keyframeDefinitions: [],
    stateStyles: {},
    activeAnimations: [],
    scrollTriggers: [],
    framerMotion: [],
    webflowIX2: [],
    summary: '',
  };

  if (partial.framerMotion?.length) {
    merged.framerMotion = partial.framerMotion;
  }
  if (partial.webflowIX2?.length) {
    merged.webflowIX2 = partial.webflowIX2;
  }
  if (partial.scrollTriggers?.length) {
    merged.scrollTriggers = [...merged.scrollTriggers, ...partial.scrollTriggers];
  }
  if (partial.gsap?.detected) {
    merged.gsap = partial.gsap;
  }
  if (partial.domRecording) {
    merged.domRecording = partial.domRecording;
  }
  if (partial.entranceAnimations) {
    merged.entranceAnimations = partial.entranceAnimations;
  }
  if (partial.scrollAnimations) {
    merged.scrollAnimations = partial.scrollAnimations;
  }
  if (partial.interactionAnimations) {
    merged.interactionAnimations = partial.interactionAnimations;
  }

  // Check if there's any data at all
  const hasData =
    merged.cssAnimations.length > 0 ||
    merged.cssTransitions.length > 0 ||
    merged.keyframeDefinitions.length > 0 ||
    Object.keys(merged.stateStyles).length > 0 ||
    merged.activeAnimations.length > 0 ||
    merged.scrollTriggers.length > 0 ||
    merged.framerMotion.length > 0 ||
    merged.webflowIX2.length > 0 ||
    merged.gsap?.detected ||
    merged.domRecording ||
    merged.entranceAnimations ||
    merged.scrollAnimations ||
    merged.interactionAnimations;

  if (!hasData) return undefined;

  merged.summary = generateSummary(merged);
  return merged;
}

// --- Helpers ---

function splitCSSList(value: string): string[] {
  if (!value) return [];
  // Handle comma-separated CSS values, respecting parentheses (e.g. cubic-bezier)
  const result: string[] = [];
  let current = '';
  let depth = 0;
  for (const char of value) {
    if (char === '(') depth++;
    else if (char === ')') depth--;
    else if (char === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

function getByIndex(list: string[], index: number): string {
  return list[index % list.length] || '';
}
