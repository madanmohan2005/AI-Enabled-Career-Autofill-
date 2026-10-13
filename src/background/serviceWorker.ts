// src/background/serviceWorker.ts
// Minimal background service worker for the extension.
// Currently only logs that it is running. Future logic (e.g., auth) can be added here.

chrome.runtime.onInstalled.addListener(() => {
  console.log('CareerFill background service worker installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Placeholder for handling messages from popup or content script if needed.
  console.log('Background received message', message);
  // No response needed for now.
});
