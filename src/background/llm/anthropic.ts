import type { LLMClient, LLMMessage } from './types';

const MODEL = 'claude-sonnet-4-5-20250929';
const API_URL = 'https://api.anthropic.com/v1/messages';

export class AnthropicClient implements LLMClient {
  constructor(private apiKey: string) {}

  async chat(messages: LLMMessage[]): Promise<string> {
    console.log('[CC] Anthropic API call, model:', MODEL, 'messages:', messages.length);
    // Anthropic API uses a separate system parameter
    const systemMsg = messages.find((m) => m.role === 'system');
    const nonSystemMsgs = messages.filter((m) => m.role !== 'system');

    const body: Record<string, unknown> = {
      model: MODEL,
      max_tokens: 4096,
      messages: nonSystemMsgs.map((m) => ({ role: m.role, content: m.content })),
    };

    if (systemMsg) {
      body.system = systemMsg.content;
    }

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const textBlock = data.content?.find((b: any) => b.type === 'text');
    const result = textBlock?.text ?? '';
    console.log('[CC] Anthropic response received, length:', result.length);
    return result;
  }
}
