import { useState } from 'react';
import { HttpExchange, JsonViewer, PageHeader, RequestLog } from '../../../kit';
import type { ExchangeHeader, RequestLogEntry } from '../../../kit';
import type { LoggedExchange } from '../../data/api';
import { useRequestLog } from '../browser';
import { apiPathOf } from '../RequestsDrawer';
import '../workbench.css';

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

const toHeaders = (headers: Record<string, string>): ExchangeHeader[] => Object.entries(headers).map(([name, value]) => ({ name, value }));

const quoted = (text: string): string => `'${text.replace(/'/g, `'\\''`)}'`;

/** A curl that repeats the request as it went, against this page's own origin. */
function curlOf(entry: LoggedExchange): string {
  const headers = Object.entries(entry.requestHeaders).map(([name, value]) => ` -H ${quoted(`${name}: ${value}`)}`);
  const body = entry.requestBody !== null ? ` -d ${quoted(entry.requestBody)}` : '';
  return `curl -X ${entry.method}${headers.join('')}${body} ${quoted(`${window.location.origin}${entry.path}`)}`;
}

/** WB-7: every request this page sent to the API, newest first; pick one to read it exactly as it went. */
export function RequestLogPage() {
  const log = useRequestLog();
  const [picked, setPicked] = useState<number | null>(null);

  const numbered = log.map((entry, index) => ({ n: index + 1, entry }));
  const entries: RequestLogEntry[] = numbered
    .map(({ n, entry }) => ({ n, method: entry.method, path: apiPathOf(entry.path), status: entry.status, failed: entry.failed }))
    .reverse();
  const open: { n: number; entry: LoggedExchange } | undefined =
    numbered.find(({ n }) => n === picked) ?? numbered[numbered.length - 1];

  return (
    <div className="s-wb-page">
      <section className="s-wb-region" data-region="request-log" data-req="WB-7">
        <PageHeader
          mode="live"
          eyebrow="Workbench · Requests"
          title="Requests"
          question="What did this browser send to the API, and what came back?"
          answer={`${plural(log.length, 'request', 'requests')} sent since this page opened, listed newest first. Each is shown as it went over the wire.`}
          missingLabel="not in this response"
          ids={[]}
          liveNote="this browser's own log"
        />
        <h2 className="s-wb-heading">Request log, newest first</h2>
        <RequestLog entries={entries} onSelect={(entry) => setPicked(entry.n)} />
      </section>

      <section className="s-wb-region" data-region="one-exchange-request-response-status-line-curl" data-req="WB-7">
        {open ? (
          <>
            <h2 className="s-wb-heading">{`One exchange: #${open.n}`}</h2>
            <HttpExchange
              n={open.n}
              request={{
                method: open.entry.method,
                url: apiPathOf(open.entry.path),
                headers: toHeaders(open.entry.requestHeaders),
                body: open.entry.requestBody ?? undefined,
              }}
              response={
                open.entry.status !== null
                  ? {
                      status: open.entry.status,
                      headers: toHeaders(open.entry.responseHeaders ?? {}),
                      body: open.entry.responseBody ?? undefined,
                    }
                  : undefined
              }
              failure={open.entry.status === null ? 'No response was read.' : undefined}
              curl={curlOf(open.entry)}
            />
            {open.entry.responseBody ? <JsonViewer label={`response to request #${open.n}`} json={open.entry.responseBody} defaultOpen /> : null}
          </>
        ) : (
          <p className="s-wb-note">No request has been sent yet, so there is no exchange to show.</p>
        )}
      </section>
    </div>
  );
}
