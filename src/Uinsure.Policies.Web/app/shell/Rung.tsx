import { useId } from 'react';
import type { ReactNode } from 'react';
import { NotBuiltYet } from '../../kit';
import './rung.css';

interface RungProps {
  /** The region's slug and the requirement IDs it proves, as the screen file names them. */
  region: string;
  req: string;
  ordinal: string;
  heading: string;
  children: ReactNode;
}

/** One numbered step of a screen: the ordinal and heading on the left, the body on the right. */
export function Rung({ region, req, ordinal, heading, children }: RungProps) {
  const headingId = useId();
  return (
    <section className="s-rung" data-region={region} data-req={req} aria-labelledby={headingId}>
      <div className="s-label">
        <p className="s-ordinal">{ordinal}</p>
        <h2 className="s-heading" id={headingId}>
          {heading}
        </h2>
      </div>
      <div className="s-body">{children}</div>
    </section>
  );
}

/** A tagged region that is not a numbered step: a page's header and its first answer sit in one. */
export function Region({ region, req, label, children }: { region: string; req: string; label: string; children: ReactNode }) {
  return (
    <section className="s-region" data-region={region} data-req={req} aria-label={label}>
      <div className="s-body">{children}</div>
    </section>
  );
}

/** A region the screen file marks as not built: the kit's pattern, with no requirement ID claimed. */
export function NotBuiltRegion({ region, name }: { region: string; name: string }) {
  return (
    <section className="s-region" data-region={region} data-built="false">
      <NotBuiltYet kind="region" name={name} />
    </section>
  );
}
