import type { Strategy } from '../../shared/types';

export const shopifyStrategy: Strategy = {
  expandSelection(el: Element): Element {
    const section = el.closest('[id^="shopify-section-"]');
    return section || el;
  },
  cleanup(clone: Element): void {
    // Strip Shopify-specific data attributes
    const all = [clone, ...Array.from(clone.querySelectorAll('*'))];
    for (const node of all) {
      for (const attr of Array.from(node.attributes)) {
        if (attr.name.startsWith('data-shopify')) {
          node.removeAttribute(attr.name);
        }
      }
    }
  },
};
