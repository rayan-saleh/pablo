import type { CaptureContextLevel } from './types';

export const DEFAULT_CAPTURE_CONTEXT: CaptureContextLevel = 'basic';

export interface CapturePlan {
  includeGsap: boolean;
  includeLlmBundle: boolean;
  includeMutationRecording: boolean;
  includeReactTree: boolean;
  runPostReloadAnimationCapture: boolean;
}

const PLAN_BY_CONTEXT: Record<CaptureContextLevel, CapturePlan> = {
  basic: {
    includeGsap: true,
    includeLlmBundle: true,
    includeMutationRecording: false,
    includeReactTree: true,
    runPostReloadAnimationCapture: false,
  },
  deep: {
    includeGsap: true,
    includeLlmBundle: true,
    includeMutationRecording: true,
    includeReactTree: true,
    runPostReloadAnimationCapture: true,
  },
};

export function getCapturePlan(level: CaptureContextLevel): CapturePlan {
  return PLAN_BY_CONTEXT[level];
}

