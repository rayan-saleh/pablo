import { MSG, type ExtensionMessage } from '../shared/messages';
import { getSettings, saveSettings } from '../shared/settings';
import { runReconstructionPipeline } from './reconstruction/pipeline';

// Route messages between popup and content scripts
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  console.log('[CC] Service worker received message:', message.type);
  switch (message.type) {
    // Content script → popup (broadcast to all extension contexts)
    case MSG.STATUS_UPDATE:
    case MSG.EXTRACTION_COMPLETE:
    case MSG.RECONSTRUCTION_PROGRESS:
      break;

    // Popup → content script (forward to active tab)
    case MSG.ACTIVATE_INSPECTOR:
    case MSG.DEACTIVATE_INSPECTOR:
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId) {
          chrome.tabs.sendMessage(tabId, message, () => {
            // Check lastError to suppress "Receiving end does not exist" on
            // pages where the content script isn't injected.
            void chrome.runtime.lastError;
          });
        }
      });
      break;

    // Popup → content script (forward and relay response back)
    case MSG.DETECT_STACK:
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId) {
          chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
              // Content script not injected (chrome://, new tab, etc.)
              sendResponse({ stack: 'generic' });
              return;
            }
            sendResponse(response);
          });
        } else {
          sendResponse({ stack: 'generic' });
        }
      });
      return true; // async sendResponse

    // Settings handlers
    case MSG.GET_SETTINGS:
      getSettings().then((settings) => sendResponse({ settings }));
      return true; // async sendResponse

    case MSG.SAVE_SETTINGS:
      saveSettings(message.settings).then(() => sendResponse({ ok: true }));
      return true;
  }

  sendResponse({ ok: true });
  return true;
});

// Port-based connection for long-running reconstruction
chrome.runtime.onConnect.addListener((port) => {
  console.log('[CC] Port connected:', port.name);
  if (port.name !== 'reconstruction') return;

  port.onMessage.addListener(async (message) => {
    if (message.type !== MSG.RECONSTRUCTION_START) return;

    try {
      const settings = await getSettings();

      // Check API key is configured
      const key = settings.provider === 'anthropic' ? settings.apiKey : settings.openaiApiKey;
      if (!key) {
        port.postMessage({
          type: MSG.RECONSTRUCTION_ERROR,
          error: `No API key configured for ${settings.provider}. Open extension settings to add one.`,
        });
        return;
      }

      console.log('[CC] Reconstruction start, components:', message.payload.components.length);
      const result = await runReconstructionPipeline(
        message.payload,
        settings,
        (progress) => {
          port.postMessage({
            type: MSG.RECONSTRUCTION_PROGRESS,
            progress,
          });
          // Also broadcast progress to popup
          chrome.runtime.sendMessage({
            type: MSG.RECONSTRUCTION_PROGRESS,
            progress,
          }).catch(() => {});
        },
      );

      console.log('[CC] Reconstruction complete');
      port.postMessage({
        type: MSG.RECONSTRUCTION_COMPLETE,
        result,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.log('[CC] Reconstruction error:', errorMsg);
      port.postMessage({
        type: MSG.RECONSTRUCTION_ERROR,
        error: errorMsg,
      });
    }
  });
});
