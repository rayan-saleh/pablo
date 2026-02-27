import type { Strategy } from '../../shared/types';

export const wordpressStrategy: Strategy = {
  expandSelection(el: Element): Element {
    const block = el.closest('[class*="wp-block-"]');
    return block || el;
  },
  cleanup(clone: Element): void {
    // Strip WordPress-specific data attributes
    const all = [clone, ...Array.from(clone.querySelectorAll('*'))];
    for (const node of all) {
      for (const attr of Array.from(node.attributes)) {
        if (attr.name.startsWith('data-wp')) {
          node.removeAttribute(attr.name);
        }
      }
    }
  },
};
