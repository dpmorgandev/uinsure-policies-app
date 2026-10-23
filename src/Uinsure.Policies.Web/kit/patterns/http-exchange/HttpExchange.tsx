import { useId } from 'react';
import { CodeBlock } from '../../primitives/code-block/CodeBlock';
import { Disclosure } from '../../primitives/disclosure/Disclosure';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import type { Status } from '../../primitives/status-tag/StatusTag';
import styles from './HttpExchange.module.css';

export interface ExchangeHeader {
  name: string;
  value: string;
}

export interface ExchangeRequest {
  method: string;
  /** The path and query as sent, or the full URL. */
  url: string;
  headers?: readonly ExchangeHeader[];
  /** The body as sent, exactly. */
  body?: string;
}

export interface ExchangeResponse {
  status: number;
  statusText?: string;
  /** How long it took, in milliseconds. */
  timeMs?: number;
  /** The size of the response body, in bytes. */
  sizeBytes?: number;
  headers?: readonly ExchangeHeader[];
  /** The body as received, exactly. */
  body?: string;
}

export interface HttpExchangeProps {
  /** The request's place in the order this browser sent them: #1, #2. */
  n?: number;
  request: ExchangeRequest;
  /** Leave out when nothing came back. */
  response?: ExchangeResponse;
  /** Why nothing came back, when the API was unreachable. */
  failure?: string;
  /** A curl command that repeats the request, offered with a copy control. */
  curl?: string;
  headingLevel?: 2 | 3;
}

type Outcome = 'success' | 'problem' | 'unreachable' | 'pending';

function outcomeOf(response: ExchangeResponse | undefined, failure: string | undefined): Outcome {
  if (response) return response.status >= 400 ? 'problem' : 'success';
  return failure !== undefined ? 'unreachable' : 'pending';
}

function toneOf(code: number): Status {
  if (code < 300) return 'pass';
  if (code < 400) return 'warn';
  return 'fail';
}

function Headers({ headers }: { headers: readonly ExchangeHeader[] }) {
  return (
    <dl className={styles.headers}>
      {headers.map((header) => (
        <div key={header.name} className={styles.header}>
          <dt>{header.name}</dt>
          <dd>{header.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Body({ label, text }: { label: string; text: string }) {
  return (
    <div role="group" aria-label={label} className={styles.bodyWrap}>
      <pre className={styles.body}>{text}</pre>
    </div>
  );
}

/** One request and its response: the status line, headers, both bodies and a curl that repeats it. */
export function HttpExchange({ n, request, response, failure, curl, headingLevel = 3 }: HttpExchangeProps) {
  const base = useId();
  const titleId = `${base}-title`;
  const Heading = `h${headingLevel}` as 'h2' | 'h3';
  const SubHeading = `h${headingLevel + 1}` as 'h3' | 'h4';
  const outcome = outcomeOf(response, failure);
  const requestHeaders = request.headers ?? [];
  const responseHeaders = response?.headers ?? [];

  return (
    <article aria-labelledby={titleId} className={styles.root} data-outcome={outcome}>
      <Heading id={titleId} className={styles.title}>
        {n !== undefined ? (
          <>
            <span className={styles.n}>{`#${n}`}</span>{' '}
          </>
        ) : null}
        <span className={styles.method}>{request.method}</span> <code className={styles.url}>{request.url}</code>
      </Heading>

      <p className={styles.status}>
        {response ? (
          <>
            <StatusTag status={toneOf(response.status)}>
              {response.statusText ? `${response.status} ${response.statusText}` : String(response.status)}
            </StatusTag>
            {response.timeMs !== undefined ? <span className={styles.figure}>{`${response.timeMs} ms`}</span> : null}
            {response.sizeBytes !== undefined ? <span className={styles.figure}>{`${response.sizeBytes} B`}</span> : null}
          </>
        ) : outcome === 'unreachable' ? (
          <StatusTag status="fail">No response</StatusTag>
        ) : (
          <StatusTag status="pending">Waiting for a response</StatusTag>
        )}
      </p>

      <div className={styles.part}>
        <SubHeading className={styles.partTitle}>Request</SubHeading>
        {requestHeaders.length > 0 ? (
          <Disclosure summary={`Request headers (${requestHeaders.length})`}>
            <Headers headers={requestHeaders} />
          </Disclosure>
        ) : null}
        {request.body !== undefined ? (
          <Body label="Request body" text={request.body} />
        ) : (
          <p className={styles.none}>No request body.</p>
        )}
      </div>

      <div className={styles.part}>
        <SubHeading className={styles.partTitle}>Response</SubHeading>
        {response ? (
          <>
            {responseHeaders.length > 0 ? (
              <Disclosure summary={`Response headers (${responseHeaders.length})`} defaultOpen={outcome === 'problem'}>
                <Headers headers={responseHeaders} />
              </Disclosure>
            ) : null}
            {response.body !== undefined ? (
              <Body label="Response body" text={response.body} />
            ) : (
              <p className={styles.none}>No response body.</p>
            )}
          </>
        ) : (
          <p className={styles.none} role={outcome === 'unreachable' ? 'alert' : undefined}>
            {failure ?? 'Nothing has come back yet.'}
          </p>
        )}
      </div>

      {curl !== undefined ? (
        <div className={styles.part}>
          <SubHeading className={styles.partTitle}>Repeat it</SubHeading>
          <CodeBlock label={n !== undefined ? `curl for request #${n}` : 'curl for this request'} copyLabel="Copy curl">
            {curl}
          </CodeBlock>
        </div>
      ) : null}
    </article>
  );
}
