import { useId } from 'react';
import type { ReactNode } from 'react';
import { Info, TriangleAlert } from 'lucide-react';
import styles from './DocumentPage.module.css';

export interface DocumentContentsItem {
  /** The id of the `DocumentSection` it points to. */
  id: string;
  label: string;
}

export interface DocumentPageProps {
  title: string;
  /** A short line above the title: where the document comes from. */
  eyebrow?: string;
  /** One or two sentences that say what the document is for. */
  lede?: ReactNode;
  /** The sections in reading order. Draws an "On this page" list of links; leave out for a short document. */
  contents?: readonly DocumentContentsItem[];
  /** `DocumentSection`s, in reading order. */
  children: ReactNode;
}

/**
 * Long-form reading layout for the guide and the about page. Sections are numbered down a spine in the
 * order they are written, and the prose keeps a readable measure.
 */
export function DocumentPage({ title, eyebrow, lede, contents, children }: DocumentPageProps) {
  const hasContents = contents !== undefined && contents.length > 0;
  return (
    <article className={styles.root}>
      <header className={styles.head}>
        {eyebrow !== undefined ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h1 className={styles.title}>{title}</h1>
        {lede !== undefined ? <div className={styles.lede}>{lede}</div> : null}
      </header>
      {hasContents ? (
        <nav aria-label="On this page" className={styles.contents}>
          <p className={styles.contentsTitle}>On this page</p>
          <ol className={styles.contentsList}>
            {contents.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className={styles.contentsLink}>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className={styles.body}>{children}</div>
    </article>
  );
}

export interface DocumentSectionProps {
  /** The heading's id. The contents list and other pages link to it. */
  id: string;
  heading: string;
  children: ReactNode;
}

/** One numbered section of a `DocumentPage`: a level 2 heading and its prose. */
export function DocumentSection({ id, heading, children }: DocumentSectionProps) {
  return (
    <section className={styles.section} aria-labelledby={id}>
      <div className={styles.rail} aria-hidden="true">
        <span className={styles.node} />
      </div>
      <div className={styles.sectionBody}>
        <h2 id={id} tabIndex={-1} className={styles.heading}>
          {heading}
        </h2>
        {children}
      </div>
    </section>
  );
}

export interface DocumentFigureProps {
  /** What the figure shows. A figure always has one. */
  caption: ReactNode;
  children: ReactNode;
}

/** A table, a quotation or a block of code with its caption. Wide content scrolls inside the figure. */
export function DocumentFigure({ caption, children }: DocumentFigureProps) {
  const captionId = useId();
  return (
    <figure className={styles.figure} aria-labelledby={captionId}>
      <div className={styles.figureBody} role="region" aria-labelledby={captionId} tabIndex={0}>
        {children}
      </div>
      <figcaption id={captionId} className={styles.caption}>
        {caption}
      </figcaption>
    </figure>
  );
}

export interface DocumentCalloutProps {
  /** `note` for something worth knowing, `warning` for something that is still open or can go wrong. */
  tone?: 'note' | 'warning';
  /** Replaces the default word, "Note" or "Warning". */
  title?: string;
  children: ReactNode;
}

/** A set-apart remark. The tone is a word and a glyph as well as a colour. */
export function DocumentCallout({ tone = 'note', title, children }: DocumentCalloutProps) {
  const titleId = useId();
  const Glyph = tone === 'warning' ? TriangleAlert : Info;
  return (
    <div role="note" aria-labelledby={titleId} className={styles.callout} data-tone={tone}>
      <p id={titleId} className={styles.calloutTitle}>
        <Glyph className={styles.calloutIcon} aria-hidden="true" focusable="false" />
        {title ?? (tone === 'warning' ? 'Warning' : 'Note')}
      </p>
      <div className={styles.calloutBody}>{children}</div>
    </div>
  );
}
