import type {
  ElementFingerprint,
  ClipboardPayload,
  EntranceAnimationData,
  ActiveAnimationData,
} from '../shared/types';
import { MSG } from '../shared/messages';
import { buildElementFingerprint, resolveElementFingerprint } from './element-fingerprint';
import { captureScrollAnimations } from './scroll-capture';
import { captureInteractionAnimations } from './interaction-capture';
import { mergeAnimationData } from './animation-extractor';

export type PhaseCallback = (phase: string) => void;

function collectEntranceAnimationsViaServiceWorker(target: Element): Promise<any[] | null> {
  return new Promise((resolve) => {
    target.setAttribute('data-pablo-entrance-target', '1');
    chrome.runtime.sendMessage({ type: MSG.COLLECT_ENTRANCE_ANIMATIONS }, (response) => {
      target.removeAttribute('data-pablo-entrance-target');
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(response?.data ?? null);
    });
  });
}

function buildEntranceData(snapshots: any[]): EntranceAnimationData {
  const seen = new Set<string>();
  const candidates: ActiveAnimationData[] = [];

  for (const snap of snapshots) {
    const key = `${snap.animationName}:${snap.targetSelector}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const timing = snap.timing;
    const keyframes: { offset: number; properties: Record<string, string> }[] = snap.keyframes || [];

    // Filter out zero-duration animations
    if (timing && timing.duration === 0) continue;

    // Filter out animations where all keyframes are identical (no actual movement)
    if (keyframes.length >= 2) {
      const allIdentical = keyframes.every((kf: any) => {
        const props = JSON.stringify(kf.properties);
        return props === JSON.stringify(keyframes[0].properties);
      });
      if (allIdentical) continue;
    }

    candidates.push({
      animationName: snap.animationName,
      playState: snap.playState,
      timing,
      keyframes,
    });
  }

  // Group by pattern: animationName + easing + duration + keyframe property names
  const groups = new Map<string, ActiveAnimationData[]>();
  for (const anim of candidates) {
    const kfPropNames = anim.keyframes.map(kf => Object.keys(kf.properties).sort().join(',')).join('|');
    const patternKey = `${anim.animationName}::${anim.timing.easing}::${anim.timing.duration}::${kfPropNames}`;
    let group = groups.get(patternKey);
    if (!group) {
      group = [];
      groups.set(patternKey, group);
    }
    group.push(anim);
  }

  // Emit one representative per group
  const webAnimationSnapshots: (ActiveAnimationData & { _appliedToCount?: number; _delayRange?: string })[] = [];
  for (const [, group] of groups) {
    const representative = { ...group[0] };
    if (group.length > 1) {
      const delays = group.map(a => a.timing.delay).sort((a, b) => a - b);
      (representative as any)._appliedToCount = group.length;
      (representative as any)._delayRange = `${delays[0]}ms - ${delays[delays.length - 1]}ms`;
    }
    webAnimationSnapshots.push(representative);
  }

  const duration = snapshots.length > 0
    ? snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp
    : 0;

  return {
    webAnimationSnapshots,
    domMutations: [],
    computedStyleDiffs: [],
    duration,
  };
}

export function startFullCapture(
  target: Element,
  immediatePayload: ClipboardPayload,
  onPhase?: PhaseCallback,
): void {
  onPhase?.('Building element fingerprint…');
  const fingerprint = buildElementFingerprint(target);

  onPhase?.('Refreshing page…');
  chrome.runtime.sendMessage({
    type: MSG.START_ANIMATION_CAPTURE,
    fingerprint,
    immediatePayload,
      url: window.location.href,
  }, (response) => {
    if (chrome.runtime.lastError || !response?.ok) {
      console.warn('[Pablo] Failed to start animation capture, using immediate data');
      void copyPayloadToClipboard(immediatePayload);
    }
  });
}

export async function continueCapture(
  fingerprint: ElementFingerprint,
  immediatePayload: ClipboardPayload,
  onPhase?: PhaseCallback,
): Promise<void> {
  const GLOBAL_TIMEOUT = 30000;
  const startTime = Date.now();

  function isTimedOut(): boolean {
    return Date.now() - startTime > GLOBAL_TIMEOUT;
  }

  try {
    // Wait a moment for the page to hydrate/settle
    onPhase?.('Waiting for page to load…');
    await new Promise(r => setTimeout(r, 2000));

    // Re-find the element
    onPhase?.('Re-finding element…');
    let target = resolveElementFingerprint(fingerprint);

    // Retry once after 2s if not found (SPA hydration delay)
    if (!target) {
      console.log('[Pablo] Element not found on first attempt, retrying…');
      await new Promise(r => setTimeout(r, 2000));
      target = resolveElementFingerprint(fingerprint);
    }

    if (!target) {
      console.warn('[Pablo] Element not found after refresh, using immediate data only');
      onPhase?.('Element not found — using immediate data');
      await copyPayloadToClipboard(immediatePayload);
      return;
    }

    console.log('[Pablo] Element re-found after refresh:', target.tagName);
    let animations = immediatePayload.component.animations;

    // Phase 1: Entrance animations
    if (!isTimedOut()) {
      onPhase?.('Recording entrance animations…');
      await new Promise(r => setTimeout(r, 1000)); // Extra wait for animations to play

      const entranceSnapshots = await collectEntranceAnimationsViaServiceWorker(target);
      if (entranceSnapshots && entranceSnapshots.length > 0) {
        console.log('[Pablo] Entrance animation snapshots:', entranceSnapshots.length);
        const entranceData = buildEntranceData(entranceSnapshots);
        animations = mergeAnimationData(animations, { entranceAnimations: entranceData });
      }
    }

    // Phase 2: Scroll-triggered animations
    if (!isTimedOut()) {
      onPhase?.('Capturing scroll animations…');
      try {
        const scrollData = await captureScrollAnimations(target);
        const hasScrollData = scrollData.webAnimationSnapshots.length > 0 ||
          scrollData.domMutations.length > 0 ||
          scrollData.computedStyleDiffs.length > 0 ||
          scrollData.intersectionObserverTriggered;

        if (hasScrollData) {
          console.log('[Pablo] Scroll animation data captured');
          animations = mergeAnimationData(animations, { scrollAnimations: scrollData });
        }
      } catch (err) {
        console.warn('[Pablo] Scroll capture failed:', err);
      }
    }

    // Phase 3: Interaction animations (hover, click, focus)
    if (!isTimedOut()) {
      // Re-scroll to element for interaction capture
      target.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'center' });
      await new Promise(r => setTimeout(r, 300));

      onPhase?.('Simulating hover…');
      try {
        const interactionData = await captureInteractionAnimations(target);
        const hasInteractionData = interactionData.hover || interactionData.click || interactionData.focus;

        if (hasInteractionData) {
          console.log('[Pablo] Interaction animation data captured');
          animations = mergeAnimationData(animations, { interactionAnimations: interactionData });
        }
      } catch (err) {
        console.warn('[Pablo] Interaction capture failed:', err);
      }
    }

    // Build final payload
    onPhase?.('Finalizing…');
    const finalPayload: ClipboardPayload = {
      ...immediatePayload,
      component: {
        ...immediatePayload.component,
        animations,
      },
    };

    await copyPayloadToClipboard(finalPayload);
    onPhase?.('Copied!');
    console.log('[Pablo] Full capture complete');

  } catch (err) {
    console.error('[Pablo] Continue capture failed:', err);
    onPhase?.('Error — using immediate data');
    await copyPayloadToClipboard(immediatePayload);
  }
}

/**
 * JSON replacer that strips empty arrays/objects and default timing values
 * to produce a more compact payload.
 */
function cleanReplacer(_key: string, value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value) && value.length === 0) return undefined;
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0) return undefined;
  return value;
}

/**
 * Strip default timing values from animation data to reduce size.
 */
function stripDefaultTimingValues(payload: ClipboardPayload): ClipboardPayload {
  const animations = payload.component.animations;
  if (!animations) return payload;

  function cleanTiming(timing: any): any {
    if (!timing || typeof timing !== 'object') return timing;
    const cleaned = { ...timing };
    if (cleaned.delay === 0) delete cleaned.delay;
    if (cleaned.direction === 'normal') delete cleaned.direction;
    if (cleaned.fill === 'none') delete cleaned.fill;
    if (cleaned.iterations === 1) delete cleaned.iterations;
    return cleaned;
  }

  function cleanAnimList(list: any[] | undefined): any[] | undefined {
    if (!list) return list;
    return list.map(a => ({
      ...a,
      timing: cleanTiming(a.timing),
    }));
  }

  const cleaned = { ...animations };
  cleaned.activeAnimations = cleanAnimList(cleaned.activeAnimations) || [];
  if (cleaned.entranceAnimations) {
    cleaned.entranceAnimations = {
      ...cleaned.entranceAnimations,
      webAnimationSnapshots: cleanAnimList(cleaned.entranceAnimations.webAnimationSnapshots) || [],
    };
  }
  if (cleaned.scrollAnimations) {
    cleaned.scrollAnimations = {
      ...cleaned.scrollAnimations,
      webAnimationSnapshots: cleanAnimList(cleaned.scrollAnimations.webAnimationSnapshots) || [],
    };
  }
  if (cleaned.interactionAnimations) {
    const ia = { ...cleaned.interactionAnimations };
    for (const phase of ['hover', 'click', 'focus'] as const) {
      if (ia[phase]) {
        ia[phase] = {
          ...ia[phase],
          webAnimations: cleanAnimList(ia[phase]!.webAnimations) || [],
        };
      }
    }
    cleaned.interactionAnimations = ia;
  }

  return {
    ...payload,
    component: {
      ...payload.component,
      animations: cleaned,
    },
  };
}

export async function copyPayloadToClipboard(payload: ClipboardPayload): Promise<void> {
  const stripped = stripDefaultTimingValues(payload);
  const payloadStr = JSON.stringify(stripped, cleanReplacer);
  await navigator.clipboard.writeText(payloadStr);
  console.log('[Pablo] Clipboard copy success, size:', payloadStr.length);

  chrome.runtime.sendMessage({
    type: MSG.EXTRACTION_COMPLETE,
    meta: {
      tag: payload.component.tag,
      stack: payload.detection.framework,
      size: payloadStr.length,
    },
  });
}
