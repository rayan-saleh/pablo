import type { DomMutationRecord, DomMutationRecording } from '../shared/types';

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

        if (record.type === 'attributes' && record.attributeName) {
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
          mutations,
        });
      }
    }, durationMs);
  });
}
