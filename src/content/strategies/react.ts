import type { Strategy } from '../../shared/types';

export const reactStrategy: Strategy = {
  expandSelection(el: Element): Element {
    // Try to find the React component boundary via fiber tree
    const fiberKey = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
    if (!fiberKey) return el;

    const fiber = (el as any)[fiberKey];
    if (!fiber) return el;

    // Walk up the fiber tree to find the nearest function/class component
    let current = fiber;
    while (current) {
      // Function components have tag 0, class components have tag 1
      if (current.tag === 0 || current.tag === 1) {
        // Found a component boundary — return its rendered DOM node
        const stateNode = findDomNode(current);
        if (stateNode && stateNode instanceof Element) {
          return stateNode;
        }
      }
      current = current.return;
    }

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

function findDomNode(fiber: any): Node | null {
  let node = fiber;
  while (node) {
    // HostComponent (tag 5) or HostText (tag 6) have stateNode as DOM node
    if (node.tag === 5 || node.tag === 6) {
      return node.stateNode;
    }
    node = node.child;
  }
  return null;
}
