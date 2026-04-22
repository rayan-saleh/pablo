import test from 'node:test';
import assert from 'node:assert/strict';

import { buildRelativeSelectorPath, buildSummarySelector } from '../src/shared/selector-paths.ts';

type MockNode = {
  tagName: string;
  id?: string;
  className?: string;
  parentElement: MockNode | null;
  children: MockNode[];
};

function node(tagName: string, options: { id?: string; className?: string } = {}): MockNode {
  return {
    tagName,
    id: options.id,
    className: options.className,
    parentElement: null,
    children: [],
  };
}

function append(parent: MockNode, child: MockNode): MockNode {
  child.parentElement = parent;
  parent.children.push(child);
  return child;
}

test('buildSummarySelector prefers ids over classes', () => {
  const el = node('DIV', { id: 'hero', className: 'card highlighted' });
  assert.equal(buildSummarySelector(el), 'div#hero');
});

test('buildSummarySelector includes the first class tokens when there is no id', () => {
  const el = node('BUTTON', { className: 'primary large active' });
  assert.equal(buildSummarySelector(el), 'button.primary.large');
});

test('buildRelativeSelectorPath supports nth-child output', () => {
  const root = node('SECTION');
  append(root, node('HEADER'));
  const list = append(root, node('UL'));
  append(list, node('LI'));
  const target = append(list, node('LI'));

  assert.equal(
    buildRelativeSelectorPath(root, target, 'nth-child'),
    'ul:nth-child(2) > li:nth-child(2)',
  );
});

test('buildRelativeSelectorPath supports nth-of-type output', () => {
  const root = node('SECTION');
  append(root, node('HEADER'));
  const list = append(root, node('UL'));
  append(list, node('DIV'));
  const target = append(list, node('LI'));

  assert.equal(
    buildRelativeSelectorPath(root, target, 'nth-of-type'),
    'ul:nth-of-type(1) > li:nth-of-type(1)',
  );
});

