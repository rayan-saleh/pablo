import type { Strategy } from '../../shared/types';

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
};
