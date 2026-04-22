export function probeReactInMainWorld(): boolean {
  const candidates: Element[] = [];

  for (const selector of ['#__next', '#root', '#app', '#main']) {
    const el = document.querySelector(selector);
    if (el) candidates.push(el);
  }

  for (const child of Array.from(document.body.children).slice(0, 5)) {
    if (!candidates.includes(child)) candidates.push(child);
  }

  for (const root of candidates) {
    const toCheck = [root, ...Array.from(root.querySelectorAll('*')).slice(0, 20)];
    for (const el of toCheck) {
      const keys = Object.keys(el);
      if (keys.some((key) =>
        key.startsWith('__reactFiber$') ||
        key.startsWith('__reactInternalInstance$') ||
        key.startsWith('__reactContainer$')
      )) {
        return true;
      }
    }
  }

  return false;
}

export function collectFiberInMainWorld(): {
  components: {
    displayName: string;
    sourceCode: string;
    instances: { props: Record<string, unknown> }[];
    children: string[];
  }[];
  rootComponentName: string;
  motionComponents: {
    componentName: string;
    initial?: Record<string, unknown>;
    animate?: Record<string, unknown>;
    exit?: Record<string, unknown>;
    whileHover?: Record<string, unknown>;
    whileTap?: Record<string, unknown>;
    whileInView?: Record<string, unknown>;
    transition?: Record<string, unknown>;
    variants?: Record<string, unknown>;
    layoutId?: string;
    layout?: boolean | string;
  }[];
} | null {
  const MAX_COMPONENT_TYPES = 50;
  const MAX_SOURCE_LENGTH = 2000;
  const MAX_INSTANCES_PER_TYPE = 3;
  const MOTION_PROP_KEYS = [
    'initial', 'animate', 'exit', 'whileHover', 'whileTap', 'whileInView',
    'transition', 'variants', 'layoutId', 'layout',
  ];

  const target = document.querySelector('[data-pablo-target]');
  if (!target) return null;
  target.removeAttribute('data-pablo-target');

  function getFiber(element: Element): any {
    const fiberKey = Object.keys(element).find((key) => key.startsWith('__reactFiber$'));
    return fiberKey ? (element as any)[fiberKey] : null;
  }

  function unwrapComponentType(type: any): any {
    if (!type) return type;
    if (type.$$typeof?.toString() === 'Symbol(react.memo)') {
      return unwrapComponentType(type.type);
    }
    if (type.$$typeof?.toString() === 'Symbol(react.forward_ref)') {
      return unwrapComponentType(type.render);
    }
    if (type.$$typeof?.toString() === 'Symbol(react.lazy)' && type._payload?._result) {
      return unwrapComponentType(type._payload._result);
    }
    return type;
  }

  function getComponentName(type: any): string {
    if (!type) return 'Unknown';
    return type.displayName || type.name || 'Anonymous';
  }

  function findComponentFiber(fiber: any): any {
    let current = fiber;
    let firstComponent: any = null;
    let hops = 0;

    while (current && hops < 30) {
      if (current.tag === 0 || current.tag === 1) {
        if (!firstComponent) firstComponent = current;
        const rawType = unwrapComponentType(current.type);
        const name = getComponentName(rawType);
        if (name !== 'Anonymous' && name !== 'Unknown') {
          return current;
        }
      }
      current = current.return;
      hops++;
    }

    return firstComponent;
  }

  function sanitizeValue(value: unknown, seen: WeakSet<object>, depth: number): unknown {
    if (depth > 10) return '[MaxDepth]';
    if (value === null || value === undefined) return value;

    switch (typeof value) {
      case 'string':
        return value.length > 500 ? `${value.slice(0, 500)}...` : value;
      case 'number':
      case 'boolean':
        return value;
      case 'function':
        return '[Function]';
      case 'symbol':
        return value.toString();
      case 'object': {
        if ((value as any).$$typeof?.toString()?.includes('react.element')) {
          return '[ReactElement]';
        }
        if (seen.has(value as object)) {
          return '[Circular]';
        }
        seen.add(value as object);

        if (Array.isArray(value)) {
          return value.slice(0, 20).map((entry) => sanitizeValue(entry, seen, depth + 1));
        }

        const result: Record<string, unknown> = {};
        for (const key of Object.keys(value as object).slice(0, 30)) {
          if (key === 'children') {
            result[key] = '[Children]';
            continue;
          }
          result[key] = sanitizeValue((value as any)[key], seen, depth + 1);
        }
        return result;
      }
      default:
        return String(value);
    }
  }

  function sanitizeProps(props: Record<string, unknown>): Record<string, unknown> {
    return sanitizeValue(props, new WeakSet(), 0) as Record<string, unknown>;
  }

  function isMotionComponent(props: Record<string, unknown>): boolean {
    return MOTION_PROP_KEYS.some((key) => key in props && props[key] !== undefined);
  }

  function extractMotionProps(
    componentName: string,
    props: Record<string, unknown>,
  ): {
    componentName: string;
    initial?: Record<string, unknown>;
    animate?: Record<string, unknown>;
    exit?: Record<string, unknown>;
    whileHover?: Record<string, unknown>;
    whileTap?: Record<string, unknown>;
    whileInView?: Record<string, unknown>;
    transition?: Record<string, unknown>;
    variants?: Record<string, unknown>;
    layoutId?: string;
    layout?: boolean | string;
  } {
    const motion: Record<string, unknown> = { componentName };
    for (const key of MOTION_PROP_KEYS) {
      if (!(key in props) || props[key] === undefined) continue;
      const value = props[key];
      if (key === 'layoutId' && typeof value === 'string') {
        motion[key] = value;
      } else if (key === 'layout' && (typeof value === 'boolean' || typeof value === 'string')) {
        motion[key] = value;
      } else if (typeof value === 'object' && value !== null) {
        motion[key] = sanitizeValue(value, new WeakSet(), 0);
      }
    }
    return motion as {
      componentName: string;
      initial?: Record<string, unknown>;
      animate?: Record<string, unknown>;
      exit?: Record<string, unknown>;
      whileHover?: Record<string, unknown>;
      whileTap?: Record<string, unknown>;
      whileInView?: Record<string, unknown>;
      transition?: Record<string, unknown>;
      variants?: Record<string, unknown>;
      layoutId?: string;
      layout?: boolean | string;
    };
  }

  function isMinifiedName(name: string): boolean {
    if (name.length <= 2) return true;
    return name.length === 3 && /^[a-z]{3}$/.test(name);
  }

  function isMinifiedSource(source: string): boolean {
    if (!source || source === '/* source unavailable */') return false;
    if (!source.includes('\n') && source.length > 200) return true;
    const semicolons = (source.match(/;/g) || []).length;
    return source.length > 100 && semicolons / source.length > 0.05;
  }

  const fiber = getFiber(target);
  if (!fiber) return null;

  const rootFiber = findComponentFiber(fiber);
  if (!rootFiber) return null;

  interface CollectedComponent {
    displayName: string;
    sourceCode: string;
    instances: { props: Record<string, unknown> }[];
    children: string[];
  }

  const componentMap = new Map<string, CollectedComponent>();
  const typeToName = new Map<Function, string>();
  const motionComponents: {
    componentName: string;
    initial?: Record<string, unknown>;
    animate?: Record<string, unknown>;
    exit?: Record<string, unknown>;
    whileHover?: Record<string, unknown>;
    whileTap?: Record<string, unknown>;
    whileInView?: Record<string, unknown>;
    transition?: Record<string, unknown>;
    variants?: Record<string, unknown>;
    layoutId?: string;
    layout?: boolean | string;
  }[] = [];
  const motionInstanceCount = new Map<string, number>();

  function collectChildNames(parentFiber: any, parentName: string): void {
    const parentData = componentMap.get(parentName);
    if (!parentData) return;

    let child = parentFiber.child;
    while (child) {
      if (child.tag === 0 || child.tag === 1) {
        const rawType = unwrapComponentType(child.type);
        const childName = getComponentName(rawType);
        if (!typeToName.has(rawType)) typeToName.set(rawType, childName);
        const resolvedName = typeToName.get(rawType) || childName;
        if (!parentData.children.includes(resolvedName)) {
          parentData.children.push(resolvedName);
        }
      }
      child = child.sibling;
    }
  }

  function walkFiber(currentFiber: any): void {
    if (!currentFiber) return;

    const isComponent = currentFiber.tag === 0 || currentFiber.tag === 1;
    if (isComponent) {
      const rawType = unwrapComponentType(currentFiber.type);
      const name = getComponentName(rawType);
      if (!typeToName.has(rawType)) typeToName.set(rawType, name);
      const displayName = typeToName.get(rawType) || name;

      if (!componentMap.has(displayName)) {
        let sourceCode = '';
        try {
          sourceCode = rawType.toString();
          if (sourceCode.length > MAX_SOURCE_LENGTH) {
            sourceCode = `${sourceCode.slice(0, MAX_SOURCE_LENGTH)}...`;
          }
        } catch {
          sourceCode = '/* source unavailable */';
        }

        if (isMinifiedName(name) && isMinifiedSource(sourceCode)) {
          sourceCode = '/* minified */';
        }

        componentMap.set(displayName, {
          displayName: sourceCode === '/* minified */' ? `Minified_${displayName}` : displayName,
          sourceCode,
          instances: [],
          children: [],
        });
      }

      const componentData = componentMap.get(displayName);
      const fiberProps = currentFiber.memoizedProps || {};
      if (componentData && componentData.instances.length < MAX_INSTANCES_PER_TYPE) {
        componentData.instances.push({ props: sanitizeProps(fiberProps) });
      }

      if (isMotionComponent(fiberProps)) {
        const count = motionInstanceCount.get(displayName) || 0;
        if (count < MAX_INSTANCES_PER_TYPE) {
          motionInstanceCount.set(displayName, count + 1);
          const motionName = count > 0 ? `${displayName}_${count + 1}` : displayName;
          motionComponents.push(extractMotionProps(motionName, fiberProps));
        }
      }

      collectChildNames(currentFiber, displayName);
    }

    if (currentFiber.tag === 5 && currentFiber.memoizedProps) {
      const hostProps = currentFiber.memoizedProps;
      if (isMotionComponent(hostProps)) {
        const hostType = typeof currentFiber.type === 'string' ? currentFiber.type : 'div';
        const motionName = `${hostType}_motion`;
        const count = motionInstanceCount.get(motionName) || 0;
        if (count < MAX_INSTANCES_PER_TYPE) {
          motionInstanceCount.set(motionName, count + 1);
          const instanceName = count > 0 ? `${motionName}_${count + 1}` : motionName;
          motionComponents.push(extractMotionProps(instanceName, hostProps));
        }
      }
    }

    if (currentFiber.child) walkFiber(currentFiber.child);
    if (currentFiber.sibling) walkFiber(currentFiber.sibling);
  }

  walkFiber(rootFiber);

  const minifiedNames = new Set<string>();
  for (const [name, data] of componentMap) {
    if (data.displayName.startsWith('Minified_')) {
      minifiedNames.add(name);
    }
  }

  if (minifiedNames.size > 0) {
    for (const data of componentMap.values()) {
      const expandedChildren: string[] = [];
      for (const childName of data.children) {
        if (!minifiedNames.has(childName)) {
          if (!expandedChildren.includes(childName)) expandedChildren.push(childName);
          continue;
        }

        const minifiedData = componentMap.get(childName);
        if (!minifiedData) continue;
        for (const grandchild of minifiedData.children) {
          if (!expandedChildren.includes(grandchild)) expandedChildren.push(grandchild);
        }
      }
      data.children = expandedChildren;
    }

    for (const name of minifiedNames) {
      componentMap.delete(name);
    }
  }

  if (componentMap.size === 0 || componentMap.size > MAX_COMPONENT_TYPES) {
    return null;
  }

  const visited = new Set<string>();
  const sorted: CollectedComponent[] = [];

  function visit(name: string): void {
    if (visited.has(name)) return;
    visited.add(name);

    const data = componentMap.get(name);
    if (!data) return;

    for (const childName of data.children) {
      visit(childName);
    }
    sorted.push(data);
  }

  for (const name of componentMap.keys()) {
    visit(name);
  }

  return {
    components: sorted,
    rootComponentName: getComponentName(unwrapComponentType(rootFiber.type)),
    motionComponents,
  };
}

