import { TriangleAlert } from 'lucide-react';
import { CodeBlock } from '../../primitives/code-block/CodeBlock';
import { Disclosure } from '../../primitives/disclosure/Disclosure';
import styles from './JsonViewer.module.css';

export interface JsonViewerProps {
  /** The JSON exactly as stored. It is re-indented for reading but never re-parsed into other numbers, so "615.40" stays "615.40". */
  json: string;
  /** Names what it is: "reviewer verdict A2", "quote response". */
  label: string;
  /** Open it at the start. Collapsed by default. */
  defaultOpen?: boolean;
  /** Words on the copy control. */
  copyLabel?: string;
  /** BUSY-1: words on the copy control while the copy is running. */
  copyBusyLabel?: string;
  /** Writes the text somewhere. Defaults to the system clipboard. */
  onCopy?: (text: string) => Promise<void>;
}

type Reading = { ok: true; text: string } | { ok: false; message: string };

/** Lays out valid JSON with two-space indents, copying every token as it was written. */
function indent(raw: string): string {
  const pad = (depth: number) => '  '.repeat(depth);
  let out = '';
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i] ?? '';
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
    } else if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') {
      continue;
    } else if (ch === '{' || ch === '[') {
      const close = ch === '{' ? '}' : ']';
      let next = i + 1;
      while (next < raw.length && /\s/.test(raw[next] ?? '')) next += 1;
      if (raw[next] === close) {
        out += ch + close;
        i = next;
      } else {
        depth += 1;
        out += `${ch}\n${pad(depth)}`;
      }
    } else if (ch === '}' || ch === ']') {
      depth -= 1;
      out += `\n${pad(depth)}${ch}`;
    } else if (ch === ',') {
      out += `,\n${pad(depth)}`;
    } else if (ch === ':') {
      out += ': ';
    } else {
      out += ch;
    }
  }
  return out;
}

function read(json: string): Reading {
  try {
    JSON.parse(json);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'It could not be read.' };
  }
  return { ok: true, text: indent(json) };
}

export function JsonViewer({
  json,
  label,
  defaultOpen = false,
  copyLabel = 'Copy JSON',
  copyBusyLabel = 'Copying JSON…',
  onCopy,
}: JsonViewerProps) {
  const reading = read(json);
  const shown = reading.ok ? reading.text : json;
  const lines = shown === '' ? 0 : shown.split('\n').length;

  return (
    <div className={styles.root} data-state={reading.ok ? 'valid' : 'malformed'}>
      {reading.ok ? null : (
        <p className={styles.notice}>
          <TriangleAlert className={styles.icon} aria-hidden="true" focusable="false" />
          <span>
            <strong>Malformed JSON.</strong> It could not be read ({reading.message}). It is shown as received, not repaired.
          </span>
        </p>
      )}
      <Disclosure
        defaultOpen={defaultOpen}
        summary={
          <>
            Raw JSON: {label} <span className={styles.size}>({lines} {lines === 1 ? 'line' : 'lines'})</span>
          </>
        }
      >
        <div className={styles.body}>
          <CodeBlock label={`Raw JSON: ${label}`} copyLabel={copyLabel} busyLabel={copyBusyLabel} onCopy={onCopy}>
            {shown}
          </CodeBlock>
        </div>
      </Disclosure>
    </div>
  );
}
