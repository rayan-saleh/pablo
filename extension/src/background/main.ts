import { MSG, type ExtensionMessage } from '../shared/messages';
import type { ClipboardPayload, ElementFingerprint } from '../shared/types';
import {
  collectEntranceAnimationsInMainWorld,
  collectIntersectionDataInMainWorld,
  installEnhancedAnimationRecorderInMainWorld,
  installIntersectionObserverHookInMainWorld,
} from './deep-capture-main-world';
import { collectGsapInMainWorld } from './gsap-main-world';
import { collectFiberInMainWorld, probeReactInMainWorld } from './react-main-world';

interface PendingCapture {
  tabId: number;
  url: string;
  fingerprint: ElementFingerprint;
  immediatePayload: ClipboardPayload;
  startedAt: number;
}

const PENDING_CAPTURE_KEY = '__pablo_pending_capture';

let pendingCapture: PendingCapture | null = null;

async function savePendingCapture(capture: PendingCapture | null): Promise<void> {
  pendingCapture = capture;
  try {
    if (capture) {
      await chrome.storage.session.set({ [PENDING_CAPTURE_KEY]: capture });
    } else {
      await chrome.storage.session.remove(PENDING_CAPTURE_KEY);
    }
  } catch {
    // Session storage is optional; keep the in-memory fallback.
  }
}

async function loadPendingCapture(): Promise<PendingCapture | null> {
  if (pendingCapture) return pendingCapture;

  try {
    const result = await chrome.storage.session.get(PENDING_CAPTURE_KEY);
    const restored = result[PENDING_CAPTURE_KEY];
    if (restored) {
      pendingCapture = restored;
      return pendingCapture;
    }
  } catch {
    // Ignore storage restoration failures.
  }

  return null;
}

async function executeInMainWorld<Result>(tabId: number, func: () => Result): Promise<Result | null> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func,
    });
    return (results?.[0]?.result ?? null) as Result | null;
  } catch {
    return null;
  }
}

function getSenderTabId(sender: chrome.runtime.MessageSender): number | null {
  return sender.tab?.id ?? null;
}

async function detectStackInActiveTab(): Promise<{ stack: string }> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { stack: 'generic' };

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: MSG.DETECT_STACK });
    return response ?? { stack: 'generic' };
  } catch {
    return { stack: 'generic' };
  }
}

chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const url = details.url;
  if (
    url.startsWith('chrome://') ||
    url.startsWith('about:') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('devtools://')
  ) {
    return;
  }

  const pending = await loadPendingCapture();
  if (!pending || pending.tabId !== details.tabId) return;

  void executeInMainWorld(details.tabId, installEnhancedAnimationRecorderInMainWorld);
  void executeInMainWorld(details.tabId, installIntersectionObserverHookInMainWorld);
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  void (async () => {
    switch (message.type) {
      case MSG.STATUS_UPDATE:
      case MSG.EXTRACTION_COMPLETE:
      case MSG.ACTIVATE_INSPECTOR:
      case MSG.DEACTIVATE_INSPECTOR:
        sendResponse({ ok: true });
        return;

      case MSG.DETECT_STACK:
        sendResponse(await detectStackInActiveTab());
        return;

      case MSG.PROBE_REACT: {
        const tabId = getSenderTabId(sender);
        sendResponse({ isReact: tabId ? await executeInMainWorld(tabId, probeReactInMainWorld) === true : false });
        return;
      }

      case MSG.COLLECT_FIBER: {
        const tabId = getSenderTabId(sender);
        sendResponse({ data: tabId ? await executeInMainWorld(tabId, collectFiberInMainWorld) : null });
        return;
      }

      case MSG.COLLECT_GSAP: {
        const tabId = getSenderTabId(sender);
        sendResponse({ data: tabId ? await executeInMainWorld(tabId, collectGsapInMainWorld) : null });
        return;
      }

      case MSG.START_ANIMATION_CAPTURE: {
        const tabId = getSenderTabId(sender);
        if (!tabId) {
          sendResponse({ ok: false });
          return;
        }

        const capture: PendingCapture = {
          tabId,
          url: message.url,
          fingerprint: message.fingerprint,
          immediatePayload: message.immediatePayload,
          startedAt: Date.now(),
        };

        await savePendingCapture(capture);

        try {
          await chrome.tabs.reload(tabId);
          sendResponse({ ok: true });
        } catch {
          await savePendingCapture(null);
          sendResponse({ ok: false });
        }
        return;
      }

      case MSG.CONTENT_SCRIPT_READY: {
        const tabId = getSenderTabId(sender);
        if (!tabId) {
          sendResponse({ ok: true });
          return;
        }

        const pending = await loadPendingCapture();
        if (!pending || pending.tabId !== tabId) {
          sendResponse({ ok: true });
          return;
        }

        try {
          const pendingPath = new URL(pending.url).pathname;
          const currentPath = sender.tab?.url ? new URL(sender.tab.url).pathname : pendingPath;
          if (pendingPath !== currentPath) {
            await savePendingCapture(null);
            sendResponse({ ok: true });
            return;
          }
        } catch {
          // Ignore URL parse issues and continue with the pending capture.
        }

        if (Date.now() - pending.startedAt > 30000) {
          await savePendingCapture(null);
          sendResponse({ ok: true });
          return;
        }

        try {
          await chrome.tabs.sendMessage(tabId, {
            type: MSG.CONTINUE_CAPTURE,
            fingerprint: pending.fingerprint,
            immediatePayload: pending.immediatePayload,
          });
        } catch {
          // Ignore tab messaging failures; the content script may still be loading.
        }

        await savePendingCapture(null);
        sendResponse({ ok: true });
        return;
      }

      case MSG.COLLECT_ENTRANCE_ANIMATIONS: {
        const tabId = getSenderTabId(sender);
        sendResponse({ data: tabId ? await executeInMainWorld(tabId, collectEntranceAnimationsInMainWorld) : null });
        return;
      }

      case MSG.COLLECT_INTERSECTION_DATA: {
        const tabId = getSenderTabId(sender);
        sendResponse({ data: tabId ? await executeInMainWorld(tabId, collectIntersectionDataInMainWorld) : null });
        return;
      }

      case MSG.CONTINUE_CAPTURE:
      case MSG.CAPTURE_PHASE_UPDATE:
        sendResponse({ ok: true });
        return;
    }
  })().catch(() => {
    sendResponse({ ok: false });
  });

  return true;
});
