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

// --- Clipboard Payload ---

export interface ClipboardPayload {
  source: {
    url: string;
    title: string;
    timestamp: string;
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
  };
}
