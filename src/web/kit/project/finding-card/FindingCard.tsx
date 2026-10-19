import { useId } from 'react';
import type { ReactNode } from 'react';
import { FlaskConical, FlaskConicalOff } from 'lucide-react';
import { FileLineLink } from '../../primitives/file-line-link/FileLineLink';
import { ShaLink } from '../../primitives/sha-link/ShaLink';
import type { ShaLinkProps } from '../../primitives/sha-link/ShaLink';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import styles from './FindingCard.module.css';

export interface FindingFile {
  path: string;
  line?: number | null;
  /** The file on GitHub at the SHA the finding names. Without one the path is plain text. */
  href?: string;
}

export interface FindingFix extends Pick<ShaLinkProps, 'sha' | 'fullSha' | 'href' | 'githubHref'> {
  /** The trailer the commit carries: "Fixes-Finding: A2/I1". */
  trailer?: string;
  /** The commit's subject line. */
  subject?: string;
}

export interface FindingCardProps {
  /** The finding's ID as commits cite it: "A2/I1". */
  id: string;
  severity?: 'P1' | 'P2';
  /** What was seen. */
  symptom: ReactNode;
  /** Why it happened. Leave out when the trail does not say. */
  cause?: ReactNode;
  files?: readonly FindingFile[];
  fixDirection?: ReactNode;
  suggestedTest?: ReactNode;
  /** Can a test show it? An untestable finding says why. */
  testable: boolean;
  untestableReason?: ReactNode;
  /** The commit that fixed it. `null` or nothing means no fix commit is recorded. */
  fixedBy?: FindingFix | null;
  headingLevel?: 3 | 4;
}

function Absent({ children = 'not recorded in the excerpt' }: { children?: string }) {
  return <span className={styles.absent}>{children}</span>;
}

/** One finding: the symptom and cause, the files, how to fix it, how to test it, and the commit that fixed it. */
export function FindingCard({
  id,
  severity,
  symptom,
  cause,
  files,
  fixDirection,
  suggestedTest,
  testable,
  untestableReason,
  fixedBy,
  headingLevel = 3,
}: FindingCardProps) {
  const headingId = useId();
  const Heading = `h${headingLevel}` as 'h3' | 'h4';
  const fixed = fixedBy !== undefined && fixedBy !== null;
  return (
    <article
      className={styles.card}
      aria-labelledby={headingId}
      data-testable={testable ? 'true' : 'false'}
      data-fixed={fixed ? 'true' : 'false'}
    >
      <Heading id={headingId} className={styles.title}>
        <span className={styles.id}>{id}</span>
        {severity ? <StatusTag status={severity === 'P1' ? 'fail' : 'warn'}>{severity}</StatusTag> : null}
        {testable ? (
          <span className={styles.testable}>
            <FlaskConical className={styles.icon} aria-hidden="true" focusable="false" />
            <span>Testable</span>
          </span>
        ) : (
          <span className={`${styles.testable} ${styles.untestable}`}>
            <FlaskConicalOff className={styles.icon} aria-hidden="true" focusable="false" />
            <span>Untestable</span>
          </span>
        )}
      </Heading>
      <dl className={styles.fields}>
        <div className={styles.field}>
          <dt>Symptom</dt>
          <dd>{symptom}</dd>
        </div>
        <div className={styles.field}>
          <dt>Cause</dt>
          <dd>{cause ?? <Absent />}</dd>
        </div>
        <div className={styles.field}>
          <dt>Files</dt>
          <dd>
            {files === undefined || files.length === 0 ? (
              <Absent />
            ) : (
              <ul className={styles.files} aria-label={`Files of finding ${id}`}>
                {files.map((file) => (
                  <li key={`${file.path}:${file.line ?? ''}`}>
                    {file.href ? (
                      <FileLineLink path={file.path} line={file.line} href={file.href} />
                    ) : (
                      <span className={styles.path}>{file.line !== undefined && file.line !== null ? `${file.path}:${file.line}` : file.path}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
        <div className={styles.field}>
          <dt>Fix direction</dt>
          <dd>{fixDirection ?? <Absent />}</dd>
        </div>
        <div className={styles.field}>
          <dt>{testable ? 'Suggested test' : 'Why untestable'}</dt>
          <dd>
            {testable ? (suggestedTest ?? <Absent />) : (untestableReason ?? <Absent>reason not recorded</Absent>)}
          </dd>
        </div>
        <div className={styles.field}>
          <dt>Fixed by</dt>
          <dd>
            {fixedBy ? (
              <span className={styles.fix}>
                <ShaLink sha={fixedBy.sha} fullSha={fixedBy.fullSha} href={fixedBy.href} githubHref={fixedBy.githubHref} />
                {fixedBy.trailer ? <span className={styles.trailer}>{fixedBy.trailer}</span> : null}
                {fixedBy.subject ? <span>{fixedBy.subject}</span> : null}
              </span>
            ) : (
              <StatusTag status="warn">No fix commit recorded</StatusTag>
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}
