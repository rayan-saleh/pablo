export type TechStack = 'shopify' | 'wordpress' | 'webflow' | 'framer' | 'react' | 'generic';

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
