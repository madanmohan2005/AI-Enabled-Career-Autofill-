// src/filler/inputFiller.ts
/**
 * Fill a text, email, tel or textarea element with a given value.
 * The function focuses the element, sets its value, and dispatches
 * input & change events so that any listeners on the page react.
 */
export function fillInput(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  el.focus();
  el.value = value;
  // Dispatch events to mimic user input
  const inputEvent = new Event('input', { bubbles: true });
  const changeEvent = new Event('change', { bubbles: true });
  el.dispatchEvent(inputEvent);
  el.dispatchEvent(changeEvent);
}
