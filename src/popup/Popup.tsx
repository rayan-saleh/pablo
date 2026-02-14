import React, { useState, useEffect } from 'react';
import type { InspectorMode, InspectorStatus, TechStack } from '../shared/types';
import { STACK_DISPLAY_NAMES } from '../shared/types';
import { MSG, type ExtensionMessage } from '../shared/messages';
import { ModeToggle } from './components/ModeToggle';

export function Popup() {
  const [mode, setMode] = useState<InspectorMode>('component');
  const [status, setStatus] = useState<InspectorStatus>('ready');
  const [stack, setStack] = useState<TechStack | null>(null);
  const [lastCopy, setLastCopy] = useState<{ tag: string; size: number } | null>(null);

  useEffect(() => {
    // Detect tech stack immediately on popup open
    chrome.runtime.sendMessage({ type: MSG.DETECT_STACK }, (response) => {
      void chrome.runtime.lastError;
      if (response?.stack) {
        setStack(response.stack as TechStack);
      }
    });

    const listener = (message: ExtensionMessage) => {
      console.log('[Pablo] Popup received message:', message.type);
      if (message.type === MSG.STATUS_UPDATE) {
        setStatus(message.status);
        if (message.stack) setStack(message.stack as TechStack);
      } else if (message.type === MSG.EXTRACTION_COMPLETE) {
        setStatus('copied');
        setLastCopy({ tag: message.meta.tag, size: message.meta.size });
        setStack(message.meta.stack as TechStack);
        setTimeout(() => setStatus('inspecting'), 2000);
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
    console.log('[Pablo] User action: start, mode:', mode);
    sendToActiveTab({ type: MSG.ACTIVATE_INSPECTOR, mode });
    setStatus('inspecting');
    window.close();
  }

  function handleStop() {
    console.log('[Pablo] User action: stop');
    sendToActiveTab({ type: MSG.DEACTIVATE_INSPECTOR });
    setStatus('ready');
  }

  const isInspecting = status === 'inspecting';

  const statusConfig: Record<InspectorStatus, { text: string; color: string }> = {
    ready: { text: 'Ready', color: 'bg-gray-200 text-gray-700' },
    inspecting: { text: 'Inspector active', color: 'bg-blue-100 text-blue-700' },
    copied: { text: 'Copied!', color: 'bg-green-100 text-green-700' },
    error: { text: 'Error', color: 'bg-red-100 text-red-700' },
  };

  const { text: statusText, color: statusColor } = statusConfig[status];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-900">Pablo</h1>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
          {statusText}
        </span>
      </div>

      {stack && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Detected:</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-700">
            {STACK_DISPLAY_NAMES[stack]}
          </span>
        </div>
      )}

      <ModeToggle mode={mode} onChange={setMode} disabled={isInspecting} />

      <p className="text-xs text-gray-500">
        {mode === 'component'
          ? 'Hover over elements to highlight them. Click to copy. Use arrow keys to navigate.'
          : 'Captures the full visible page content.'}
      </p>

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
