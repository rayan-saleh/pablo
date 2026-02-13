import type { Strategy } from '../../shared/types';

export const framerStrategy: Strategy = {
  expandSelection(el: Element): Element {
    const component = el.closest('[data-framer-component-type]');
    return component || el;
  },
  cleanup(clone: Element): void {
    // Strip Framer-specific data attributes
    const all = [clone, ...Array.from(clone.querySelectorAll('*'))];
    for (const node of all) {
      for (const attr of Array.from(node.attributes)) {
        if (attr.name.startsWith('data-framer')) {
          node.removeAttribute(attr.name);
        }
      }
    }
  },
};
