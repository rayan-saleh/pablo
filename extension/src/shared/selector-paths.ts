type SelectorNode = {
  tagName: string;
  id?: unknown;
  className?: unknown;
  parentElement: SelectorNode | null;
  children?: ArrayLike<SelectorNode>;
};

export type RelativeSelectorMode = 'nth-child' | 'nth-of-type';

function normalizeClassTokens(className: unknown, limit: number): string {
  if (typeof className !== 'string') return '';
  const tokens = className.trim().split(/\s+/).filter(Boolean).slice(0, limit);
  return tokens.length > 0 ? `.${tokens.join('.')}` : '';
}

function getChildren(node: SelectorNode | null): SelectorNode[] {
  if (!node?.children) return [];
  return Array.from(node.children);
}

export function buildSummarySelector(node: SelectorNode, classTokenLimit = 2): string {
  const tag = node.tagName.toLowerCase();
  if (typeof node.id === 'string' && node.id) {
    return `${tag}#${node.id}`;
  }

  const classSelector = normalizeClassTokens(node.className, classTokenLimit);
  return `${tag}${classSelector}` || tag;
}

export function buildRelativeSelectorPath(
  root: SelectorNode,
  target: SelectorNode,
  mode: RelativeSelectorMode = 'nth-of-type',
): string {
  if (root === target) return target.tagName.toLowerCase();

  const parts: string[] = [];
  let current: SelectorNode | null = target;

  while (current && current !== root) {
    const parent: SelectorNode | null = current.parentElement;
    if (!parent) break;

    const siblings = mode === 'nth-of-type'
      ? getChildren(parent).filter((child) => child.tagName === current!.tagName)
      : getChildren(parent);

    const index = Math.max(siblings.indexOf(current) + 1, 1);
    const pseudoClass = mode === 'nth-of-type'
      ? `:nth-of-type(${index})`
      : `:nth-child(${index})`;

    parts.unshift(`${current.tagName.toLowerCase()}${pseudoClass}`);
    current = parent;
  }

  return parts.join(' > ') || target.tagName.toLowerCase();
}
