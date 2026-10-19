import type { ReactNode } from 'react';
import { CircleDashed, ExternalLink, Link2Off, Radio } from 'lucide-react';
import { ProvenanceLabel } from '../../primitives/provenance-label/ProvenanceLabel';
import type { Provenance } from '../../primitives/provenance-label/ProvenanceLabel';
import styles from './ReceiptFigure.module.css';

export interface ReceiptSource {
  /** Where the number comes from, in words or as a path: "docs/qa/build-F2.md#1". */
  label: string;
  /** One click to the source. */
  href: string;
  /** The link leaves this app. Adds the external glyph. */
  external?: boolean;
}

export interface ReceiptFigureProps {
  /** The figure exactly as the source writes it: "41 of 41", "445.11". `null` or absent means there is none yet. */
  value?: string | null;
  /** What the figure counts or measures. Without it a number means nothing. */
  unit: ReactNode;
  /** Where the number comes from. A figure with a value and no source is flagged, never shown bare. */
  source?: ReceiptSource | null;
  /** How the number was made: generated, recorded or written. */
  provenance?: Provenance;
  /** The figure was read from the API a moment ago, not compiled from the trail. */
  live?: boolean;
  /** Words beside the Live marker. */
  liveNote?: ReactNode;
  /** Words for a figure with no value yet. */
  notBuiltNote?: ReactNode;
  /** A line under the figure. */
  note?: ReactNode;
}

export function ReceiptFigure({
  value,
  unit,
  source,
  provenance,
  live = false,
  liveNote,
  notBuiltNote = 'not built yet, so there is no number to count',
  note,
}: ReceiptFigureProps) {
  const present = value !== undefined && value !== null && value !== '';
  const state = !present ? 'nb' : live ? 'live' : 'pop';

  return (
    <figure className={styles.root} data-state={state}>
      <p className={styles.value}>
        {present ? (
          value
        ) : (
          <span className={styles.nb}>
            <CircleDashed className={styles.icon} aria-hidden="true" focusable="false" />
            <span>Not built yet</span>
          </span>
        )}
      </p>
      <figcaption className={styles.caption}>
        <span className={styles.unit}>{present ? unit : <>{unit}: {notBuiltNote}</>}</span>
        <span className={styles.line}>
          {source ? (
            <>
              <span className={styles.lead}>Source</span>
              <a className={styles.source} href={source.href}>
                <span>{source.label}</span>
                {source.external ? (
                  <ExternalLink className={styles.icon} aria-hidden="true" focusable="false" />
                ) : null}
              </a>
            </>
          ) : present ? (
            <span className={styles.nosource}>
              <Link2Off className={styles.icon} aria-hidden="true" focusable="false" />
              <span>No source given, so treat this number as unchecked</span>
            </span>
          ) : (
            <span className={styles.lead}>Source: none yet</span>
          )}
          {provenance && present ? <ProvenanceLabel provenance={provenance} showMeaning={false} /> : null}
          {live && present ? (
            <span className={styles.live}>
              <Radio className={styles.icon} aria-hidden="true" focusable="false" />
              <span>Live</span>
              {liveNote ? <span className={styles.liveNote}>{liveNote}</span> : null}
            </span>
          ) : null}
        </span>
        {note ? <span className={styles.note}>{note}</span> : null}
      </figcaption>
    </figure>
  );
}
