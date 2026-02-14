import type { ExtensionSettings } from './types';

const DEFAULTS: ExtensionSettings = {
  provider: 'anthropic',
  apiKey: '',
  openaiApiKey: '',
  format: 'tsx',
  maxRetries: 2,
};

export async function getSettings(): Promise<ExtensionSettings> {
  const stored = await chrome.storage.local.get('settings');
  return { ...DEFAULTS, ...stored.settings };
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.local.set({ settings });
}
