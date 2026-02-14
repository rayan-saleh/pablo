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

export type InspectorStatus = 'ready' | 'inspecting' | 'copied' | 'error' | 'reconstructing';

export interface ExtractionMeta {
  tag: string;
  stack: TechStack;
  size: number;
}

export interface Strategy {
  expandSelection(el: Element): Element;
  cleanup(clone: Element): void;
}

// --- LLM Reconstruction Types ---

export type LLMProvider = 'anthropic' | 'openai';

export type OutputFormat = 'jsx' | 'tsx';

export interface ExtensionSettings {
  provider: LLMProvider;
  apiKey: string;
  openaiApiKey: string;
  format: OutputFormat;
  maxRetries: number;
}

export interface ReconstructionProgress {
  current: number;
  total: number;
  componentName: string;
  phase: 'reconstructing' | 'verifying' | 'done' | 'error';
}

export interface FiberInstanceData {
  props: Record<string, unknown>;
  html: string;
}

export interface ComponentData {
  displayName: string;
  sourceCode: string;
  instances: FiberInstanceData[];
  children: string[]; // display names of child component types
}

export interface ReconstructionPayload {
  components: ComponentData[];
  rootComponentName: string;
}

export interface ReconstructedComponent {
  name: string;
  code: string;
  fallback: boolean;
}

export interface ReconstructionResult {
  success: boolean;
  code: string;
  components: ReconstructedComponent[];
  error?: string;
}
