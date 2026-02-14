import type { Strategy, AnimationData, WebflowIX2Data, WebflowIX2Interaction } from '../../shared/types';

/**
 * Parse Webflow IX2 interaction data from inline <script> tags.
 * Webflow embeds a JSON blob in the page containing all interaction definitions.
 * Elements with interactions are marked with `data-w-id` attributes.
 */
function extractWebflowIX2(element: Element): WebflowIX2Data[] {
  const results: WebflowIX2Data[] = [];

  // Collect all data-w-id values from the element subtree
  const elementsWithIds: { el: Element; wId: string }[] = [];
  const all = [element, ...Array.from(element.querySelectorAll('*'))];
  for (const el of all) {
    const wId = el.getAttribute('data-w-id');
    if (wId) {
      elementsWithIds.push({ el, wId });
    }
  }

  if (elementsWithIds.length === 0) return results;

  // Find and parse the IX2 data from inline scripts
  let ix2Data: any = null;

  // Try to find IX2 data in script tags
  const scripts = document.querySelectorAll('script');
  for (const script of Array.from(scripts)) {
    const text = script.textContent;
    if (!text) continue;

    // Webflow stores IX2 data in JSON within a script containing "Webflow.push"
    // or directly as a JSON object with "site" and "ix2" keys
    if (text.includes('"ix2"') || text.includes("'ix2'")) {
      try {
        // Try to extract the JSON object containing ix2 data
        const ix2Match = text.match(/\{[^{}]*"ix2"\s*:\s*\{/);
        if (ix2Match) {
          // Find the full JSON by tracking brace depth from the match start
          const startIdx = text.indexOf(ix2Match[0]);
          let depth = 0;
          let endIdx = startIdx;
          for (let i = startIdx; i < text.length; i++) {
            if (text[i] === '{') depth++;
            else if (text[i] === '}') {
              depth--;
              if (depth === 0) {
                endIdx = i + 1;
                break;
              }
            }
          }
          const jsonStr = text.slice(startIdx, endIdx);
          const parsed = JSON.parse(jsonStr);
          if (parsed.ix2) {
            ix2Data = parsed.ix2;
            break;
          }
        }
      } catch {
        // JSON parse failed, continue searching
      }
    }
  }

  if (!ix2Data) return results;

  // Map element IDs to their interactions
  const interactions = ix2Data.interactions || {};
  const events = ix2Data.events || {};

  for (const { wId } of elementsWithIds) {
    const elementInteractions: WebflowIX2Interaction[] = [];

    // Search events for this element ID
    for (const eventId of Object.keys(events)) {
      const event = events[eventId];
      if (!event) continue;

      const target = event.target;
      if (target !== wId && event.config?.target !== wId) continue;

      const trigger = event.type || 'unknown';
      const actionListId = event.action?.id || event.actionListId;
      let animation: Record<string, unknown> = {};

      if (actionListId && interactions[actionListId]) {
        animation = interactions[actionListId];
      } else if (event.action) {
        animation = event.action;
      }

      elementInteractions.push({
        trigger: mapWebflowTrigger(trigger),
        animation: sanitizeIX2Animation(animation),
      });
    }

    if (elementInteractions.length > 0) {
      results.push({
        elementId: wId,
        interactions: elementInteractions,
      });
    }
  }

  return results;
}

function mapWebflowTrigger(type: string): string {
  const triggerMap: Record<string, string> = {
    'mouse-over': 'mouse-hover',
    'mouse-out': 'mouse-hover',
    'mouse-click': 'click',
    'scroll-into-view': 'scroll-into-view',
    'scroll-out-of-view': 'scroll-out-of-view',
    'page-load': 'page-load',
    'page-scroll': 'page-scroll',
    'tab-active': 'tab-active',
    'tab-inactive': 'tab-inactive',
    'navbar-open': 'navbar-open',
    'navbar-close': 'navbar-close',
  };
  return triggerMap[type] || type;
}

function sanitizeIX2Animation(animation: Record<string, unknown>): Record<string, unknown> {
  try {
    // Deep clone and truncate large values
    const str = JSON.stringify(animation);
    if (str.length > 5000) {
      return { _truncated: true, _size: str.length, type: animation.type };
    }
    return JSON.parse(str);
  } catch {
    return { _error: 'Could not serialize animation data' };
  }
}

export const webflowStrategy: Strategy = {
  expandSelection(el: Element): Element {
    return el;
  },
  cleanup(clone: Element): void {
    // Strip Webflow-specific data attributes
    const all = [clone, ...Array.from(clone.querySelectorAll('*'))];
    for (const node of all) {
      for (const attr of Array.from(node.attributes)) {
        if (attr.name.startsWith('data-wf')) {
          node.removeAttribute(attr.name);
        }
      }
    }
  },
  extractAnimations(el: Element): Partial<AnimationData> {
    const webflowIX2 = extractWebflowIX2(el);
    if (webflowIX2.length === 0) return {};
    return { webflowIX2 };
  },
};
