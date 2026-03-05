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
    ready: { text: '$ ready', color: 'border border-pablo-border bg-white/[0.03] text-pablo-muted' },
    inspecting: { text: '$ inspecting...', color: 'border border-pablo-primary/30 bg-pablo-primary/10 text-pablo-primary' },
    copied: { text: '$ copied!', color: 'border border-[#28c840]/30 bg-[#28c840]/10 text-[#28c840]' },
    error: { text: '$ error', color: 'border border-pablo-error/30 bg-pablo-error/10 text-pablo-error' },
  };

  const { text: statusText, color: statusColor } = statusConfig[status];

  return (
    <div className="p-4 space-y-3.5 bg-pablo-bg font-mono" style={{ minWidth: 320 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={chrome.runtime.getURL('icons/logo.svg')}
            alt="Pablo"
            className="w-5 h-5"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <h1 className="text-sm font-semibold tracking-tight text-pablo-text lowercase">pablo</h1>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${statusColor}`}>
          {statusText}
        </span>
      </div>

      <div className="dashed-separator" />

      {/* Tech stack */}
      {stack && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-pablo-dim">detected:</span>
          <span className="text-[10px] font-medium px-2 py-0.5 border border-dashed border-pablo-accent/30 bg-pablo-accent/10 text-pablo-accent rounded-sm">
            {STACK_DISPLAY_NAMES[stack]}
          </span>
        </div>
      )}

      {/* Mode toggle */}
      <ModeToggle mode={mode} onChange={setMode} disabled={isInspecting} />

      {/* Capture context slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-pablo-muted">capture context</span>
          <span className="text-[11px] font-medium text-pablo-primary capitalize">{captureContext}</span>
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
        <div className="flex justify-between text-[9px] text-pablo-dim">
          <span>minimal</span>
          <span>medium</span>
          <span>max</span>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-[11px] leading-relaxed text-pablo-dim">
        {mode === 'component'
          ? 'hover over elements to highlight them. click to copy. use arrow keys to navigate.'
          : 'captures the full visible page content.'}
      </p>

      {/* Copy feedback */}
      {lastCopy && status === 'copied' && (
        <div className="text-[11px] text-[#28c840] animate-fade-in">
          <span className="text-pablo-dim">$</span> copied &lt;{lastCopy.tag}&gt; — {(lastCopy.size / 1024).toFixed(1)} KB
        </div>
      )}

      {/* Action button */}
      {isInspecting ? (
        <button
          onClick={handleStop}
          className="w-full py-2.5 px-4 text-xs font-medium border border-pablo-error/40 bg-pablo-error/10 text-pablo-error hover:bg-pablo-error/20 hover:border-pablo-error/60 transition-all duration-150"
        >
          $ stop inspecting
        </button>
      ) : (
        <button
          onClick={handleStart}
          className="w-full py-2.5 px-4 text-xs font-medium border border-pablo-border text-pablo-text hover:shadow-glow-primary hover:border-pablo-border-hover transition-all duration-200"
          style={{
            backgroundImage: 'radial-gradient(200px 80px at 16% 50%, rgba(122, 162, 247, 0.14), transparent 78%), linear-gradient(#131722, #0f1219)',
          }}
        >
          <span className="text-pablo-primary mr-1.5">$</span>
          start inspecting
        </button>
      )}

      {/* Footer */}
      <div className="dashed-separator" />
      <div className="text-center">
        <span className="text-[9px] text-pablo-dim">
          v{chrome.runtime.getManifest().version}
        </span>
      </div>
    </div>
  );
}
