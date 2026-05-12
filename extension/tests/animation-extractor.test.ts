import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTargetSelector,
  resolveCssValue,
} from '../src/content/animation-extractor.ts';

// Minimal DOM-shaped fakes. We avoid pulling in jsdom/happy-dom; only the
// narrow surface used by the helpers under test is implemented.
//
// Helpers that touch live DOM/getComputedStyle (extractAnimations,
// extractPseudoStateStyles, processPseudoRule) are intentionally not unit-
// tested here; they need a real document. Manual verification (see plan
// Test Plan section) covers them.

interface FakeElement extends Partial<Element> {
  tagName: string;
  parentElement: FakeElement | null;
  children: FakeElement[];
  _attrs: Record<string, string>;
  _style: Record<string, { value: string; priority: string }>;
  getAttribute(name: string): string | null;
  style: {
    setProperty(name: string, value: string, priority?: string): void;
    getPropertyValue(name: string): string;
    getPropertyPriority(name: string): string;
    removeProperty(name: string): void;
  };
}

function makeElement(opts: {
  tagName: string;
  className?: string;
  parent?: FakeElement | null;
  children?: FakeElement[];
}): FakeElement {
  const attrs: Record<string, string> = {};
  if (opts.className !== undefined) attrs['class'] = opts.className;
  const styles: Record<string, { value: string; priority: string }> = {};
  const el: FakeElement = {
    tagName: opts.tagName,
    parentElement: opts.parent ?? null,
    children: opts.children ?? [],
    _attrs: attrs,
    _style: styles,
    getAttribute(name: string): string | null {
      return name in attrs ? attrs[name] : null;
    },
    style: {
      setProperty(name: string, value: string, priority = '') {
        styles[name] = { value, priority };
      },
      getPropertyValue(name: string): string {
        return styles[name]?.value ?? '';
      },
      getPropertyPriority(name: string): string {
        return styles[name]?.priority ?? '';
      },
      removeProperty(name: string) {
        delete styles[name];
      },
    },
  };
  return el;
}

test('buildTargetSelector prefers tag.className when classes are present', () => {
  const el = makeElement({ tagName: 'SVG', className: 'icon primary' });
  assert.equal(buildTargetSelector(el as unknown as Element), 'svg.icon.primary');
});

test('buildTargetSelector falls back to tag:nth-child when no class', () => {
  const child1 = makeElement({ tagName: 'SPAN' });
  const child2 = makeElement({ tagName: 'SPAN' });
  const parent = makeElement({ tagName: 'DIV', children: [child1, child2] });
  child2.parentElement = parent;
  assert.equal(buildTargetSelector(child2 as unknown as Element), 'span:nth-child(2)');
});

test('buildTargetSelector handles empty class attribute by falling back', () => {
  const child = makeElement({ tagName: 'P', className: '   ' });
  const parent = makeElement({ tagName: 'DIV', children: [child] });
  child.parentElement = parent;
  assert.equal(buildTargetSelector(child as unknown as Element), 'p:nth-child(1)');
});

test('buildTargetSelector returns just the tag for an orphan element with no class', () => {
  const el = makeElement({ tagName: 'BUTTON' });
  assert.equal(buildTargetSelector(el as unknown as Element), 'button');
});

test('resolveCssValue restores original inline value and priority after probing', () => {
  const el = makeElement({ tagName: 'DIV' });
  // Pre-existing inline style on the element.
  el.style.setProperty('color', 'rgb(1, 2, 3)', 'important');

  // Stub global window.getComputedStyle for the duration of this test.
  const originalWindow = (globalThis as { window?: unknown }).window;
  (globalThis as { window: unknown }).window = {
    getComputedStyle(target: FakeElement) {
      return {
        getPropertyValue(name: string) {
          // Whatever is currently set inline is treated as the resolved value.
          return target.style.getPropertyValue(name);
        },
      };
    },
  };
  try {
    const resolved = resolveCssValue(el as unknown as Element, 'color', 'var(--accent)');
    // The probe set 'var(--accent)' temporarily; our stubbed getComputedStyle
    // returned exactly that, so the resolved value reflects the probe.
    assert.equal(resolved, 'var(--accent)');
    // After resolveCssValue returns, the original inline value & priority are restored.
    assert.equal(el.style.getPropertyValue('color'), 'rgb(1, 2, 3)');
    assert.equal(el.style.getPropertyPriority('color'), 'important');
  } finally {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window: unknown }).window = originalWindow;
    }
  }
});

test('resolveCssValue removes the inline property when there was no original value', () => {
  const el = makeElement({ tagName: 'DIV' });
  const originalWindow = (globalThis as { window?: unknown }).window;
  (globalThis as { window: unknown }).window = {
    getComputedStyle(target: FakeElement) {
      return {
        getPropertyValue(name: string) {
          return target.style.getPropertyValue(name);
        },
      };
    },
  };
  try {
    resolveCssValue(el as unknown as Element, 'opacity', '0.5');
    assert.equal(el.style.getPropertyValue('opacity'), '');
  } finally {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window: unknown }).window = originalWindow;
    }
  }
});
