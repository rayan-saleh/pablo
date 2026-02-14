import React, { useState, useEffect } from 'react';
import type { ExtensionSettings, LLMProvider, OutputFormat } from '../shared/types';
import { getSettings, saveSettings } from '../shared/settings';

export function Options() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  if (!settings) return null;

  function update(patch: Partial<ExtensionSettings>) {
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
    setSaved(false);
  }

  async function handleSave() {
    if (!settings) return;
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-lg mx-auto py-10 px-4 space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Component Copier Settings</h1>

      {/* Provider */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-700">LLM Provider</legend>
        <div className="flex gap-4">
          {(['anthropic', 'openai'] as LLMProvider[]).map((p) => (
            <label key={p} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="provider"
                value={p}
                checked={settings.provider === p}
                onChange={() => update({ provider: p })}
                className="accent-blue-500"
              />
              <span className="text-sm capitalize">{p}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Anthropic API Key */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Anthropic API Key</label>
        <div className="flex gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={settings.apiKey}
            onChange={(e) => update({ apiKey: e.target.value })}
            placeholder="sk-ant-..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {/* OpenAI API Key */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">OpenAI API Key</label>
        <div className="flex gap-2">
          <input
            type={showOpenaiKey ? 'text' : 'password'}
            value={settings.openaiApiKey}
            onChange={(e) => update({ openaiApiKey: e.target.value })}
            placeholder="sk-..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowOpenaiKey(!showOpenaiKey)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {showOpenaiKey ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {/* Output Format */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-700">Output Format</legend>
        <div className="flex gap-4">
          {(['jsx', 'tsx'] as OutputFormat[]).map((f) => (
            <label key={f} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value={f}
                checked={settings.format === f}
                onChange={() => update({ format: f })}
                className="accent-blue-500"
              />
              <span className="text-sm uppercase">{f}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Max Retries */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Max Verification Retries: {settings.maxRetries}
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={settings.maxRetries}
          onChange={(e) => update({ maxRetries: Number(e.target.value) })}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>1</span>
          <span>5</span>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
