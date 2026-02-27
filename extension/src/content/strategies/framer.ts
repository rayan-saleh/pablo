import type { Strategy, AnimationData } from '../../shared/types';

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
  extractAnimations(_el: Element): Partial<AnimationData> {
    // Framer Motion data is extracted from the React fiber tree
    // via collectFiberInMainWorld in the service worker.
    // This shell exists so the strategy interface is satisfied.
    return {};
  },
  getFrameworkDefaults(): Map<string, string> {
    return new Map<string, string>([
      ['top', '0px'],
      ['right', '0px'],
      ['bottom', '0px'],
      ['left', '0px'],
      ['flex-shrink', '0'],
      ['will-change', 'transform'],
    ]);
  },
};
