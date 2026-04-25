import type {
  AnimationData,
  ComponentTree,
  FontData,
  StrategyKey,
  TechStack,
  PseudoState,
  PseudoStateDiff,
  ActiveAnimationData,
  CSSTransitionData,
} from '../shared/types';

export interface PayloadInput {
  selector: string;
  tag: string;
  url: string;
  title: string;
  viewport: { width: number; height: number };
  framework: TechStack;
  strategy: StrategyKey;
  styledHtml: string;
  cssRules: string[];
  cssVariables: Record<string, string>;
  animations?: AnimationData;
  interactiveSelectors: string[];
  ariaRoles: string[];
  links?: { href: string; text: string }[];
  buttons?: { text: string; selector: string }[];
  fonts?: FontData;
  componentTree?: ComponentTree;
  hasScreenshot?: boolean;
  prompt?: string;
}

export interface BuildPayloadResult {
  text: string;
  truncated: boolean;
  oversize: number;
}

// Per-section soft target / hard cap (bytes) per plan section 5.
export const SECTION_BUDGETS = {
  header: { target: 200, hardCap: 300 },
  html: { target: 18_000, hardCap: 25_000 },
  cssRules: { target: 6_000, hardCap: 12_000 },
  cssVariables: { target: 1_500, hardCap: 3_000 },
  animations: { target: 3_000, hardCap: 6_000 },
  interactions: { target: 2_000, hardCap: 4_000 },
  fonts: { target: 500, hardCap: 1_000 },
  componentTree: { target: 2_000, hardCap: 4_000 },
  prompt: { target: 500, hardCap: 800 },
} as const;

export const HARD_CAP_BYTES = 80_000;

const DEFAULT_PROMPT =
  'Rebuild this component to match the screenshot (pasted separately as an image) exactly. Use the HTML structure as a starting point, apply the CSS rules for styling, and implement all listed animations and interactions. Preserve responsive behavior from media queries. Use semantic HTML and the listed font families.';

// --- Default browser styles by tag (for filterDefaultStyles second pass) ---

const ALWAYS_DEFAULT: Record<string, string> = {
  'margin': '0px',
  'padding': '0px',
  'border-width': '0px',
  'border-style': 'none',
  'outline-width': '0px',
  'box-shadow': 'none',
  'background-image': 'none',
  'background-color': 'rgba(0, 0, 0, 0)',
  'text-decoration': 'none solid rgb(0, 0, 0)',
  'text-decoration-line': 'none',
  'text-shadow': 'none',
  'transform': 'none',
  'opacity': '1',
  'visibility': 'visible',
  'pointer-events': 'auto',
  'cursor': 'auto',
  'float': 'none',
  'clear': 'none',
  'overflow': 'visible',
  'overflow-x': 'visible',
  'overflow-y': 'visible',
  'z-index': 'auto',
  'top': 'auto',
  'right': 'auto',
  'bottom': 'auto',
  'left': 'auto',
  'min-width': 'auto',
  'min-height': 'auto',
  'max-width': 'none',
  'max-height': 'none',
  'flex-grow': '0',
  'flex-shrink': '1',
  'flex-basis': 'auto',
  'order': '0',
  'word-spacing': '0px',
  'letter-spacing': 'normal',
  'word-break': 'normal',
  'word-wrap': 'normal',
  'white-space': 'normal',
  'text-align': 'start',
  'text-transform': 'none',
  'font-style': 'normal',
  'font-weight': '400',
  'font-variant': 'normal',
  'list-style': 'outside none none',
  'list-style-type': 'disc',
};

const TAG_DEFAULTS: Record<string, Record<string, string>> = {
  div: { display: 'block' },
  span: { display: 'inline' },
  p: { display: 'block' },
  a: { display: 'inline' },
  section: { display: 'block' },
  article: { display: 'block' },
  header: { display: 'block' },
  footer: { display: 'block' },
  nav: { display: 'block' },
  main: { display: 'block' },
  aside: { display: 'block' },
  ul: { display: 'block' },
  ol: { display: 'block' },
  li: { display: 'list-item' },
  h1: { display: 'block', 'font-weight': '700' },
  h2: { display: 'block', 'font-weight': '700' },
  h3: { display: 'block', 'font-weight': '700' },
  h4: { display: 'block', 'font-weight': '700' },
  h5: { display: 'block', 'font-weight': '700' },
  h6: { display: 'block', 'font-weight': '700' },
  button: { 'font-weight': '400' },
  img: { display: 'inline' },
  svg: { display: 'inline' },
};

// --- Markdown fence helpers ---

/**
 * Choose a fence length sufficient to escape any backtick run inside the body.
 * Default is 3; if the body contains a run of N+ backticks, return N+1 (min 3).
 */
function chooseFenceLength(body: string): number {
  let max = 0;
  let current = 0;
  for (const ch of body) {
    if (ch === '`') {
      current++;
      if (current > max) max = current;
    } else {
      current = 0;
    }
  }
  return Math.max(3, max + 1);
}

function fenceBlock(lang: string, body: string): string {
  const len = chooseFenceLength(body);
  const fence = '`'.repeat(len);
  return `${fence}${lang}\n${body}\n${fence}`;
}

// --- filterDefaultStyles (second pass) ---

/**
 * Strip computed-style declarations that match browser defaults for the
 * element's tag. Operates on inline `style="..."` attributes inside the
 * styled HTML produced by `extractor.ts`. Returns the filtered HTML.
 */
export function filterDefaultStyles(styledHtml: string): string {
  return styledHtml.replace(/<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*?)\sstyle="([^"]*)"([^>]*)>/g, (_, tagName: string, before: string, styleAttr: string, after: string) => {
    const tag = tagName.toLowerCase();
    const tagDefaults = TAG_DEFAULTS[tag] || {};
    const declarations = styleAttr
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean);
    const kept: string[] = [];
    for (const decl of declarations) {
      const idx = decl.indexOf(':');
      if (idx === -1) continue;
      const prop = decl.slice(0, idx).trim().toLowerCase();
      const value = decl.slice(idx + 1).trim();
      if (ALWAYS_DEFAULT[prop] === value) continue;
      if (tagDefaults[prop] === value) continue;
      kept.push(`${prop}: ${value}`);
    }
    if (kept.length === 0) {
      return `<${tagName}${before}${after}>`;
    }
    return `<${tagName}${before} style="${kept.join('; ')}"${after}>`;
  });
}

// --- HTML truncation (leaf-first reverse-DOM) ---

interface TagToken {
  kind: 'open' | 'close' | 'void';
  tagName: string;
  start: number; // index in source
  end: number; // exclusive
  raw: string;
}

function tokenizeHtml(html: string): TagToken[] {
  const tokens: TagToken[] = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/)?>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(html)) !== null) {
    const raw = m[0];
    const tagName = m[1].toLowerCase();
    const isClosing = raw.startsWith('</');
    const isVoid = raw.endsWith('/>') || /^(img|br|hr|input|meta|link|source)$/.test(tagName);
    tokens.push({
      kind: isClosing ? 'close' : isVoid ? 'void' : 'open',
      tagName,
      start: m.index,
      end: m.index + raw.length,
      raw,
    });
  }
  return tokens;
}

interface NodeRange {
  tagName: string;
  openStart: number;
  openEnd: number;
  closeStart: number;
  closeEnd: number;
  depth: number;
  childCount: number; // direct child element count
  parentIndex: number;
}

function parseNodeRanges(html: string): NodeRange[] {
  const tokens = tokenizeHtml(html);
  const ranges: NodeRange[] = [];
  const stack: { rangeIndex: number; depth: number }[] = [];

  for (const tok of tokens) {
    if (tok.kind === 'open') {
      const range: NodeRange = {
        tagName: tok.tagName,
        openStart: tok.start,
        openEnd: tok.end,
        closeStart: tok.end,
        closeEnd: tok.end,
        depth: stack.length,
        childCount: 0,
        parentIndex: stack.length > 0 ? stack[stack.length - 1].rangeIndex : -1,
      };
      const idx = ranges.length;
      ranges.push(range);
      if (stack.length > 0) {
        ranges[stack[stack.length - 1].rangeIndex].childCount++;
      }
      stack.push({ rangeIndex: idx, depth: stack.length });
    } else if (tok.kind === 'close') {
      // Pop matching
      for (let i = stack.length - 1; i >= 0; i--) {
        const r = ranges[stack[i].rangeIndex];
        if (r.tagName === tok.tagName) {
          r.closeStart = tok.start;
          r.closeEnd = tok.end;
          stack.splice(i);
          break;
        }
      }
    } else {
      // void: counts as child of parent
      if (stack.length > 0) {
        ranges[stack[stack.length - 1].rangeIndex].childCount++;
      }
    }
  }
  return ranges;
}

/**
 * Truncate styled HTML by removing leaf elements in reverse DOM order
 * (deepest first, then last-sibling first). Leaves a comment marker at
 * each removal site. Stops once `html.length <= maxBytes`.
 */
export function truncateHtml(html: string, maxBytes: number): { html: string; removed: number } {
  if (html.length <= maxBytes) return { html, removed: 0 };

  let current = html;
  let removed = 0;
  // Iteratively re-parse after each batch removal to keep ranges accurate.
  for (let iter = 0; iter < 20 && current.length > maxBytes; iter++) {
    const ranges = parseNodeRanges(current);
    if (ranges.length <= 1) break;

    // leaves only: childCount === 0; sort deepest first, then by descending openStart (last sibling first)
    const leaves = ranges
      .filter((r) => r.childCount === 0 && r.parentIndex !== -1)
      .sort((a, b) => (b.depth - a.depth) || (b.openStart - a.openStart));

    if (leaves.length === 0) break;

    // remove leaves until we are under budget or out of leaves; do batch from the back
    // We must rebuild string with non-overlapping removals.
    const toRemove = [];
    let projected = current.length;
    const replacementLen = `<!-- ...truncated: removed 1 element -->`.length;
    for (const leaf of leaves) {
      if (projected <= maxBytes) break;
      const span = leaf.closeEnd - leaf.openStart;
      // After merging, a run of adjacent leaves shares a single comment, so we
      // optimistically include even small leaves; the merge step amortizes them.
      toRemove.push(leaf);
      projected -= Math.max(0, span - Math.ceil(replacementLen / 4));
    }
    if (toRemove.length === 0) break;

    // Group consecutive removals from the same parent into one comment to save bytes.
    // Sort by openStart ascending for rebuild.
    toRemove.sort((a, b) => a.openStart - b.openStart);

    // Merge adjacent same-parent leaves into a single comment.
    const merged: { start: number; end: number; count: number }[] = [];
    for (const leaf of toRemove) {
      const last = merged[merged.length - 1];
      if (last && last.end === leaf.openStart) {
        last.end = leaf.closeEnd;
        last.count++;
      } else if (last && leaf.openStart < last.end) {
        // overlap (shouldn't happen for siblings) — skip
        continue;
      } else {
        merged.push({ start: leaf.openStart, end: leaf.closeEnd, count: 1 });
      }
    }

    let next = '';
    let cursor = 0;
    for (const seg of merged) {
      next += current.slice(cursor, seg.start);
      next += `<!-- ...truncated: removed ${seg.count} element${seg.count === 1 ? '' : 's'} -->`;
      cursor = seg.end;
      removed += seg.count;
    }
    next += current.slice(cursor);

    if (next.length >= current.length) break;
    current = next;
  }

  return { html: current, removed };
}

// --- Animation timing strip helpers ---

/**
 * Drop default timing values from an `ActiveAnimationData.timing` object.
 * Mirrors the deleted `stripDefaultTimingValues` semantics from
 * capture-orchestrator.ts: delay===0, direction==='normal',
 * fill==='none', iterations===1.
 */
export function stripDefaultTimingValues(
  timing: ActiveAnimationData['timing'],
): Partial<ActiveAnimationData['timing']> {
  const out: Partial<ActiveAnimationData['timing']> = {
    duration: timing.duration,
    easing: timing.easing,
  };
  if (timing.delay !== 0) out.delay = timing.delay;
  if (timing.direction !== 'normal') out.direction = timing.direction;
  if (timing.fill !== 'none') out.fill = timing.fill;
  if (timing.iterations !== 1) out.iterations = timing.iterations;
  return out;
}

// --- Section formatters ---

function fmtHeader(input: PayloadInput): string {
  const lines = [`# ${input.selector}`];
  const meta = `_Captured from ${input.url} · ${input.tag} · ${input.viewport.width}x${input.viewport.height}_`;
  lines.push(meta);
  if (input.hasScreenshot) {
    lines.push('<!-- Screenshot: pasted separately into chat -->');
  }
  return lines.join('\n');
}

function fmtHtml(html: string): string {
  return `## HTML\n${fenceBlock('html', html)}`;
}

function fmtCssRules(rules: string[]): string {
  if (rules.length === 0) return '';
  return `## CSS Rules\n${fenceBlock('css', rules.join('\n'))}`;
}

function fmtCssVariables(vars: Record<string, string>): string {
  const entries = Object.entries(vars);
  if (entries.length === 0) return '';
  const body = entries.map(([k, v]) => `${k}: ${v};`).join('\n');
  return `## CSS Variables\n${fenceBlock('css', body)}`;
}

// --- Pseudo-state diff formatting ---

const VALUE_TRUNCATE_LIMIT = 200;
// Properties considered low-priority when budget squeezing.
const LOW_PRIORITY_PROPS = new Set([
  'cursor',
  'outline-offset',
  'outline-color',
  'outline-style',
  'outline-width',
  'caret-color',
  'user-select',
  '-webkit-user-select',
]);

function truncateValue(value: string): string {
  if (value.length <= VALUE_TRUNCATE_LIMIT) return value;
  return value.slice(0, VALUE_TRUNCATE_LIMIT - 3) + '...';
}

function findMatchingTransition(
  property: string,
  transitions: CSSTransitionData[],
): CSSTransitionData | undefined {
  return transitions.find(
    (t) => t.property === property || t.property === 'all',
  );
}

function formatDiffLine(diff: PseudoStateDiff, state: PseudoState, transitions: CSSTransitionData[]): string {
  const base = truncateValue(diff.baseValue);
  const value = truncateValue(diff.value);
  const match = findMatchingTransition(diff.property, transitions);
  if (match) {
    return `${diff.property}: ${base} -> ${value} on :${state} (transitions over ${match.duration} ${match.timingFunction})`;
  }
  return `${diff.property}: ${base} -> ${value} on :${state}`;
}

interface SectionAssembly {
  rootLines: string[];
  childGroups: { selector: string; lines: string[] }[];
}

function assemblePseudoState(
  state: PseudoState,
  diffs: PseudoStateDiff[],
  transitions: CSSTransitionData[],
): SectionAssembly {
  const rootLines: string[] = [];
  const childMap = new Map<string, string[]>();
  for (const diff of diffs) {
    const line = formatDiffLine(diff, state, transitions);
    if (!diff.targetSelector) {
      rootLines.push(line);
    } else {
      const list = childMap.get(diff.targetSelector) || [];
      list.push(line);
      childMap.set(diff.targetSelector, list);
    }
  }
  return {
    rootLines,
    childGroups: Array.from(childMap.entries()).map(([selector, lines]) => ({ selector, lines })),
  };
}

function renderAssembly(
  state: PseudoState,
  asm: SectionAssembly,
  childOmittedNote?: number,
): string {
  const out: string[] = [];
  out.push(`- **:${state}**:`);
  for (const line of asm.rootLines) {
    out.push(`  - ${line}`);
  }
  for (const group of asm.childGroups) {
    out.push(`  - \`${group.selector}\`:`);
    for (const line of group.lines) {
      out.push(`    - ${line}`);
    }
  }
  if (childOmittedNote && childOmittedNote > 0) {
    out.push(`  <!-- ${childOmittedNote} child diffs omitted to fit budget -->`);
  }
  return out.join('\n');
}

function formatPseudoStateSections(
  stateStyles: NonNullable<AnimationData['stateStyles']>,
  transitions: CSSTransitionData[],
  hardCap: number,
): string {
  const states = Object.keys(stateStyles) as PseudoState[];
  // Build all assemblies first.
  const assemblies: { state: PseudoState; asm: SectionAssembly }[] = [];
  for (const state of states) {
    const diffs = stateStyles[state];
    if (!diffs || diffs.length === 0) continue;
    const asm = assemblePseudoState(state, diffs, transitions);
    if (asm.rootLines.length === 0 && asm.childGroups.length === 0) continue;
    assemblies.push({ state, asm });
  }
  if (assemblies.length === 0) return '';

  const omittedChildCounts = new Map<PseudoState, number>();
  const render = () =>
    assemblies
      .map(({ state, asm }) => renderAssembly(state, asm, omittedChildCounts.get(state)))
      .join('\n');

  // Step 1: drop child groups (lowest-priority bucket) until under cap.
  while (render().length > hardCap) {
    let didDrop = false;
    // Drop from the assembly with the most child groups first.
    for (let i = assemblies.length - 1; i >= 0; i--) {
      const asm = assemblies[i].asm;
      if (asm.childGroups.length > 0) {
        const popped = asm.childGroups.pop()!;
        omittedChildCounts.set(
          assemblies[i].state,
          (omittedChildCounts.get(assemblies[i].state) || 0) + popped.lines.length,
        );
        didDrop = true;
        break;
      }
    }
    if (!didDrop) break;
  }

  // Step 2: if still over, drop low-priority root-line properties.
  if (render().length > hardCap) {
    for (const { asm } of assemblies) {
      asm.rootLines = asm.rootLines.filter((line) => {
        const propMatch = line.match(/^([a-z-]+):/i);
        if (!propMatch) return true;
        return !LOW_PRIORITY_PROPS.has(propMatch[1].toLowerCase());
      });
      if (render().length <= hardCap) break;
    }
  }

  // Step 3: if still over, drop trailing root lines.
  while (render().length > hardCap) {
    let didDrop = false;
    for (let i = assemblies.length - 1; i >= 0; i--) {
      if (assemblies[i].asm.rootLines.length > 0) {
        assemblies[i].asm.rootLines.pop();
        didDrop = true;
        break;
      }
    }
    if (!didDrop) break;
  }

  return render();
}

function fmtAnimations(animations?: AnimationData): string {
  if (!animations) return '';
  const lines: string[] = [];

  for (const t of animations.cssTransitions) {
    lines.push(`- **CSS transition:** ${t.property} ${t.duration} ${t.timingFunction}${t.delay && t.delay !== '0s' ? ` (delay ${t.delay})` : ''}`);
  }

  for (const a of animations.cssAnimations) {
    const kf = animations.keyframeDefinitions.find((k) => k.name === a.name);
    let kfStr = '';
    if (kf) {
      kfStr = ' (keyframes: ' + kf.keyframes.map((f) => `${f.offset} { ${Object.entries(f.properties).map(([k, v]) => `${k}: ${v}`).join('; ')} }`).join(', ') + ')';
    }
    lines.push(`- **CSS animation:** ${a.name} ${a.duration} ${a.timingFunction}${kfStr}`);
  }

  for (const active of animations.activeAnimations) {
    const t = stripDefaultTimingValues(active.timing);
    const tStr = Object.entries(t).map(([k, v]) => `${k}: ${v}`).join(', ');
    lines.push(`- **Active animation:** ${active.animationName} { ${tStr} }`);
  }

  // TODO(phase-2): empirical base64 screenshot spike — see .omc/plans/hover-context-enhanced-textual.md
  if (animations.stateStyles) {
    const pseudoLines = formatPseudoStateSections(
      animations.stateStyles,
      animations.cssTransitions,
      SECTION_BUDGETS.animations.hardCap,
    );
    if (pseudoLines) lines.push(pseudoLines);
  }

  if (animations.gsap?.detected) {
    const g = animations.gsap;
    const parts = [`GSAP${g.version ? ' v' + g.version : ''}`];
    for (const st of g.scrollTriggers) {
      parts.push(`ScrollTrigger on ${st.triggerSelector}${st.start ? ', start: "' + st.start + '"' : ''}${typeof st.scrub !== 'undefined' ? ', scrub: ' + String(st.scrub) : ''}`);
    }
    for (const tw of g.tweens.slice(0, 8)) {
      const propStr = Object.entries(tw.properties).map(([k, v]) => `${k}: ${String(v)}`).join(', ');
      parts.push(`tween ${tw.targetSelector} { ${propStr} }${typeof tw.duration !== 'undefined' ? ', duration ' + tw.duration + 's' : ''}`);
    }
    lines.push(`- **GSAP:** ${parts.join('; ')}`);
  }

  for (const fm of animations.framerMotion) {
    const segs: string[] = [];
    if (fm.initial) segs.push(`initial=${JSON.stringify(fm.initial)}`);
    if (fm.animate) segs.push(`animate=${JSON.stringify(fm.animate)}`);
    if (fm.exit) segs.push(`exit=${JSON.stringify(fm.exit)}`);
    if (fm.whileHover) segs.push(`whileHover=${JSON.stringify(fm.whileHover)}`);
    if (fm.whileTap) segs.push(`whileTap=${JSON.stringify(fm.whileTap)}`);
    if (fm.whileInView) segs.push(`whileInView=${JSON.stringify(fm.whileInView)}`);
    if (fm.transition) segs.push(`transition=${JSON.stringify(fm.transition)}`);
    lines.push(`- **Framer Motion:** ${fm.componentName} ${segs.join(' ')}`);
  }

  for (const ix of animations.webflowIX2) {
    for (const inter of ix.interactions) {
      lines.push(`- **Webflow IX2:** ${inter.trigger} on ${ix.elementId}`);
    }
  }

  if (lines.length === 0) return '';
  return `## Animations\n${lines.join('\n')}`;
}

function fmtInteractions(input: PayloadInput): string {
  const sections: string[] = [];
  if (input.interactiveSelectors.length > 0) {
    sections.push(`- **Interactive elements:** ${input.interactiveSelectors.join(', ')}`);
  }
  if (input.ariaRoles.length > 0) {
    sections.push(`- **ARIA roles:** ${input.ariaRoles.join(', ')}`);
  }
  if (sections.length === 0) return '';
  return `## Interactions\n${sections.join('\n')}`;
}

function fmtFonts(fonts?: FontData): string {
  if (!fonts) return '';
  const lines: string[] = [];
  for (const ff of fonts.fontFaces) {
    const bits = [ff.family];
    if (ff.weight) bits.push(`weight ${ff.weight}`);
    if (ff.style) bits.push(`style ${ff.style}`);
    lines.push(`- ${bits.join(' — ')}`);
  }
  if (fonts.pseudoContent.length > 0) {
    for (const pc of fonts.pseudoContent.slice(0, 6)) {
      lines.push(`- ${pc.selector}${pc.pseudo}: content="${pc.content.slice(0, 40)}" font="${pc.fontFamily}"`);
    }
  }
  if (lines.length === 0) return '';
  return `## Fonts\n${lines.join('\n')}`;
}

function fmtComponentTree(tree: ComponentTree | undefined, maxDepth = 4): string {
  if (!tree) return '';
  const lines: string[] = [];
  function walk(node: ComponentTree, depth: number): void {
    if (depth > maxDepth) return;
    lines.push(`${'  '.repeat(depth)}- ${node.name}`);
    for (const child of node.children) walk(child, depth + 1);
  }
  walk(tree, 0);
  return `## Component Tree\n${lines.join('\n')}`;
}

function fmtPrompt(prompt?: string): string {
  return `## Prompt\n${(prompt ?? DEFAULT_PROMPT).trim()}`;
}

// --- Section truncation within budget ---

function truncateLines(text: string, maxBytes: number): { text: string; removed: number } {
  if (text.length <= maxBytes) return { text, removed: 0 };
  // Drop trailing lines until under budget, leaving comment.
  const lines = text.split('\n');
  let removed = 0;
  while (lines.length > 1) {
    lines.pop();
    removed++;
    const candidate = lines.join('\n') + `\n<!-- truncated: ${removed} entries removed -->`;
    if (candidate.length <= maxBytes) {
      return { text: candidate, removed };
    }
  }
  return { text: text.slice(0, maxBytes) + '\n<!-- truncated -->', removed };
}

function truncateFenced(section: string, maxBytes: number): { text: string; truncated: boolean } {
  if (section.length <= maxBytes) return { text: section, truncated: false };
  // Identify fence body, truncate body, re-emit.
  const fenceMatch = section.match(/^(##\s.*\n)([`~]{3,})([a-zA-Z]*)\n([\s\S]*?)\n\2$/);
  if (!fenceMatch) {
    return { text: section.slice(0, maxBytes) + '\n<!-- truncated -->', truncated: true };
  }
  const [, header, fence, lang, body] = fenceMatch;
  const overhead = header.length + fence.length + lang.length + 1 + 1 + fence.length;
  const truncationComment = '\n<!-- truncated -->';
  const allowedBody = Math.max(0, maxBytes - overhead - truncationComment.length);
  const truncatedBody = body.slice(0, allowedBody) + truncationComment;
  return {
    text: `${header}${fence}${lang}\n${truncatedBody}\n${fence}`,
    truncated: true,
  };
}

// --- Main builder ---

function assembleParts(parts: string[]): string {
  return parts.filter((p) => p && p.length > 0).join('\n\n');
}

export function buildMarkdownPayload(input: PayloadInput): BuildPayloadResult {
  // 1. filterDefaultStyles second pass
  const filteredHtml = filterDefaultStyles(input.styledHtml);

  // 2. HTML is the most critical section. We do NOT pre-truncate it to the
  //    section hard cap; instead it competes for the global hard cap and is
  //    truncated last (deepest-leaf-first) only if the global budget overflows.
  let workingHtml = filteredHtml;

  // 3. Build initial sections
  const header = fmtHeader(input);

  let htmlSection = fmtHtml(workingHtml);
  let cssRulesSection = fmtCssRules(input.cssRules);
  let cssVariablesSection = fmtCssVariables(input.cssVariables);
  let animationsSection = fmtAnimations(input.animations);
  let interactionsSection = fmtInteractions(input);
  let fontsSection = fmtFonts(input.fonts);
  let componentTreeSection = fmtComponentTree(input.componentTree);
  let promptSection = fmtPrompt(input.prompt);

  // 4. Per-section hard caps
  if (cssRulesSection.length > SECTION_BUDGETS.cssRules.hardCap) {
    cssRulesSection = truncateFenced(cssRulesSection, SECTION_BUDGETS.cssRules.hardCap).text;
  }
  if (cssVariablesSection.length > SECTION_BUDGETS.cssVariables.hardCap) {
    cssVariablesSection = truncateFenced(cssVariablesSection, SECTION_BUDGETS.cssVariables.hardCap).text;
  }
  if (animationsSection.length > SECTION_BUDGETS.animations.hardCap) {
    animationsSection = truncateLines(animationsSection, SECTION_BUDGETS.animations.hardCap).text;
  }
  if (interactionsSection.length > SECTION_BUDGETS.interactions.hardCap) {
    interactionsSection = truncateLines(interactionsSection, SECTION_BUDGETS.interactions.hardCap).text;
  }
  if (fontsSection.length > SECTION_BUDGETS.fonts.hardCap) {
    fontsSection = truncateLines(fontsSection, SECTION_BUDGETS.fonts.hardCap).text;
  }
  if (componentTreeSection.length > SECTION_BUDGETS.componentTree.hardCap) {
    componentTreeSection = truncateLines(componentTreeSection, SECTION_BUDGETS.componentTree.hardCap).text;
  }

  const textOnlyParts = (): string[] => [
    header,
    htmlSection,
    cssRulesSection,
    cssVariablesSection,
    animationsSection,
    interactionsSection,
    fontsSection,
    componentTreeSection,
    promptSection,
  ];

  let textOnly = assembleParts(textOnlyParts());
  const initialOver = textOnly.length - HARD_CAP_BYTES;
  let truncated = false;
  let oversize = 0;

  if (initialOver > 0) {
    truncated = true;
    oversize = initialOver;

    // Reverse-priority drops.
    const dropSteps: Array<() => void> = [
      () => { promptSection = ''; },
      () => { componentTreeSection = ''; },
      () => { fontsSection = ''; },
      () => { interactionsSection = ''; },
      () => { animationsSection = ''; },
      () => { cssVariablesSection = ''; },
    ];
    for (const step of dropSteps) {
      step();
      textOnly = assembleParts(textOnlyParts());
      if (textOnly.length <= HARD_CAP_BYTES) break;
    }

    // Truncate cssRules harder if still over.
    if (textOnly.length > HARD_CAP_BYTES && cssRulesSection.length > 0) {
      const overflow = textOnly.length - HARD_CAP_BYTES;
      const target = Math.max(0, cssRulesSection.length - overflow - 32);
      cssRulesSection = truncateFenced(cssRulesSection, target).text;
      textOnly = assembleParts(textOnlyParts());
    }

    // Truncate HTML harder as last resort.
    if (textOnly.length > HARD_CAP_BYTES) {
      const overflow = textOnly.length - HARD_CAP_BYTES;
      const targetBytes = Math.max(2_000, workingHtml.length - overflow - 200);
      workingHtml = truncateHtml(workingHtml, targetBytes).html;
      htmlSection = fmtHtml(workingHtml);
      textOnly = assembleParts(textOnlyParts());
    }
  }

  // 5. Final assembly.
  return { text: assembleParts(textOnlyParts()), truncated, oversize };
}
