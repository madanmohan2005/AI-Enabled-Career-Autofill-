// src/content/content.ts
import { detectFormElements } from '../detector/fieldDetector';
import { classifyFields, FieldMappingResult } from '../detector/intelligentClassifier';
import { fillElement } from '../filler/elementFiller';
import { getLocalProfile } from '../storage/profileStorage';

console.log('[CareerFill] Content script running on:', window.location.href);

let currentDetectedElements = new Map<string, HTMLElement>();
let hasAutoFilled = false;

async function scanPageFields(): Promise<FieldMappingResult[]> {
  const detected = detectFormElements(document);
  currentDetectedElements.clear();

  detected.forEach(item => {
    currentDetectedElements.set(item.signal.element_id, item.element);
  });

  const profile = await getLocalProfile();
  const signals = detected.map(d => d.signal);
  const mappings = await classifyFields(signals, profile);

  return mappings;
}

async function performAutofill(mappings: FieldMappingResult[]): Promise<{ filledCount: number }> {
  let filledCount = 0;

  for (const m of mappings) {
    if (m.action === 'UNCERTAIN' || !m.valueToFill) {
      continue;
    }

    const el = currentDetectedElements.get(m.element_id) ||
      document.querySelector(`[data-careerfill-id="${m.element_id}"]`) as any;

    if (el) {
      const ok = fillElement(el, m.valueToFill);
      if (ok) filledCount++;
    }
  }

  return { filledCount };
}

// Show a floating badge indicating autofill status
function showNotification(text: string) {
  let badge = document.getElementById('careerfill-toast-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'careerfill-toast-badge';
    badge.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999999;
      background: #0f172a;
      color: #f8fafc;
      border: 1px solid #10b981;
      border-radius: 50px;
      padding: 12px 22px;
      font-size: 14px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.3);
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(badge);
  }
  badge.innerHTML = `<span style="font-size: 16px;">⚡</span> <span>${text}</span>`;
  setTimeout(() => {
    if (badge) {
      badge.style.opacity = '0';
      badge.style.transform = 'translateY(10px)';
      setTimeout(() => badge.remove(), 400);
    }
  }, 4000);
}

// AUTOMATIC AUTO-FILL ON PAGE LOAD
async function runAutomaticAutofill() {
  if (hasAutoFilled) return;

  const detected = detectFormElements(document);
  if (detected.length < 2) return;

  hasAutoFilled = true;
  console.log('[CareerFill] Career form detected. Automatically filling fields...');

  try {
    const mappings = await scanPageFields();
    const res = await performAutofill(mappings);
    if (res.filledCount > 0) {
      showNotification(`CareerFill automatically filled ${res.filledCount} fields!`);
    }
  } catch (err) {
    console.error('[CareerFill] Auto-fill failed:', err);
  }
}

// Trigger automatically when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(runAutomaticAutofill, 400);
  });
} else {
  setTimeout(runAutomaticAutofill, 400);
}

// Listen for explicit manual messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCAN_PAGE') {
    scanPageFields().then(mappings => {
      sendResponse({ status: 'ok', mappings });
    }).catch(err => {
      sendResponse({ status: 'error', error: String(err) });
    });
    return true;
  }

  if (message.type === 'START_AUTOFILL') {
    const mappingsToFill: FieldMappingResult[] = message.mappings;
    if (mappingsToFill && mappingsToFill.length > 0) {
      performAutofill(mappingsToFill).then(res => {
        showNotification(`Filled ${res.filledCount} fields!`);
        sendResponse({ status: 'ok', ...res });
      });
    } else {
      scanPageFields().then(mappings => {
        return performAutofill(mappings);
      }).then(res => {
        showNotification(`Filled ${res.filledCount} fields!`);
        sendResponse({ status: 'ok', ...res });
      });
    }
    return true;
  }
});

// Dynamic form observer
let debounceTimer: any = null;
const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (!hasAutoFilled) {
      runAutomaticAutofill();
    }
  }, 600);
});

observer.observe(document.body || document.documentElement, {
  childList: true,
  subtree: true
});
