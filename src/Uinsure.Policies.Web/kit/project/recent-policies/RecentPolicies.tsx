import { useId } from 'react';
import type { ElementType } from 'react';
import { Eye, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '../../patterns/empty-state/EmptyState';
import styles from './RecentPolicies.module.css';

export interface RecentPolicy {
  /** The policy reference, as the API wrote it. */
  reference: string;
  /** Where the policy opens in the workbench. */
  href: string;
  /** What this browser did with it: sold it, or opened it. */
  how: 'sold' | 'opened';
}

export interface RecentPoliciesProps {
  /** The references the request log holds, newest first. The caller reads local storage; this only draws it. */
  policies: readonly RecentPolicy[];
  /** `unavailable` when the browser would not give access to local storage. */
  storage?: 'available' | 'unavailable';
  /** The level of the heading. Defaults to 2. */
  headingLevel?: 2 | 3 | 4;
}

const WORDS: Record<RecentPolicy['how'], string> = { sold: 'Sold', opened: 'Opened' };
const GLYPHS: Record<RecentPolicy['how'], LucideIcon> = { sold: Plus, opened: Eye };

export function RecentPolicies({ policies, storage = 'available', headingLevel = 2 }: RecentPoliciesProps) {
  const headingId = useId();
  const Heading: ElementType = `h${headingLevel}`;
  const state = storage === 'unavailable' ? 'unavailable' : policies.length === 0 ? 'empty' : 'pop';

  return (
    <section className={styles.root} data-state={state} aria-labelledby={headingId}>
      <Heading id={headingId} className={styles.heading}>
        Recent policies in this browser
      </Heading>
      <p className={styles.scope}>
        <strong>This browser only.</strong> The list is read from the request log in this browser&rsquo;s local storage.
        Another browser or device shows a different list, and clearing site data empties it.
      </p>
      {state === 'unavailable' ? (
        <EmptyState
          context="not-loaded"
          compact
          title="Recent policies can't be shown"
          why="This browser would not give access to its local storage, so there is no request log to read. Nothing is lost on the API: look a policy up by its reference."
        />
      ) : state === 'empty' ? (
        <EmptyState
          context="empty"
          compact
          title="No policy has been sold or opened in this browser yet"
          why="A reference appears here after you sell a policy or open one by its reference."
        />
      ) : (
        <ul className={styles.list} aria-label="References, newest first">
          {policies.map((policy) => {
            const Glyph = GLYPHS[policy.how];
            return (
              <li key={policy.reference} className={styles.item} data-how={policy.how}>
                <a className={styles.reference} href={policy.href}>
                  {policy.reference}
                </a>
                <span className={styles.how}>
                  <Glyph className={styles.icon} aria-hidden="true" focusable="false" />
                  <span>{WORDS[policy.how]}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
