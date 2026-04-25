import { activate, deactivate } from './overlay';
import { detectStack } from './detector';
import { MSG, type ExtensionMessage } from '../shared/messages';

// Listen for messages from popup / background
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  console.log('[Pablo] Content script received message:', message.type);
  switch (message.type) {
    case MSG.ACTIVATE_INSPECTOR:
      activate(message.mode, message.includeScreenshot);
      sendResponse({ ok: true });
      break;
    case MSG.DEACTIVATE_INSPECTOR:
      deactivate();
      sendResponse({ ok: true });
      break;
    case MSG.DETECT_STACK:
      sendResponse({ stack: detectStack() });
      break;
  }
  return true;
});
