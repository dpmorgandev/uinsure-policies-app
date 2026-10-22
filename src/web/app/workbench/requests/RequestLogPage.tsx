import { useState } from 'react';
import { FilterBar, HttpExchange, JsonViewer, PageHeader, RequestLog } from '../../../kit';
import type { RequestLogEntry } from '../../../kit';
import type { LoggedExchange } from '../../data/api';
import { useRequestLog } from '../browser';
import { apiPathOf, bodyText } from '../RequestsDrawer';
import '../workbench.css';

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

const distinct = (values: string[]): { value: string; label: string }[] =>
  [...new Set(values)].sort().map((value) => ({ value, label: value }));

/** WB-7: every request this page sent to the API, newest first; pick one to read it exactly as it went. */
export function RequestLogPage() {
  const log = useRequestLog();
  const [method, setMethod] = useState('');
  const [status, setStatus] = useState('');
  const [picked, setPicked] = useState<number | null>(null);

  const numbered = log.map((entry, index) => ({ n: index + 1, entry }));
  const shown = numbered.filter(
    ({ entry }) => (method === '' || entry.method === method) && (status === '' || String(entry.status) === status),
  );
  const entries: RequestLogEntry[] = shown
    .map(({ n, entry }) => ({ n, method: entry.method, path: apiPathOf(entry.path), status: entry.status ?? 0 }))
    .reverse();
  const open: { n: number; entry: LoggedExchange } | undefined =
    numbered.find(({ n }) => n === picked) ?? shown[shown.length - 1];

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
        <FilterBar
          filters={[
            { id: 'method', label: 'Method', options: distinct(log.map((e) => e.method)), value: method },
            { id: 'status', label: 'Status', options: distinct(log.flatMap((e) => (e.status === null ? [] : [String(e.status)]))), value: status },
          ]}
          onChange={(id, value) => (id === 'method' ? setMethod(value) : setStatus(value))}
          onClear={() => {
            setMethod('');
            setStatus('');
          }}
          matchCount={shown.length}
          totalCount={log.length}
          noun="requests"
        />
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
                body: open.entry.requestBody !== null ? bodyText(open.entry.requestBody) : undefined,
              }}
              response={
                open.entry.status !== null
                  ? {
                      status: open.entry.status,
                      body: open.entry.responseBody !== null ? bodyText(open.entry.responseBody) : undefined,
                    }
                  : undefined
              }
              failure={open.entry.status === null ? 'No response was read.' : undefined}
            />
            {open.entry.responseBody !== null ? (
              <JsonViewer label={`response to request #${open.n}`} json={JSON.stringify(open.entry.responseBody)} defaultOpen />
            ) : null}
          </>
        ) : (
          <p className="s-wb-note">No request has been sent yet, so there is no exchange to show.</p>
        )}
      </section>
    </div>
  );
}
