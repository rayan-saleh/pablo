import type { LLMClient, LLMMessage } from './types';

const MODEL = 'gpt-4o';
const API_URL = 'https://api.openai.com/v1/chat/completions';

export class OpenAIClient implements LLMClient {
  constructor(private apiKey: string) {}

  async chat(messages: LLMMessage[]): Promise<string> {
    console.log('[CC] OpenAI API call, model:', MODEL, 'messages:', messages.length);
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const result = data.choices?.[0]?.message?.content ?? '';
    console.log('[CC] OpenAI response received, length:', result.length);
    return result;
  }
}
