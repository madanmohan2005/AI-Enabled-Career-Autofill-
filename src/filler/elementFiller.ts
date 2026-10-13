// src/filler/elementFiller.ts
/**
 * Safely populates HTML form controls and dispatches synthetic events
 * so reactive frameworks (React, Vue, Angular) register the changes.
 */

export function fillElement(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string
): boolean {
  if (!el || value === undefined || value === null) return false;

  const tagName = el.tagName.toLowerCase();
  const type = el.getAttribute('type')?.toLowerCase();

  try {
    el.focus();

    if (tagName === 'select') {
      const select = el as HTMLSelectElement;
      let matched = false;
      const lowerVal = value.toLowerCase().trim();

      // Check for exact value or exact text match
      for (let i = 0; i < select.options.length; i++) {
        const opt = select.options[i];
        if (opt.value.toLowerCase().trim() === lowerVal || opt.text.toLowerCase().trim() === lowerVal) {
          select.selectedIndex = i;
          matched = true;
          break;
        }
      }

      // If not matched, try fuzzy substring match
      if (!matched) {
        for (let i = 0; i < select.options.length; i++) {
          const opt = select.options[i];
          if (opt.text.toLowerCase().includes(lowerVal) || lowerVal.includes(opt.text.toLowerCase())) {
            select.selectedIndex = i;
            matched = true;
            break;
          }
        }
      }
    } else if (type === 'checkbox') {
      const cb = el as HTMLInputElement;
      const isTrue = ['true', 'yes', '1', 'checked'].includes(value.toLowerCase().trim());
      cb.checked = isTrue;
    } else if (type === 'radio') {
      const radio = el as HTMLInputElement;
      if (radio.value.toLowerCase().trim() === value.toLowerCase().trim()) {
        radio.checked = true;
      }
    } else {
      // Standard input or textarea
      // Use native value setter to work around React controlled input synthetic event interception
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;

      if (tagName === 'textarea' && nativeTextAreaValueSetter) {
        nativeTextAreaValueSetter.call(el, value);
      } else if (nativeInputValueSetter) {
        nativeInputValueSetter.call(el, value);
      } else {
        el.value = value;
      }
    }

    // Dispatch input & change events
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    el.blur();

    // Visual feedback highlight
    el.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
    el.style.borderColor = '#10b981';
    el.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';

    return true;
  } catch (err) {
    console.error('Error filling element:', err);
    return false;
  }
}
