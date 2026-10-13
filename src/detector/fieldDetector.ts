// src/detector/fieldDetector.ts
/**
 * Advanced field detector that extracts rich signals from form controls
 * (input, textarea, select) for both heuristic and semantic classification.
 */

export interface FieldSignal {
  element_id: string;
  name?: string;
  html_id?: string;
  placeholder?: string;
  label_text?: string;
  aria_label?: string;
  input_type?: string;
  autocomplete?: string;
  surrounding_text?: string;
  options?: string[];
}

export interface DetectedElement {
  signal: FieldSignal;
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
}

export function detectFormElements(root: Document | HTMLElement = document): DetectedElement[] {
  const elements = Array.from(
    root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input, textarea, select'
    )
  );

  const detected: DetectedElement[] = [];

  elements.forEach((el, index) => {
    // Skip hidden, submit, button, reset inputs
    const type = el.getAttribute('type')?.toLowerCase();
    if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'reset' || type === 'image') {
      return;
    }

    // Skip invisible elements
    if (el.offsetWidth === 0 && el.offsetHeight === 0 && !el.getClientRects().length) {
      return;
    }

    // Assign temporary unique tracking ID if missing
    let elementId = el.getAttribute('data-careerfill-id');
    if (!elementId) {
      elementId = `cf-field-${index}-${Math.random().toString(36).substring(2, 7)}`;
      el.setAttribute('data-careerfill-id', elementId);
    }

    // Extract Label with comprehensive multi-tier discovery
    let labelText = '';
    const id = el.getAttribute('id');
    const labelledBy = el.getAttribute('aria-labelledby');

    // Tier 1: aria-labelledby reference
    if (labelledBy) {
      const refEl = root.querySelector(`#${CSS.escape(labelledBy)}`);
      if (refEl) labelText = refEl.textContent?.trim() || '';
    }

    // Tier 2: Standard HTML <label for="id">
    if (!labelText && id) {
      const labelEl = root.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (labelEl) labelText = labelEl.textContent?.trim() || '';
    }

    // Tier 3: Ancestor wrapping <label>
    if (!labelText) {
      const parentLabel = el.closest('label');
      if (parentLabel) labelText = parentLabel.textContent?.trim() || '';
    }

    // Tier 4: Sibling or container-scoped label (common in React, Bootstrap, Tailwind forms)
    if (!labelText) {
      const container = el.closest('.form-group, .form-row, .field, .input-container, .form-field, [class*="form"], [class*="field"], div');
      if (container) {
        const localLabel = container.querySelector('label, [class*="label"], [class*="title"]');
        if (localLabel && localLabel !== el) {
          labelText = localLabel.textContent?.trim() || '';
        }
      }
    }

    // Clean label text: strip asterisks, "required", "optional", excessive whitespace
    if (labelText) {
      labelText = labelText
        .replace(/\b(required|optional)\b/gi, '')
        .replace(/[*:\(\)]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Extract Surrounding Text (previous sibling or parent heading/legend/p)
    let surrounding = '';
    const parent = el.parentElement;
    if (parent) {
      const prev = el.previousElementSibling;
      if (prev && ['span', 'label', 'p', 'div', 'h3', 'h4', 'legend'].includes(prev.tagName.toLowerCase())) {
        surrounding += ' ' + prev.textContent?.trim();
      }
    }

    // Extract Select Options
    let options: string[] = [];
    if (el.tagName.toLowerCase() === 'select') {
      const selectEl = el as HTMLSelectElement;
      options = Array.from(selectEl.options).map(o => o.text.trim() || o.value.trim());
    }

    const signal: FieldSignal = {
      element_id: elementId,
      name: el.getAttribute('name') || undefined,
      html_id: id || undefined,
      placeholder: el.getAttribute('placeholder') || undefined,
      label_text: labelText || undefined,
      aria_label: el.getAttribute('aria-label') || undefined,
      input_type: type || el.tagName.toLowerCase(),
      autocomplete: el.getAttribute('autocomplete') || undefined,
      surrounding_text: surrounding.trim() || undefined,
      options: options.length ? options.slice(0, 10) : undefined
    };

    detected.push({ signal, element: el });
  });

  return detected;
}
