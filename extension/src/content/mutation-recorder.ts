import type { DomMutationRecord, DomMutationRecording } from '../shared/types';

// --- Mutation Compression ---

const CSS_VAR_PATTERN = /--[\w-]+:\s*-?[\d.]+/;
const MOUSE_VAR_PATTERN = /--(?:card-)?mouse-?[xy]|--mouse-?(?:pos|position)/i;

/**
 * Compress a list of DOM mutations to reduce payload size.
 * - Groups CSS variable animation mutations into single summaries
 * - Detects mouse-tracking CSS variables and summarizes them
 * - For other repeated mutation groups, keeps only first and last
 */
export function compressMutations(mutations: DomMutationRecord[]): DomMutationRecord[] {
  if (mutations.length <= 3) return mutations;

  // Group by target + type
  const groups = new Map<string, DomMutationRecord[]>();
  for (const m of mutations) {
    const key = `${m.target}::${m.type}`;
    let group = groups.get(key);
    if (!group) {
      group = [];
      groups.set(key, group);
    }
    group.push(m);
  }

  const result: DomMutationRecord[] = [];

  for (const [_key, group] of groups) {
    if (group.length <= 2) {
      result.push(...group);
      continue;
    }

    // Check for mouse-tracking CSS variables
    if (group[0].type === 'style' && group.some(m => {
      const val = m.changes.new || m.changes.old || '';
      return MOUSE_VAR_PATTERN.test(val);
    })) {
      result.push({
        timestamp: group[0].timestamp,
        type: 'style',
        target: group[0].target,
        changes: { summary: 'Mouse position tracking via CSS variables' },
      });
      continue;
    }

    // Check for CSS variable animation patterns
    if (group[0].type === 'style' && group.every(m => {
      const val = m.changes.new || '';
      return CSS_VAR_PATTERN.test(val);
    })) {
      // Extract variable names and value ranges
      const varRanges = new Map<string, { min: number; max: number; count: number }>();
      for (const m of group) {
        const matches = (m.changes.new || '').matchAll(/(-{2}[\w-]+):\s*(-?[\d.]+)/g);
        for (const match of matches) {
          const varName = match[1];
          const val = parseFloat(match[2]);
          const range = varRanges.get(varName);
          if (range) {
            range.min = Math.min(range.min, val);
            range.max = Math.max(range.max, val);
            range.count++;
          } else {
            varRanges.set(varName, { min: val, max: val, count: 1 });
          }
        }
      }

      const duration = group[group.length - 1].timestamp - group[0].timestamp;
      const changes: Record<string, string> = { summary: 'CSS variable animation' };
      for (const [varName, range] of varRanges) {
        changes[varName] = `${round(range.min)} -> ${round(range.max)} (${range.count} steps over ${duration}ms)`;
      }

      result.push({
        timestamp: group[0].timestamp,
        type: 'style',
        target: group[0].target,
        changes,
      });
      continue;
    }

    // For other groups with 3+ entries, keep first and last
    result.push(group[0], group[group.length - 1]);
  }

  return result;
}

function round(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

const MAX_MUTATIONS = 200;
const TRACKED_ATTRIBUTES = new Set(['style', 'class', 'data-state', 'aria-hidden']);

function buildSelector(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (el.id) return `${tag}#${el.id}`;
  const cls = el.className && typeof el.className === 'string'
    ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
    : '';
  return `${tag}${cls}` || tag;
}

/**
 * Observes DOM mutations on a target element for a given duration.
 * Records style, class, data-state, and aria-hidden attribute changes,
 * plus childList additions/removals.
 * Returns undefined if no relevant mutations were observed.
 */
export function recordMutations(
  target: Element,
  durationMs: number = 3000,
): Promise<DomMutationRecording | undefined> {
  return new Promise((resolve) => {
    const mutations: DomMutationRecord[] = [];
    const startTime = performance.now();

    const observer = new MutationObserver((records) => {
      if (mutations.length >= MAX_MUTATIONS) return;

      for (const record of records) {
        if (mutations.length >= MAX_MUTATIONS) break;

        const timestamp = Math.round(performance.now() - startTime);
        const targetEl = record.target instanceof Element
          ? record.target
          : record.target.parentElement;
        if (!targetEl) continue;
        const selector = buildSelector(targetEl);

        if (record.type === 'characterData') {
          const newText = (record.target.textContent || '').slice(0, 200);
          const oldText = (record.oldValue || '').slice(0, 200);
          if (newText !== oldText) {
            mutations.push({
              timestamp,
              type: 'text',
              target: selector,
              changes: { old: oldText, new: newText },
            });
          }
        } else if (record.type === 'attributes' && record.attributeName) {
          const attrName = record.attributeName;
          if (!TRACKED_ATTRIBUTES.has(attrName)) continue;

          const newValue = targetEl.getAttribute(attrName) || '';
          const oldValue = record.oldValue || '';

          if (newValue === oldValue) continue;

          if (attrName === 'style') {
            mutations.push({
              timestamp,
              type: 'style',
              target: selector,
              changes: { old: oldValue, new: newValue },
            });
          } else if (attrName === 'class') {
            mutations.push({
              timestamp,
              type: 'class',
              target: selector,
              changes: { old: oldValue, new: newValue },
            });
          } else {
            mutations.push({
              timestamp,
              type: 'attribute',
              target: selector,
              changes: { [attrName]: newValue, oldValue },
            });
          }
        } else if (record.type === 'childList') {
          const changes: Record<string, string> = {};
          if (record.addedNodes.length > 0) {
            const added: string[] = [];
            for (const node of Array.from(record.addedNodes).slice(0, 5)) {
              if (node instanceof Element) {
                added.push(buildSelector(node));
              } else if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent?.trim();
                if (text) added.push(`text:"${text.slice(0, 50)}"`);
              }
            }
            if (added.length > 0) changes.added = added.join(', ');
          }
          if (record.removedNodes.length > 0) {
            const removed: string[] = [];
            for (const node of Array.from(record.removedNodes).slice(0, 5)) {
              if (node instanceof Element) {
                removed.push(buildSelector(node));
              } else if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent?.trim();
                if (text) removed.push(`text:"${text.slice(0, 50)}"`);
              }
            }
            if (removed.length > 0) changes.removed = removed.join(', ');
          }
          if (Object.keys(changes).length > 0) {
            mutations.push({
              timestamp,
              type: 'childList',
              target: selector,
              changes,
            });
          }
        }
      }
    });

    observer.observe(target, {
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      if (mutations.length === 0) {
        resolve(undefined);
      } else {
        resolve({
          duration: durationMs,
          mutations: compressMutations(mutations),
        });
      }
    }, durationMs);
  });
}
