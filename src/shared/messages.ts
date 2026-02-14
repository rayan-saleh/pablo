import type { InspectorMode, InspectorStatus, ExtractionMeta, ReconstructionPayload, ReconstructionProgress, ReconstructionResult, ExtensionSettings } from './types';

export const MSG = {
  ACTIVATE_INSPECTOR: 'ACTIVATE_INSPECTOR',
  DEACTIVATE_INSPECTOR: 'DEACTIVATE_INSPECTOR',
  EXTRACTION_COMPLETE: 'EXTRACTION_COMPLETE',
  STATUS_UPDATE: 'STATUS_UPDATE',
  RECONSTRUCTION_START: 'RECONSTRUCTION_START',
  RECONSTRUCTION_PROGRESS: 'RECONSTRUCTION_PROGRESS',
  RECONSTRUCTION_COMPLETE: 'RECONSTRUCTION_COMPLETE',
  RECONSTRUCTION_ERROR: 'RECONSTRUCTION_ERROR',
  DETECT_STACK: 'DETECT_STACK',
  GET_SETTINGS: 'GET_SETTINGS',
  SAVE_SETTINGS: 'SAVE_SETTINGS',
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

export type ReconstructionStartMsg = {
  type: typeof MSG.RECONSTRUCTION_START;
  payload: ReconstructionPayload;
};

export type ReconstructionProgressMsg = {
  type: typeof MSG.RECONSTRUCTION_PROGRESS;
  progress: ReconstructionProgress;
};

export type ReconstructionCompleteMsg = {
  type: typeof MSG.RECONSTRUCTION_COMPLETE;
  result: ReconstructionResult;
};

export type ReconstructionErrorMsg = {
  type: typeof MSG.RECONSTRUCTION_ERROR;
  error: string;
};

export type DetectStackMsg = {
  type: typeof MSG.DETECT_STACK;
};

export type GetSettingsMsg = {
  type: typeof MSG.GET_SETTINGS;
};

export type SaveSettingsMsg = {
  type: typeof MSG.SAVE_SETTINGS;
  settings: ExtensionSettings;
};

export type ExtensionMessage =
  | ActivateInspectorMsg
  | DeactivateInspectorMsg
  | ExtractionCompleteMsg
  | StatusUpdateMsg
  | DetectStackMsg
  | ReconstructionStartMsg
  | ReconstructionProgressMsg
  | ReconstructionCompleteMsg
  | ReconstructionErrorMsg
  | GetSettingsMsg
  | SaveSettingsMsg;
