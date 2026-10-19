import { Cog, Database, PenLine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from './ProvenanceLabel.module.css';

export type Provenance = 'generated' | 'recorded' | 'written';

export interface ProvenanceLabelProps {
  provenance: Provenance;
  /** Show the one-line meaning beside the label. On by default. */
  showMeaning?: boolean;
}

// The wording follows docs/trace/README.md.
const MEANINGS: Record<Provenance, string> = {
  generated: 'a hook or render-trace.mjs wrote it, never an agent producing the code',
  recorded: "a hook stored an agent's judgement verbatim; the agent can't alter it afterwards",
  written: 'by David or the main session',
};

const GLYPHS: Record<Provenance, LucideIcon> = {
  generated: Cog,
  recorded: Database,
  written: PenLine,
};

export function ProvenanceLabel({ provenance, showMeaning = true }: ProvenanceLabelProps) {
  const Glyph = GLYPHS[provenance];
  return (
    <span className={styles.root} data-provenance={provenance}>
      <span className={styles.label}>
        <Glyph className={styles.icon} aria-hidden="true" focusable="false" />
        <span>{provenance}</span>
      </span>
      {showMeaning ? (
        <span className={styles.meaning}>{MEANINGS[provenance]}</span>
      ) : (
        <span className={styles.srOnly}>, {MEANINGS[provenance]}</span>
      )}
    </span>
  );
}
