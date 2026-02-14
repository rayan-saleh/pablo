import type { Strategy } from '../../shared/types';

export const reactStrategy: Strategy = {
  expandSelection(el: Element): Element {
    // Expansion now happens in main world via fiber walker in service-worker.ts.
    // The content script can't see fiber keys, so just return the element as-is.
    return el;
  },
  cleanup(clone: Element): void {
    // Strip React-specific attributes
    const all = [clone, ...Array.from(clone.querySelectorAll('*'))];
    for (const node of all) {
      for (const attr of Array.from(node.attributes)) {
        if (attr.name.startsWith('data-reactid') || attr.name === 'data-reactroot') {
          node.removeAttribute(attr.name);
        }
      }
    }
  },
};
