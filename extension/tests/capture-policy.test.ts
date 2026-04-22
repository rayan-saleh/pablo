import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_CAPTURE_CONTEXT, getCapturePlan } from '../src/shared/capture-policy.ts';

test('basic is the default capture context', () => {
  assert.equal(DEFAULT_CAPTURE_CONTEXT, 'basic');
});

test('basic capture enables rich snapshot data without post-reload capture', () => {
  assert.deepEqual(getCapturePlan('basic'), {
    includeGsap: true,
    includeLlmBundle: true,
    includeMutationRecording: false,
    includeReactTree: true,
    runPostReloadAnimationCapture: false,
  });
});

test('deep capture is the only mode that enables post-reload animation capture', () => {
  assert.deepEqual(getCapturePlan('deep'), {
    includeGsap: true,
    includeLlmBundle: true,
    includeMutationRecording: true,
    includeReactTree: true,
    runPostReloadAnimationCapture: true,
  });
});
