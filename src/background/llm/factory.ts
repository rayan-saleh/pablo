import type { ExtensionSettings } from '../../shared/types';
import type { LLMClient } from './types';
import { AnthropicClient } from './anthropic';
import { OpenAIClient } from './openai';

export function createLLMClient(settings: ExtensionSettings): LLMClient {
  switch (settings.provider) {
    case 'anthropic':
      if (!settings.apiKey) throw new Error('Anthropic API key not configured');
      return new AnthropicClient(settings.apiKey);
    case 'openai':
      if (!settings.openaiApiKey) throw new Error('OpenAI API key not configured');
      return new OpenAIClient(settings.openaiApiKey);
    default:
      throw new Error(`Unknown provider: ${settings.provider}`);
  }
}
