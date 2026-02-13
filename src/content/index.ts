import { activate, deactivate } from './overlay';
import { MSG, type ExtensionMessage } from '../shared/messages';

// Listen for messages from popup / background
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  switch (message.type) {
    case MSG.ACTIVATE_INSPECTOR:
      activate(message.mode);
      sendResponse({ ok: true });
      break;
    case MSG.DEACTIVATE_INSPECTOR:
      deactivate();
      sendResponse({ ok: true });
      break;
  }
  return true;
});
