import type { InspectorMode, InspectorStatus, ExtractionMeta } from './types';

export const MSG = {
  ACTIVATE_INSPECTOR: 'ACTIVATE_INSPECTOR',
  DEACTIVATE_INSPECTOR: 'DEACTIVATE_INSPECTOR',
  EXTRACTION_COMPLETE: 'EXTRACTION_COMPLETE',
  STATUS_UPDATE: 'STATUS_UPDATE',
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

export type ExtensionMessage =
  | ActivateInspectorMsg
  | DeactivateInspectorMsg
  | ExtractionCompleteMsg
  | StatusUpdateMsg;
