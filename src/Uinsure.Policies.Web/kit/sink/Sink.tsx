import type { JSX } from 'react';
import { TIERS } from './catalog';
import type { CatalogEntry, Tier } from './catalog';
import { ThemePair } from './ThemePair';
import { IconContent, TypeContent } from './Specimens';
import styles from './Sink.module.css';

// The data-comp tag the audit compares with the catalog: "<id> · <tier> · <state>" (a middle dot between).
export function compTag(id: string, tier: Tier, state: string): string {
  return `${id} · ${tier} · ${state}`;
}

function Component({ entry, tier }: { entry: CatalogEntry; tier: Tier }): JSX.Element {
  const headingId = `heading-${entry.id}`;
  return (
    <section id={`comp-${entry.id}`} aria-labelledby={headingId} className={styles.component}>
      <div className={styles.componentHead}>
        <h3 id={headingId} className={styles.componentId}>
          {entry.id}
        </h3>
        <span className={styles.componentTier}>{tier}</span>
        <a className={`${styles.link} ${styles.toTop}`} href="#skip-list">
          back to the skip list
        </a>
      </div>
      {entry.examples.map((example, index) => (
        <div key={`${index}-${example.state}`} className={styles.example}>
          <h4 className={styles.state}>{example.state}</h4>
          <ThemePair comp={compTag(entry.id, tier, example.state)}>{example.element}</ThemePair>
        </div>
      ))}
    </section>
  );
}

export function Sink(): JSX.Element {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Docket kit: kitchen sink</h1>
      <p className={styles.intro}>
        Every kit component in every state, each shown twice: under the light theme on the left and under the dark
        theme on the right. Sections follow the catalog order: primitives, patterns, layout, project.
      </p>

      <nav id="skip-list" aria-label="Skip list" className={styles.skip}>
        <p className={styles.skipTitle}>Skip to</p>
        <div className={styles.skipGroup}>
          <p className={styles.skipTier}>Specimens</p>
          <ul className={styles.skipList}>
            <li>
              <a className={styles.link} href="#type-specimen">
                type-specimen
              </a>
            </li>
            <li>
              <a className={styles.link} href="#icon-catalogue">
                icon-catalogue
              </a>
            </li>
          </ul>
        </div>
        {TIERS.map((group) => (
          <div key={group.tier} className={styles.skipGroup}>
            <p className={styles.skipTier}>{group.title}</p>
            <ul className={styles.skipList}>
              {group.entries.map((entry) => (
                <li key={entry.id}>
                  <a className={styles.link} href={`#comp-${entry.id}`}>
                    {entry.id}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <section id="type-specimen" data-specimen="type" aria-labelledby="heading-type-specimen" className={styles.specimen}>
        <h2 id="heading-type-specimen" className={styles.tierTitle}>
          Type specimen
        </h2>
        <ThemePair>
          <TypeContent />
        </ThemePair>
      </section>

      <section id="icon-catalogue" data-specimen="icons" aria-labelledby="heading-icon-catalogue" className={styles.specimen}>
        <h2 id="heading-icon-catalogue" className={styles.tierTitle}>
          Icon catalogue
        </h2>
        <ThemePair>
          <IconContent />
        </ThemePair>
      </section>

      {TIERS.map((group) => (
        <section key={group.tier} aria-labelledby={`heading-tier-${group.tier}`} className={styles.tier}>
          <h2 id={`heading-tier-${group.tier}`} className={styles.tierTitle}>
            {group.title}
          </h2>
          {group.entries.map((entry) => (
            <Component key={entry.id} entry={entry} tier={group.tier} />
          ))}
        </section>
      ))}
    </div>
  );
}
