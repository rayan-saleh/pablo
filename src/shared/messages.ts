import type { InspectorMode, InspectorStatus, ExtractionMeta } from './types';

export const MSG = {
  ACTIVATE_INSPECTOR: 'ACTIVATE_INSPECTOR',
  DEACTIVATE_INSPECTOR: 'DEACTIVATE_INSPECTOR',
  EXTRACTION_COMPLETE: 'EXTRACTION_COMPLETE',
  STATUS_UPDATE: 'STATUS_UPDATE',
  DETECT_STACK: 'DETECT_STACK',
  PROBE_REACT: 'PROBE_REACT',
  COLLECT_FIBER: 'COLLECT_FIBER',
  COLLECT_GSAP: 'COLLECT_GSAP',
  COLLECT_MODULES: 'COLLECT_MODULES',
  COLLECT_DOM_MUTATIONS: 'COLLECT_DOM_MUTATIONS',
} as const;

export type ActivateInspectorMsg = {
  type: typeof MSG.ACTIVATE_INSPECTOR;
  mode: InspectorMode;
};

export type DeactivateInspectorMsg = {
  type: typeof MSG.DEACTIVATE_INSPECTOR;
};

export type ExtractionCompleteMsg = {
  type: typeof MSG.EXTRACTION_COMPLETE;
  meta: ExtractionMeta;
};

export type StatusUpdateMsg = {
  type: typeof MSG.STATUS_UPDATE;
  status: InspectorStatus;
  stack?: string;
};

export type DetectStackMsg = {
  type: typeof MSG.DETECT_STACK;
};

export type ProbeReactMsg = {
  type: typeof MSG.PROBE_REACT;
};

export type CollectFiberMsg = {
  type: typeof MSG.COLLECT_FIBER;
};

export type CollectGsapMsg = {
  type: typeof MSG.COLLECT_GSAP;
};

export type CollectModulesMsg = {
  type: typeof MSG.COLLECT_MODULES;
};

export type CollectDomMutationsMsg = {
  type: typeof MSG.COLLECT_DOM_MUTATIONS;
};

export type ExtensionMessage =
  | ActivateInspectorMsg
  | DeactivateInspectorMsg
  | ExtractionCompleteMsg
  | StatusUpdateMsg
  | DetectStackMsg
  | ProbeReactMsg
  | CollectFiberMsg
  | CollectGsapMsg
  | CollectModulesMsg
  | CollectDomMutationsMsg;
