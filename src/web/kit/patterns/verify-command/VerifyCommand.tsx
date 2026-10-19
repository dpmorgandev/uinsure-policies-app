import type { ReactNode } from 'react';
import { CodeBlock } from '../../primitives/code-block/CodeBlock';
import styles from './VerifyCommand.module.css';

export interface VerifyCommandProps {
  /** The command, filled in and ready to run, exactly as it should be copied. */
  command: string;
  /** What the command lists and in what order. */
  intro?: ReactNode;
  /** What to expect when it runs: which SHA comes first and with which trailer. */
  expect?: ReactNode;
  /** What the page does and does not hold: where the SHAs came from, and that no output is recorded. */
  note?: ReactNode;
  /** Names the command for assistive technology. */
  label?: string;
  /** Words on the copy control. */
  copyLabel?: string;
  /** BUSY-1: words on the copy control while the copy is running. */
  copyBusyLabel?: string;
  /** Writes the text somewhere. Defaults to the system clipboard. */
  onCopy?: (text: string) => Promise<void>;
}

export function VerifyCommand({
  command,
  intro,
  expect,
  note,
  label = 'Command to re-check the order',
  copyLabel = 'Copy command',
  copyBusyLabel = 'Copying the command…',
  onCopy,
}: VerifyCommandProps) {
  return (
    <div className={styles.root}>
      {intro ? <p className={styles.intro}>{intro}</p> : null}
      <CodeBlock label={label} copyLabel={copyLabel} busyLabel={copyBusyLabel} onCopy={onCopy}>
        {command}
      </CodeBlock>
      {expect ? <p className={styles.expect}>{expect}</p> : null}
      {note ? <p className={styles.note}>{note}</p> : null}
    </div>
  );
}
