// The live page header's fields (kit PageHeader, mode="live"), read by their dt label: the Status field is the one the
// header always draws, whether or not the screen binds it (bug-002 N3, inv-009 I9).

/** The dd of the live header's field labelled `label`, or null when the header has no such field. */
export function headerField(label: string): HTMLElement | null {
  const terms = [...document.querySelectorAll('header[data-mode="live"] dt')];
  const term = terms.find((dt) => dt.textContent?.trim() === label);
  const value = term?.nextElementSibling ?? null;
  return value instanceof HTMLElement ? value : null;
}

/** The live header's Status text, trimmed, or null when the header has no Status field. */
export function headerStatusText(): string | null {
  return headerField('Status')?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
}
