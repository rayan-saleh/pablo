import React, { useState, useEffect } from 'react';
import type { InspectorMode, InspectorStatus, TechStack, CaptureContextLevel } from '../shared/types';
import { STACK_DISPLAY_NAMES } from '../shared/types';
import { MSG, type ExtensionMessage } from '../shared/messages';
import { ModeToggle } from './components/ModeToggle';

const CAPTURE_CONTEXT_STORAGE_KEY = 'captureContextLevel';
const CAPTURE_LEVELS: CaptureContextLevel[] = ['minimal', 'medium', 'max'];

export function Popup() {
  const [mode, setMode] = useState<InspectorMode>('component');
  const [status, setStatus] = useState<InspectorStatus>('ready');
  const [stack, setStack] = useState<TechStack | null>(null);
  const [lastCopy, setLastCopy] = useState<{ tag: string; size: number } | null>(null);
  const [captureContext, setCaptureContext] = useState<CaptureContextLevel>('medium');

  useEffect(() => {
    chrome.storage.local.get(CAPTURE_CONTEXT_STORAGE_KEY, (result) => {
      void chrome.runtime.lastError;
      const saved = result?.[CAPTURE_CONTEXT_STORAGE_KEY];
      if (saved === 'minimal' || saved === 'medium' || saved === 'max') {
        setCaptureContext(saved);
      }
    });

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
    console.log('[Pablo] User action: start, mode:', mode, 'captureContext:', captureContext);
    sendToActiveTab({ type: MSG.ACTIVATE_INSPECTOR, mode, captureContext });
    setStatus('inspecting');
    window.close();
  }

  function handleStop() {
    console.log('[Pablo] User action: stop');
    sendToActiveTab({ type: MSG.DEACTIVATE_INSPECTOR });
    setStatus('ready');
  }

  const isInspecting = status === 'inspecting';
  const captureLevelIndex = CAPTURE_LEVELS.indexOf(captureContext);

  function handleCaptureLevelChange(nextIndex: number): void {
    const bounded = Math.min(CAPTURE_LEVELS.length - 1, Math.max(0, nextIndex));
    const nextLevel = CAPTURE_LEVELS[bounded];
    setCaptureContext(nextLevel);
    chrome.storage.local.set({ [CAPTURE_CONTEXT_STORAGE_KEY]: nextLevel }, () => {
      void chrome.runtime.lastError;
    });
  }

  const statusConfig: Record<InspectorStatus, { text: string; color: string }> = {
    ready: { text: 'Ready', color: 'bg-gray-200 text-gray-700' },
    inspecting: { text: 'Inspector active', color: 'bg-blue-100 text-blue-700' },
    copied: { text: 'Copied!', color: 'bg-green-100 text-green-700' },
    error: { text: 'Error', color: 'bg-red-100 text-red-700' },
  };

  const { text: statusText, color: statusColor } = statusConfig[status];

  return (
    <div className="p-4 space-y-4" style={{ minWidth: 320 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={chrome.runtime.getURL('icons/logo.svg')} alt="Pablo" className="w-6 h-6" />
          <h1 className="text-base font-semibold text-gray-900">Pablo</h1>
        </div>
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Capture context</span>
          <span className="text-xs font-medium text-gray-700 capitalize">{captureContext}</span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={captureLevelIndex}
          onChange={(e) => handleCaptureLevelChange(Number(e.target.value))}
          disabled={isInspecting}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>Minimal</span>
          <span>Medium</span>
          <span>Max</span>
        </div>
      </div>

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

      <div className="pt-2 border-t border-gray-100 text-center">
        <span className="text-[10px] text-gray-400">
          v{chrome.runtime.getManifest().version}
        </span>
      </div>
    </div>
  );
}
