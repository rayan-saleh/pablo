import type { InspectorMode, InspectorStatus, ExtractionMeta, ElementFingerprint, ClipboardPayload } from './types';

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
  START_ANIMATION_CAPTURE: 'START_ANIMATION_CAPTURE',
  CONTENT_SCRIPT_READY: 'CONTENT_SCRIPT_READY',
  CONTINUE_CAPTURE: 'CONTINUE_CAPTURE',
  CAPTURE_PHASE_UPDATE: 'CAPTURE_PHASE_UPDATE',
  COLLECT_ENTRANCE_ANIMATIONS: 'COLLECT_ENTRANCE_ANIMATIONS',
  COLLECT_INTERSECTION_DATA: 'COLLECT_INTERSECTION_DATA',
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

export type StartAnimationCaptureMsg = {
  type: typeof MSG.START_ANIMATION_CAPTURE;
  fingerprint: ElementFingerprint;
  immediatePayload: ClipboardPayload;
  url: string;
};

export type ContentScriptReadyMsg = {
  type: typeof MSG.CONTENT_SCRIPT_READY;
};

export type ContinueCaptureMsg = {
  type: typeof MSG.CONTINUE_CAPTURE;
  fingerprint: ElementFingerprint;
  immediatePayload: ClipboardPayload;
};

export type CapturePhaseUpdateMsg = {
  type: typeof MSG.CAPTURE_PHASE_UPDATE;
  phase: string;
};

export type CollectEntranceAnimationsMsg = {
  type: typeof MSG.COLLECT_ENTRANCE_ANIMATIONS;
};

export type CollectIntersectionDataMsg = {
  type: typeof MSG.COLLECT_INTERSECTION_DATA;
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
  | CollectDomMutationsMsg
  | StartAnimationCaptureMsg
  | ContentScriptReadyMsg
  | ContinueCaptureMsg
  | CapturePhaseUpdateMsg
  | CollectEntranceAnimationsMsg
  | CollectIntersectionDataMsg;
