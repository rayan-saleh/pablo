import type { ComponentData, OutputFormat } from '../../shared/types';
import type { LLMMessage } from '../llm/types';

/**
 * Build the prompt for reconstructing a single component from its fiber data.
 */
export function buildReconstructionPrompt(
  component: ComponentData,
  childCode: Map<string, string>,
  format: OutputFormat,
): LLMMessage[] {
  const ext = format === 'tsx' ? 'tsx' : 'jsx';
  const typeAnnotation = format === 'tsx' ? ' with TypeScript type annotations for props' : '';

  // Build examples from instances (props → HTML pairs)
  const examples = component.instances
    .slice(0, 3) // Limit to 3 examples
    .map((inst, i) => {
      const propsStr = JSON.stringify(inst.props, null, 2);
      return `### Example ${i + 1}\nProps:\n\`\`\`json\n${propsStr}\n\`\`\`\nRendered HTML:\n\`\`\`html\n${inst.html}\n\`\`\``;
    })
    .join('\n\n');

  // List reconstructed child components
  const childImports = component.children
    .filter((name) => childCode.has(name))
    .map((name) => `- \`${name}\` (already reconstructed)`)
    .join('\n');

  const system = `You are a React component reconstruction expert. Given a component's minified source code, its props, and its rendered HTML output, reconstruct a clean, readable ${ext} component${typeAnnotation}.

Rules:
- Output ONLY the component code inside a single \`\`\`${ext} code fence. No explanations.
- Use modern React (function components, hooks).
- Match the visual output exactly — the rendered HTML must be equivalent.
- Use Tailwind CSS utility classes where appropriate instead of inline styles.
- If child components are listed as already reconstructed, import and use them instead of inlining their HTML.
- Preserve the component's display name as the export name.
- Make the component a named export.`;

  let user = `Reconstruct the \`${component.displayName}\` component.\n\n`;
  user += `## Minified Source\n\`\`\`javascript\n${component.sourceCode.slice(0, 3000)}\n\`\`\`\n\n`;
  user += `## Props → HTML Examples\n${examples}\n\n`;

  if (childImports) {
    user += `## Already Reconstructed Children\n${childImports}\n\n`;
  }

  user += `Output the reconstructed \`${component.displayName}\` component as clean ${ext}.`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

/**
 * Build a verification prompt: ask the LLM to compare generated code against original HTML.
 */
export function buildVerificationPrompt(
  name: string,
  code: string,
  originalHTML: string,
  props: Record<string, unknown>,
): LLMMessage[] {
  const system = `You are a React component verification expert. Compare a reconstructed component's code against the original rendered HTML and determine if they would produce equivalent visual output.

Respond with EXACTLY one of:
- "MATCH" if the code would produce visually equivalent HTML
- "MISMATCH" followed by a corrected version of the component inside a \`\`\`tsx code fence

Focus on structural and visual equivalence, not exact attribute matching.`;

  const user = `## Component: ${name}

## Reconstructed Code
\`\`\`tsx
${code}
\`\`\`

## Original HTML (what the component should render)
\`\`\`html
${originalHTML}
\`\`\`

## Props used
\`\`\`json
${JSON.stringify(props, null, 2)}
\`\`\`

Does the reconstructed code produce visually equivalent output?`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

/**
 * Build a fallback component that wraps the original HTML in dangerouslySetInnerHTML.
 */
export function buildFallbackComponent(
  name: string,
  html: string,
  format: OutputFormat,
): string {
  const escapedHtml = html.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  const propsType = format === 'tsx' ? ': React.HTMLAttributes<HTMLDivElement>' : '';

  return `import React from 'react';

export function ${name}(props${propsType}) {
  return (
    <div
      {...props}
      dangerouslySetInnerHTML={{ __html: \`${escapedHtml}\` }}
    />
  );
}
`;
}

/**
 * Extract code from a code fence in an LLM response.
 */
export function extractCodeFromResponse(response: string): string | null {
  const match = response.match(/```(?:tsx|jsx|typescript|javascript)?\s*\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}
