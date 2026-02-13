import { MSG, type ExtensionMessage } from '../shared/messages';

// Route messages between popup and content scripts
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  switch (message.type) {
    // Content script → popup (broadcast to all extension pages)
    case MSG.STATUS_UPDATE:
    case MSG.EXTRACTION_COMPLETE:
      // These are automatically received by the popup via chrome.runtime.onMessage
      // No explicit routing needed — Chrome broadcasts to all extension contexts
      break;

    // Popup → content script (forward to active tab)
    case MSG.ACTIVATE_INSPECTOR:
    case MSG.DEACTIVATE_INSPECTOR:
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId) {
          chrome.tabs.sendMessage(tabId, message);
        }
      });
      break;
  }

  sendResponse({ ok: true });
  return true;
});
