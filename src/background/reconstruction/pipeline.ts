import type {
  ExtensionSettings,
  ReconstructionPayload,
  ReconstructionProgress,
  ReconstructionResult,
  ReconstructedComponent,
} from '../../shared/types';
import type { LLMClient } from '../llm/types';
import { createLLMClient } from '../llm/factory';
import {
  buildReconstructionPrompt,
  buildVerificationPrompt,
  buildFallbackComponent,
  extractCodeFromResponse,
} from './prompts';

type ProgressCallback = (progress: ReconstructionProgress) => void;

/**
 * Main orchestrator: reconstruct all components via LLM in topological order.
 */
export async function runReconstructionPipeline(
  payload: ReconstructionPayload,
  settings: ExtensionSettings,
  onProgress: ProgressCallback,
): Promise<ReconstructionResult> {
  const client = createLLMClient(settings);
  const components = payload.components;
  const total = components.length;
  console.log('[CC] Pipeline start, total components:', total);
  const reconstructed: ReconstructedComponent[] = [];
  const codeMap = new Map<string, string>();

  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    const name = component.displayName;

    onProgress({
      current: i + 1,
      total,
      componentName: name,
      phase: 'reconstructing',
    });

    console.log('[CC] Reconstructing component:', name, `(${i + 1}/${total})`);
    let code: string | null = null;
    let isFallback = false;

    try {
      // Step 1: Reconstruct
      code = await reconstructComponent(client, component, codeMap, settings);

      // Step 2: Verify (with retries)
      if (code && component.instances[0]) {
        const verified = await verifyWithRetries(
          client,
          name,
          code,
          component.instances[0].html,
          component.instances[0].props,
          settings.maxRetries,
          onProgress,
          i + 1,
          total,
        );
        if (verified) {
          code = verified;
        }
      }
    } catch (err) {
      console.warn(`[Component Copier] Reconstruction failed for ${name}:`, err);
    }

    // Fallback if reconstruction failed
    if (!code) {
      const html = component.instances[0]?.html ?? '<div />';
      code = buildFallbackComponent(name, html, settings.format);
      isFallback = true;
    }

    codeMap.set(name, code);
    reconstructed.push({ name, code, fallback: isFallback });
  }

  onProgress({
    current: total,
    total,
    componentName: payload.rootComponentName,
    phase: 'done',
  });

  console.log('[CC] Pipeline complete, assembled', reconstructed.length, 'components');
  // Assemble final output
  const finalCode = assembleOutput(reconstructed, payload.rootComponentName);

  return {
    success: true,
    code: finalCode,
    components: reconstructed,
  };
}

async function reconstructComponent(
  client: LLMClient,
  component: import('../../shared/types').ComponentData,
  codeMap: Map<string, string>,
  settings: ExtensionSettings,
): Promise<string | null> {
  const messages = buildReconstructionPrompt(component, codeMap, settings.format);
  const response = await client.chat(messages);
  return extractCodeFromResponse(response);
}

async function verifyWithRetries(
  client: LLMClient,
  name: string,
  code: string,
  originalHTML: string,
  props: Record<string, unknown>,
  maxRetries: number,
  onProgress: ProgressCallback,
  current: number,
  total: number,
): Promise<string | null> {
  let currentCode = code;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    onProgress({
      current,
      total,
      componentName: name,
      phase: 'verifying',
    });

    const messages = buildVerificationPrompt(name, currentCode, originalHTML, props);
    const response = await client.chat(messages);

    if (response.trim().startsWith('MATCH')) {
      console.log('[CC] Verification passed for', name);
      return currentCode;
    }

    console.log('[CC] Verification mismatch for', name, '— retrying');
    // MISMATCH — try to extract corrected code
    const corrected = extractCodeFromResponse(response);
    if (corrected) {
      currentCode = corrected;
    } else {
      // Couldn't extract corrected code, return what we have
      return currentCode;
    }
  }

  return currentCode;
}

function assembleOutput(
  components: ReconstructedComponent[],
  rootName: string,
): string {
  const lines: string[] = [
    '// Reconstructed by Component Copier',
    "import React from 'react';",
    '',
  ];

  // Add all components (children first, then parents — they're already in topological order)
  for (const comp of components) {
    // Strip any import lines from individual components to avoid duplicates
    const codeWithoutImports = comp.code
      .split('\n')
      .filter((line) => !line.match(/^import\s+/))
      .join('\n')
      .trim();

    lines.push(`// --- ${comp.name} ${comp.fallback ? '(fallback)' : ''} ---`);
    lines.push(codeWithoutImports);
    lines.push('');
  }

  // Default export the root component
  lines.push(`export default ${rootName};`);
  lines.push('');

  return lines.join('\n');
}
