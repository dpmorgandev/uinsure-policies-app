import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import styles from './Disclosure.module.css';

export interface DisclosureProps {
  /** What the control says. Say what is inside: "Full detail", not "More". */
  summary: ReactNode;
  children: ReactNode;
  /** Start open. A failure's detail should start open. */
  defaultOpen?: boolean;
  /** Called with the new state each time the reader toggles it. */
  onToggle?: (open: boolean) => void;
}

export function Disclosure({ summary, children, defaultOpen = false, onToggle }: DisclosureProps) {
  const panelId = useId();
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    onToggle?.(next);
  };

  return (
    <div className={styles.root} data-open={open ? 'true' : 'false'}>
      <button type="button" className={styles.trigger} aria-expanded={open} aria-controls={panelId} onClick={toggle}>
        <ChevronRight className={styles.chevron} aria-hidden="true" focusable="false" />
        <span>{summary}</span>
      </button>
      <div id={panelId} className={styles.panel} hidden={!open}>
        {children}
      </div>
    </div>
  );
}
