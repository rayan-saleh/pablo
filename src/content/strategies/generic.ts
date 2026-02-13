import type { Strategy } from '../../shared/types';

export const genericStrategy: Strategy = {
  expandSelection(el: Element): Element {
    return el;
  },
  cleanup(_clone: Element): void {
    // No special cleanup for generic strategy
  },
};
