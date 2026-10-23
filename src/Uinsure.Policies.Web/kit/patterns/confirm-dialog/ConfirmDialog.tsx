import { useEffect, useId, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../primitives/button/Button';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  /** A question that names the thing: "Cancel policy F3-MVEOSVDQJQ?". */
  title: string;
  /** Exactly what will happen, with the quoted date and the refund, and that it can't be undone. */
  children: ReactNode;
  /** The action in the action's own words: "Cancel policy on 2027-01-27". Never "OK". */
  confirmLabel: string;
  /** BUSY-1: what is happening once confirmed: "Cancelling…". */
  busyLabel: string;
  cancelLabel?: string;
  /** BUSY-1: the confirmed request is running. The confirm control is disabled and busy, and so is going back. */
  busy?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  /** Take focus on open, onto the safe choice. Switch it off only to lay several dialogs out side by side. */
  focusOnOpen?: boolean;
  /** `overlay` covers the page. `inline` lays the dialog out in the flow, for the kitchen sink and documents. */
  placement?: 'overlay' | 'inline';
}

/**
 * Confirms an irreversible action. Rendered means open. Focus goes to the safe choice on open, stays inside
 * while open, and returns to where it came from when the dialog goes. Escape goes back unless a request runs.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  busyLabel,
  cancelLabel = 'Go back',
  busy = false,
  onConfirm,
  onCancel,
  focusOnOpen = true,
  placement = 'overlay',
}: ConfirmDialogProps) {
  const base = useId();
  const titleId = `${base}-title`;
  const bodyId = `${base}-body`;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusOnOpen) return undefined;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.querySelector<HTMLElement>('[data-initial-focus]')?.focus();
    return () => {
      opener?.focus();
    };
  }, [focusOnOpen]);

  // A disabled control loses focus, so while the request runs the dialog itself holds it.
  useEffect(() => {
    if (busy && focusOnOpen) panelRef.current?.focus();
  }, [busy, focusOnOpen]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      if (!busy) {
        event.stopPropagation();
        onCancel?.();
      }
      return;
    }
    if (event.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const controls = Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled])'));
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first || !last) {
      event.preventDefault();
      panel.focus();
      return;
    }
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={styles.scrim} data-placement={placement}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        className={styles.dialog}
        data-busy={busy ? 'true' : undefined}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <div id={bodyId} className={styles.body}>
          {children}
        </div>
        <div className={styles.actions}>
          <Button
            variant="destructive"
            icon={<X size="1em" aria-hidden="true" />}
            busy={busy}
            busyLabel={busyLabel}
            onClick={() => onConfirm?.()}
          >
            {confirmLabel}
          </Button>
          <Button variant="secondary" data-initial-focus="" disabled={busy} onClick={() => onCancel?.()}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
