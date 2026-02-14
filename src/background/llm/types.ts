export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMClient {
  chat(messages: LLMMessage[]): Promise<string>;
}
