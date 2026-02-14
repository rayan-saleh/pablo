export type TechStack =
  | 'shopify' | 'wordpress' | 'webflow' | 'framer'
  | 'wix' | 'squarespace'
  | 'nextjs' | 'gatsby' | 'remix' | 'nuxt' | 'sveltekit' | 'astro'
  | 'react' | 'vue' | 'angular' | 'svelte' | 'solid'
  | 'generic';

export type StrategyKey = 'shopify' | 'wordpress' | 'webflow' | 'framer' | 'react' | 'generic';

export const STACK_DISPLAY_NAMES: Record<TechStack, string> = {
  shopify: 'Shopify',
  wordpress: 'WordPress',
  webflow: 'Webflow',
  framer: 'Framer',
  wix: 'Wix',
  squarespace: 'Squarespace',
  nextjs: 'Next.js',
  gatsby: 'Gatsby',
  remix: 'Remix',
  nuxt: 'Nuxt',
  sveltekit: 'SvelteKit',
  astro: 'Astro',
  react: 'React',
  vue: 'Vue',
  angular: 'Angular',
  svelte: 'Svelte',
  solid: 'Solid',
  generic: 'Generic',
};

export const REACT_BASED_STACKS = new Set<TechStack>(['react', 'nextjs', 'gatsby', 'remix']);

export type InspectorMode = 'component' | 'page';

export type InspectorStatus = 'ready' | 'inspecting' | 'copied' | 'error';

export interface ExtractionMeta {
  tag: string;
  stack: TechStack;
  size: number;
}

export interface Strategy {
  expandSelection(el: Element): Element;
  cleanup(clone: Element): void;
  extractAnimations?(el: Element): Partial<AnimationData>;
  getFrameworkDefaults?(): Map<string, string>;
}

// --- Animation Types ---

export interface CSSAnimationData {
  name: string;
  duration: string;
  timingFunction: string;
  delay: string;
  iterationCount: string;
  direction: string;
  fillMode: string;
  playState: string;
}

export interface CSSTransitionData {
  property: string;
  duration: string;
  timingFunction: string;
  delay: string;
}

export interface KeyframeDefinition {
  name: string;
  keyframes: { offset: string; properties: Record<string, string> }[];
}

export type PseudoState = 'hover' | 'active' | 'focus' | 'focus-within' | 'focus-visible';

export type PseudoStateStyles = Partial<Record<PseudoState, Record<string, string>>>;

export interface ActiveAnimationData {
  animationName: string;
  playState: string;
  timing: {
    duration: number;
    delay: number;
    easing: string;
    iterations: number;
    direction: string;
    fill: string;
  };
  keyframes: { offset: number; properties: Record<string, string> }[];
}

export interface ScrollTriggerData {
  type: string;
  description: string;
}

export interface FramerMotionData {
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
}

export interface WebflowIX2Interaction {
  trigger: string;
  animation: Record<string, unknown>;
}

export interface WebflowIX2Data {
  elementId: string;
  interactions: WebflowIX2Interaction[];
}

export interface GsapScrollTriggerInfo {
  triggerSelector: string;
  scroller?: string;
  start?: string;
  end?: string;
  pin?: boolean;
  scrub?: boolean | number;
  description?: string;
}

export interface GsapTweenInfo {
  targetSelector: string;
  type: string;
  properties: Record<string, unknown>;
  duration?: number;
  delay?: number;
  ease?: string;
}

export interface GsapRecordedTweenInfo {
  type: string;
  target: string;
  properties: Record<string, unknown>;
  fromProperties?: Record<string, unknown>;
  duration?: number;
  delay?: number;
  ease?: string;
  stagger?: unknown;
  timelinePosition?: string | number;
}

export interface GsapData {
  detected: boolean;
  version?: string;
  scrollTriggers: GsapScrollTriggerInfo[];
  tweens: GsapTweenInfo[];
  recordedTweens?: GsapRecordedTweenInfo[];
}

export interface AnimationData {
  cssAnimations: CSSAnimationData[];
  cssTransitions: CSSTransitionData[];
  keyframeDefinitions: KeyframeDefinition[];
  stateStyles: PseudoStateStyles;
  activeAnimations: ActiveAnimationData[];
  scrollTriggers: ScrollTriggerData[];
  framerMotion: FramerMotionData[];
  webflowIX2: WebflowIX2Data[];
  gsap?: GsapData;
  summary: string;
}

// --- Fiber / Component Tree Types ---

export interface FiberInstanceData {
  props: Record<string, unknown>;
}

export interface ComponentData {
  displayName: string;
  sourceCode: string;
  instances: FiberInstanceData[];
  children: string[];
}

export interface ComponentTree {
  name: string;
  sourceCode: string;
  instances: FiberInstanceData[];
  children: ComponentTree[];
}

// --- Semantic & Interaction Types ---

export interface SemanticHint {
  selector: string;
  role: string;
  reason: string;
}

export interface InteractionPattern {
  type: string;
  description: string;
  elements: string[];
}

// --- Clipboard Payload ---

export interface ClipboardPayload {
  source: {
    url: string;
    title: string;
    timestamp: string;
    viewport: { width: number; height: number };
  };
  detection: {
    framework: TechStack;
    strategy: StrategyKey;
  };
  component: {
    selector: string;
    tag: string;
    tree?: ComponentTree;
    html: string;
    animations?: AnimationData;
    semanticHints?: SemanticHint[];
    interactionPatterns?: InteractionPattern[];
    summary?: string;
  };
}
