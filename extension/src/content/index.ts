import { activate, deactivate, handleContinueCapture } from './overlay';
import { detectStack } from './detector';
import { MSG, type ExtensionMessage } from '../shared/messages';

// Listen for messages from popup / background
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  console.log('[Pablo] Content script received message:', message.type);
  switch (message.type) {
    case MSG.ACTIVATE_INSPECTOR:
      activate(message.mode);
      sendResponse({ ok: true });
      break;
    case MSG.DEACTIVATE_INSPECTOR:
      deactivate();
      sendResponse({ ok: true });
      break;
    case MSG.DETECT_STACK:
      sendResponse({ stack: detectStack() });
      break;
    case MSG.CONTINUE_CAPTURE: {
      const msg = message as any;
      handleContinueCapture(msg.fingerprint, msg.immediatePayload);
      sendResponse({ ok: true });
      break;
    }
  }
  return true;
});

// Notify service worker that content script is ready (important after page refresh for capture flow)
chrome.runtime.sendMessage({ type: MSG.CONTENT_SCRIPT_READY }, () => {
  void chrome.runtime.lastError; // Suppress error if no listener
});
