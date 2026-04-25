import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMarkdownPayload,
  filterDefaultStyles,
  stripDefaultTimingValues,
  truncateHtml,
  HARD_CAP_BYTES,
  type PayloadInput,
} from '../src/content/payload-builder.ts';

function basePayload(overrides: Partial<PayloadInput> = {}): PayloadInput {
  return {
    selector: 'div.hero',
    tag: 'div',
    url: 'https://example.com/',
    title: 'Example',
    viewport: { width: 1440, height: 900 },
    framework: 'generic',
    strategy: 'generic',
    styledHtml: '<div class="hero">Hello</div>',
    cssRules: [],
    cssVariables: {},
    interactiveSelectors: [],
    ariaRoles: [],
    ...overrides,
  };
}

test('buildMarkdownPayload emits header and html fenced block for minimal input', () => {
  const result = buildMarkdownPayload(basePayload());
  assert.equal(result.truncated, false);
  assert.equal(result.oversize, 0);
  assert.match(result.text, /^# div\.hero/);
  assert.match(result.text, /## HTML/);
  assert.match(result.text, /```html\n<div class="hero">Hello<\/div>\n```/);
});

test('buildMarkdownPayload never contains base64 image data', () => {
  const result = buildMarkdownPayload(basePayload());
  assert.doesNotMatch(result.text, /data:image\/png/);
  assert.doesNotMatch(result.text, /!\[component\]/);
});

test('buildMarkdownPayload emits screenshot placeholder when hasScreenshot is true', () => {
  const result = buildMarkdownPayload(basePayload({ hasScreenshot: true }));
  assert.match(result.text, /<!-- Screenshot: pasted separately into chat -->/);
});

test('default prompt references screenshot pasted separately as an image', () => {
  const result = buildMarkdownPayload(basePayload());
  assert.match(result.text, /screenshot \(pasted separately as an image\)/);
});

test('buildMarkdownPayload escapes HTML containing triple backticks via longer fences', () => {
  const malicious = '<pre>```js\nconst x = 1;\n```</pre>';
  const result = buildMarkdownPayload(basePayload({ styledHtml: malicious }));
  // The fence must be at least 4 backticks long since the body has a 3-backtick run.
  assert.match(result.text, /````html\n[\s\S]*```js[\s\S]*\n````/);
});

test('buildMarkdownPayload truncates and reports oversize when input exceeds hard cap', () => {
  // 250 KB of large leaf elements (each `<span>...</span>` with bulk content).
  const leaf = '<span>' + 'x'.repeat(900) + '</span>';
  const big = '<div>' + leaf.repeat(280) + '</div>';
  const result = buildMarkdownPayload(basePayload({ styledHtml: big }));
  assert.equal(result.truncated, true);
  assert.ok(result.oversize > 0, 'oversize should be > 0');
  assert.ok(result.text.length <= HARD_CAP_BYTES, `text length ${result.text.length} should be <= ${HARD_CAP_BYTES}`);
  assert.match(result.text, /<!-- (\.\.\.)?truncated/);
});

test('stripDefaultTimingValues drops delay=0, direction=normal, fill=none, iterations=1', () => {
  const cleaned = stripDefaultTimingValues({
    duration: 400,
    delay: 0,
    easing: 'ease',
    iterations: 1,
    direction: 'normal',
    fill: 'none',
  });
  assert.deepEqual(cleaned, { duration: 400, easing: 'ease' });

  const kept = stripDefaultTimingValues({
    duration: 400,
    delay: 200,
    easing: 'ease',
    iterations: 2,
    direction: 'reverse',
    fill: 'forwards',
  });
  assert.deepEqual(kept, {
    duration: 400,
    easing: 'ease',
    delay: 200,
    iterations: 2,
    direction: 'reverse',
    fill: 'forwards',
  });
});

test('animation timing defaults are stripped from active animation entries in markdown', () => {
  const result = buildMarkdownPayload(basePayload({
    animations: {
      cssAnimations: [],
      cssTransitions: [],
      keyframeDefinitions: [],
      stateStyles: {},
      activeAnimations: [{
        animationName: 'fade',
        playState: 'running',
        timing: {
          duration: 400,
          delay: 0,
          easing: 'ease-out',
          iterations: 1,
          direction: 'normal',
          fill: 'none',
        },
        keyframes: [],
      }],
      scrollTriggers: [],
      framerMotion: [],
      webflowIX2: [],
      summary: 'fade animation',
    },
  }));
  // Should reference duration and easing but NOT delay/direction/fill/iterations.
  assert.match(result.text, /Active animation:[^\n]*fade[^\n]*duration:\s*400[^\n]*easing:\s*ease-out/);
  assert.doesNotMatch(result.text, /delay:\s*0/);
  assert.doesNotMatch(result.text, /direction:\s*normal/);
  assert.doesNotMatch(result.text, /fill:\s*none/);
  assert.doesNotMatch(result.text, /iterations:\s*1/);
});

test('pseudo-state diffs render as base -> hover with matching transition timing', () => {
  const result = buildMarkdownPayload(basePayload({
    animations: {
      cssAnimations: [],
      cssTransitions: [
        { property: 'background-color', duration: '0.2s', timingFunction: 'ease-in-out', delay: '0s' },
      ],
      keyframeDefinitions: [],
      stateStyles: {
        hover: [
          { property: 'background-color', baseValue: 'rgb(255, 255, 255)', value: 'rgb(0, 0, 0)' },
        ],
      },
      activeAnimations: [],
      scrollTriggers: [],
      framerMotion: [],
      webflowIX2: [],
      summary: 'hover diff',
    },
  }));
  assert.match(result.text, /\*\*:hover\*\*:/);
  assert.match(
    result.text,
    /background-color: rgb\(255, 255, 255\) -> rgb\(0, 0, 0\) on :hover \(transitions over 0\.2s ease-in-out\)/,
  );
});

test('pseudo-state diff without matching transition omits transition parenthetical', () => {
  const result = buildMarkdownPayload(basePayload({
    animations: {
      cssAnimations: [],
      cssTransitions: [],
      keyframeDefinitions: [],
      stateStyles: {
        hover: [
          { property: 'color', baseValue: 'rgb(10, 10, 10)', value: 'rgb(200, 200, 200)' },
        ],
      },
      activeAnimations: [],
      scrollTriggers: [],
      framerMotion: [],
      webflowIX2: [],
      summary: '',
    },
  }));
  assert.match(result.text, /color: rgb\(10, 10, 10\) -> rgb\(200, 200, 200\) on :hover$/m);
  assert.doesNotMatch(result.text, /transitions over/);
});

test('child pseudo-state diffs render as indented sub-bullets keyed by selector', () => {
  const result = buildMarkdownPayload(basePayload({
    animations: {
      cssAnimations: [],
      cssTransitions: [],
      keyframeDefinitions: [],
      stateStyles: {
        hover: [
          { property: 'background-color', baseValue: '#fff', value: '#000' },
          { property: 'color', baseValue: '#888', value: '#fff', targetSelector: 'svg.icon' },
        ],
      },
      activeAnimations: [],
      scrollTriggers: [],
      framerMotion: [],
      webflowIX2: [],
      summary: '',
    },
  }));
  assert.match(result.text, /  - background-color: #fff -> #000 on :hover/);
  assert.match(result.text, /  - `svg\.icon`:/);
  assert.match(result.text, /    - color: #888 -> #fff on :hover/);
});

test('pseudo-state budget truncation drops child diffs before root diffs', () => {
  // Build many child diffs to bust the 6KB budget.
  const stateStyles = {
    hover: [
      { property: 'background-color', baseValue: '#fff', value: '#000' },
      ...Array.from({ length: 200 }, (_, i) => ({
        property: 'color',
        baseValue: 'rgb(0, 0, 0)',
        value: 'rgb(255, 255, 255)',
        targetSelector: `span.child-${i}.with-some-extra-classes-to-bulk-up-bytes`,
      })),
    ],
  };
  const result = buildMarkdownPayload(basePayload({
    animations: {
      cssAnimations: [],
      cssTransitions: [],
      keyframeDefinitions: [],
      stateStyles,
      activeAnimations: [],
      scrollTriggers: [],
      framerMotion: [],
      webflowIX2: [],
      summary: '',
    },
  }));
  // Root diff must remain.
  assert.match(result.text, /background-color: #fff -> #000 on :hover/);
  // Some child diffs must have been omitted.
  assert.match(result.text, /child diffs omitted to fit budget/);
  // The animations section as rendered must fit within its hard cap.
  const animMatch = result.text.match(/## Animations\n([\s\S]*?)(?:\n##|\n$|$)/);
  assert.ok(animMatch, 'should have an Animations section');
  // Whole animations section (including header) under the 6KB hard cap.
  const sectionLen = '## Animations\n'.length + animMatch![1].length;
  assert.ok(sectionLen <= 6_000, `animations section length ${sectionLen} exceeds 6000-byte cap`);
});

test('filterDefaultStyles removes browser-default declarations from inline styles', () => {
  const html = '<div style="display: block; color: red; margin: 0px"><span style="display: inline">hi</span></div>';
  const filtered = filterDefaultStyles(html);
  // div is block by default; margin: 0px is also default; only color: red remains.
  assert.match(filtered, /<div style="color: red"/);
  // span default display is inline -> style attribute removed entirely.
  assert.match(filtered, /<span>hi<\/span>/);
});

test('truncateHtml emits a truncation comment and strictly shrinks oversized HTML', () => {
  const huge = '<div>' + '<span>xxxxxxxxxxxxxxxxxxxxxxxx</span>'.repeat(50) + '</div>';
  const { html, removed } = truncateHtml(huge, 200);
  assert.ok(html.length < huge.length);
  assert.ok(removed > 0);
  assert.match(html, /<!-- \.\.\.truncated:/);
});
