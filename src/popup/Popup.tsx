import React, { useState, useEffect } from 'react';
import type { InspectorMode, InspectorStatus, TechStack, ReconstructionProgress } from '../shared/types';
import { STACK_DISPLAY_NAMES, REACT_BASED_STACKS } from '../shared/types';
import { MSG, type ExtensionMessage } from '../shared/messages';
import { ModeToggle } from './components/ModeToggle';

export function Popup() {
  const [mode, setMode] = useState<InspectorMode>('component');
  const [status, setStatus] = useState<InspectorStatus>('ready');
  const [stack, setStack] = useState<TechStack | null>(null);
  const [lastCopy, setLastCopy] = useState<{ tag: string; size: number } | null>(null);
  const [progress, setProgress] = useState<ReconstructionProgress | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    // Detect tech stack immediately on popup open
    chrome.runtime.sendMessage({ type: MSG.DETECT_STACK }, (response) => {
      void chrome.runtime.lastError; // suppress if content script unavailable
      if (response?.stack) {
        setStack(response.stack as TechStack);
      }
    });

    // Check if API key is configured
    chrome.runtime.sendMessage({ type: MSG.GET_SETTINGS }, (response) => {
      if (response?.settings) {
        const s = response.settings;
        const key = s.provider === 'anthropic' ? s.apiKey : s.openaiApiKey;
        setHasApiKey(!!key);
      }
    });

    const listener = (message: ExtensionMessage) => {
      console.log('[CC] Popup received message:', message.type);
      if (message.type === MSG.STATUS_UPDATE) {
        setStatus(message.status);
        if (message.stack) setStack(message.stack as TechStack);
        if (message.status !== 'reconstructing') setProgress(null);
      } else if (message.type === MSG.EXTRACTION_COMPLETE) {
        setStatus('copied');
        setLastCopy({ tag: message.meta.tag, size: message.meta.size });
        setStack(message.meta.stack as TechStack);
        setProgress(null);
        setTimeout(() => setStatus('inspecting'), 2000);
      } else if (message.type === MSG.RECONSTRUCTION_PROGRESS) {
        setProgress(message.progress);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  async function sendToActiveTab(msg: ExtensionMessage) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, msg);
    }
  }

  function handleStart() {
    console.log('[CC] User action: start, mode:', mode);
    sendToActiveTab({ type: MSG.ACTIVATE_INSPECTOR, mode });
    setStatus('inspecting');
    window.close();
  }

  function handleStop() {
    console.log('[CC] User action: stop');
    sendToActiveTab({ type: MSG.DEACTIVATE_INSPECTOR });
    setStatus('ready');
  }

  function openSettings() {
    chrome.runtime.openOptionsPage();
  }

  const isInspecting = status === 'inspecting' || status === 'reconstructing';

  const statusConfig: Record<InspectorStatus, { text: string; color: string }> = {
    ready: { text: 'Ready', color: 'bg-gray-200 text-gray-700' },
    inspecting: { text: 'Inspector active', color: 'bg-blue-100 text-blue-700' },
    copied: { text: 'Copied!', color: 'bg-green-100 text-green-700' },
    error: { text: 'Error', color: 'bg-red-100 text-red-700' },
    reconstructing: { text: 'Reconstructing...', color: 'bg-amber-100 text-amber-700' },
  };

  const { text: statusText, color: statusColor } = statusConfig[status];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-900">Component Copier</h1>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
            {statusText}
          </span>
          <button
            onClick={openSettings}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {stack && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Detected:</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-700">
            {STACK_DISPLAY_NAMES[stack]}
          </span>
        </div>
      )}

      {/* API key warning for React-based sites */}
      {stack && REACT_BASED_STACKS.has(stack) && hasApiKey === false && (
        <div className="text-xs p-2 rounded bg-amber-50 text-amber-700 border border-amber-200">
          No API key configured. React components will be copied as HTML.{' '}
          <button onClick={openSettings} className="underline font-medium">
            Add API key
          </button>
        </div>
      )}

      <ModeToggle mode={mode} onChange={setMode} disabled={isInspecting} />

      <p className="text-xs text-gray-500">
        {mode === 'component'
          ? 'Hover over elements to highlight them. Click to copy. Use arrow keys to navigate.'
          : 'Captures the full visible page content.'}
      </p>

      {/* Reconstruction progress */}
      {status === 'reconstructing' && progress && (
        <div className="text-xs text-amber-700 space-y-1">
          <div className="font-medium">{progress.componentName}</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <span>{progress.current}/{progress.total}</span>
          </div>
          <div className="text-amber-500 capitalize">{progress.phase}</div>
        </div>
      )}

      {lastCopy && status === 'copied' && (
        <div className="text-xs text-gray-500">
          Copied &lt;{lastCopy.tag}&gt; — {(lastCopy.size / 1024).toFixed(1)} KB
        </div>
      )}

      {isInspecting ? (
        <button
          onClick={handleStop}
          className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          Stop Inspecting
        </button>
      ) : (
        <button
          onClick={handleStart}
          className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          Start Inspecting
        </button>
      )}
    </div>
  );
}
