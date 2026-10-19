import { useRef, useState } from 'react';
import { Check, Copy, LoaderCircle, TriangleAlert } from 'lucide-react';
import styles from './CodeBlock.module.css';

export interface CodeBlockProps {
  /** The command or detail line, exactly as it should be copied. */
  children: string;
  /** Names what the block holds, for assistive technology: "Command to re-check the order". */
  label: string;
  /** Words on the copy control. */
  copyLabel?: string;
  /** BUSY-1: words on the control while the copy is running. */
  busyLabel?: string;
  copiedLabel?: string;
  failedLabel?: string;
  /** Writes the text somewhere. Defaults to the system clipboard. */
  onCopy?: (text: string) => Promise<void>;
}

type Phase = 'idle' | 'busy' | 'copied' | 'failed';

async function writeToClipboard(text: string): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) throw new Error('The clipboard is not available');
  await navigator.clipboard.writeText(text);
}

export function CodeBlock({
  children,
  label,
  copyLabel = 'Copy',
  busyLabel = 'Copying…',
  copiedLabel = 'Copied',
  failedLabel = 'Copy failed',
  onCopy = writeToClipboard,
}: CodeBlockProps) {
  const [state, setState] = useState<{ phase: Phase; text: string }>({ phase: 'idle', text: children });
  const inFlight = useRef(false);

  // A result belongs to the text it was made for; if the text changes the control starts again.
  const phase: Phase = state.text === children ? state.phase : 'idle';
  const busy = phase === 'busy';

  const copy = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    const text = children;
    setState({ phase: 'busy', text });
    try {
      await onCopy(text);
      setState({ phase: 'copied', text });
    } catch {
      setState({ phase: 'failed', text });
    } finally {
      inFlight.current = false;
    }
  };

  const words: Record<Phase, string> = { idle: copyLabel, busy: busyLabel, copied: copiedLabel, failed: failedLabel };
  const Glyph = busy ? LoaderCircle : phase === 'copied' ? Check : phase === 'failed' ? TriangleAlert : Copy;

  return (
    <div className={styles.root} role="group" aria-label={label} data-phase={phase}>
      <pre className={styles.pre}>
        <code className={styles.code}>{children}</code>
      </pre>
      <button
        type="button"
        className={styles.button}
        disabled={busy}
        aria-disabled={busy ? 'true' : undefined}
        aria-busy={busy ? 'true' : undefined}
        onClick={copy}
      >
        <Glyph className={`${styles.icon} ${busy ? styles.spin : ''}`.trim()} aria-hidden="true" focusable="false" />
        <span>{words[phase]}</span>
      </button>
      <span role="status" className={styles.srOnly}>
        {phase === 'idle' ? '' : words[phase]}
      </span>
    </div>
  );
}
