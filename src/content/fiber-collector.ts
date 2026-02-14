import type { ComponentData, FiberInstanceData, ReconstructionPayload } from '../shared/types';

const MAX_COMPONENT_TYPES = 50;

/**
 * Walk the React Fiber tree from the clicked element downward,
 * collecting component data for LLM reconstruction.
 */
export function collectFiberData(element: Element): ReconstructionPayload | null {
  console.log('[CC] Fiber collection starting for element:', element.tagName.toLowerCase());
  const fiber = getFiber(element);
  if (!fiber) return null;

  // Walk up to find the nearest component fiber (function or class)
  const rootFiber = findComponentFiber(fiber);
  if (!rootFiber) return null;

  const componentMap = new Map<string, ComponentData>();
  const typeToName = new Map<Function, string>();

  // Collect all component types by walking the fiber subtree
  walkFiberTree(rootFiber, componentMap, typeToName);

  if (componentMap.size === 0) return null;

  if (componentMap.size > MAX_COMPONENT_TYPES) {
    console.warn(
      `[Component Copier] Found ${componentMap.size} component types (limit ${MAX_COMPONENT_TYPES}). ` +
      `Try clicking a more specific component.`
    );
    return null;
  }

  console.log('[CC] Components found:', componentMap.size);

  // Topological sort: leaves first (children before parents)
  const sorted = topologicalSort(componentMap);

  const rootName = getComponentName(unwrapComponentType(rootFiber.type));
  console.log('[CC] Root component:', rootName);
  return {
    components: sorted,
    rootComponentName: rootName,
  };
}

function getFiber(element: Element): any {
  const fiberKey = Object.keys(element).find((k) => k.startsWith('__reactFiber$'));
  return fiberKey ? (element as any)[fiberKey] : null;
}

function findComponentFiber(fiber: any): any {
  let current = fiber;
  while (current) {
    if (current.tag === 0 || current.tag === 1) {
      return current;
    }
    current = current.return;
  }
  return null;
}

/**
 * Unwrap memo(), forwardRef(), lazy() wrappers to get the actual component function.
 */
function unwrapComponentType(type: any): any {
  if (!type) return type;
  // memo wrapping
  if (type.$$typeof?.toString() === 'Symbol(react.memo)') {
    return unwrapComponentType(type.type);
  }
  // forwardRef wrapping
  if (type.$$typeof?.toString() === 'Symbol(react.forward_ref)') {
    return unwrapComponentType(type.render);
  }
  // lazy wrapping
  if (type.$$typeof?.toString() === 'Symbol(react.lazy)') {
    // _payload._result is the resolved component after lazy loads
    if (type._payload?._result) {
      return unwrapComponentType(type._payload._result);
    }
  }
  return type;
}

function getComponentName(type: any): string {
  if (!type) return 'Unknown';
  return type.displayName || type.name || 'Anonymous';
}

/**
 * Find the nearest DOM node rendered by a fiber (walk down to HostComponent).
 */
function findDomNode(fiber: any): Element | null {
  let node = fiber;
  while (node) {
    if ((node.tag === 5 || node.tag === 6) && node.stateNode instanceof Element) {
      return node.stateNode;
    }
    node = node.child;
  }
  return null;
}

function walkFiberTree(
  fiber: any,
  componentMap: Map<string, ComponentData>,
  typeToName: Map<Function, string>,
): void {
  if (!fiber) return;

  const isComponent = fiber.tag === 0 || fiber.tag === 1;

  if (isComponent) {
    const rawType = unwrapComponentType(fiber.type);
    const name = getComponentName(rawType);

    if (!typeToName.has(rawType)) {
      typeToName.set(rawType, name);
    }

    const displayName = typeToName.get(rawType)!;

    if (!componentMap.has(displayName)) {
      let sourceCode = '';
      try {
        sourceCode = rawType.toString();
      } catch {
        sourceCode = '/* source unavailable */';
      }

      componentMap.set(displayName, {
        displayName,
        sourceCode,
        instances: [],
        children: [],
      });
    }

    const data = componentMap.get(displayName)!;

    // Collect this instance's props + rendered HTML
    const dom = findDomNode(fiber);
    const instance: FiberInstanceData = {
      props: sanitizeProps(fiber.memoizedProps),
      html: dom?.outerHTML ?? '',
    };
    data.instances.push(instance);

    // Find child component types (direct children in fiber tree)
    collectChildComponentNames(fiber, displayName, componentMap, typeToName);
  }

  // Recurse into children and siblings
  if (fiber.child) {
    walkFiberTree(fiber.child, componentMap, typeToName);
  }
  if (fiber.sibling) {
    walkFiberTree(fiber.sibling, componentMap, typeToName);
  }
}

function collectChildComponentNames(
  parentFiber: any,
  parentName: string,
  componentMap: Map<string, ComponentData>,
  typeToName: Map<Function, string>,
): void {
  const parentData = componentMap.get(parentName)!;
  let child = parentFiber.child;

  while (child) {
    if (child.tag === 0 || child.tag === 1) {
      const rawType = unwrapComponentType(child.type);
      const childName = getComponentName(rawType);
      if (!typeToName.has(rawType)) {
        typeToName.set(rawType, childName);
      }
      const name = typeToName.get(rawType)!;
      if (!parentData.children.includes(name)) {
        parentData.children.push(name);
      }
    }
    child = child.sibling;
  }
}

/**
 * Sanitize props for JSON serialization:
 * - Functions → "[Function]"
 * - Circular references → "[Circular]"
 * - Large strings → truncated
 * - React elements → "[ReactElement]"
 */
export function sanitizeProps(props: Record<string, unknown>): Record<string, unknown> {
  const seen = new WeakSet();
  return sanitizeValue(props, seen, 0) as Record<string, unknown>;
}

function sanitizeValue(value: unknown, seen: WeakSet<object>, depth: number): unknown {
  if (depth > 10) return '[MaxDepth]';

  if (value === null || value === undefined) return value;

  switch (typeof value) {
    case 'string':
      return value.length > 500 ? value.slice(0, 500) + '...' : value;
    case 'number':
    case 'boolean':
      return value;
    case 'function':
      return '[Function]';
    case 'symbol':
      return value.toString();
    case 'object': {
      // React elements
      if ((value as any).$$typeof?.toString()?.includes('react.element')) {
        return '[ReactElement]';
      }

      if (seen.has(value as object)) return '[Circular]';
      seen.add(value as object);

      if (Array.isArray(value)) {
        return value.slice(0, 20).map((v) => sanitizeValue(v, seen, depth + 1));
      }

      const result: Record<string, unknown> = {};
      const keys = Object.keys(value as object);
      for (const key of keys.slice(0, 30)) {
        if (key === 'children') {
          // Skip children prop — it's the rendered tree, not useful for reconstruction
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

/**
 * Topological sort: components with no children first (leaves),
 * so that when we reconstruct parent components, child code is already available.
 */
function topologicalSort(componentMap: Map<string, ComponentData>): ComponentData[] {
  const visited = new Set<string>();
  const result: ComponentData[] = [];

  function visit(name: string) {
    if (visited.has(name)) return;
    visited.add(name);

    const data = componentMap.get(name);
    if (!data) return;

    for (const childName of data.children) {
      visit(childName);
    }
    result.push(data);
  }

  for (const name of componentMap.keys()) {
    visit(name);
  }

  return result;
}
