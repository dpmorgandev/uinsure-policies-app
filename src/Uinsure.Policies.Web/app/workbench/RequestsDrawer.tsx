import { useEffect, useRef, useState } from 'react';
import { InspectorDrawer } from '../../kit';
import type { InspectorRequest } from '../../kit';
import type { LoggedExchange } from '../data/api';
import { useRequestLog } from './browser';

/** The path as the API's contract writes it: the app's /api proxy prefix is not part of the exchange. */
export const apiPathOf = (path: string): string => path.replace(/^\/api(?=\/)/, '');

/** A JSON body indented for reading, one key a line; any other body exactly as received. The log keeps the wire text. */
function forDisplay(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

function describe(entry: LoggedExchange, number: number): InspectorRequest {
  const parts = [
    entry.requestBody !== null ? `request\n${forDisplay(entry.requestBody)}` : null,
    entry.responseBody !== null ? `response\n${forDisplay(entry.responseBody)}` : null,
  ].filter((part): part is string => part !== null);
  return {
    number,
    method: entry.method,
    path: apiPathOf(entry.path),
    status: entry.status ?? undefined,
    outcome: entry.status === null ? 'pending' : entry.status < 400 ? 'ok' : 'problem',
    exchange: parts.length > 0 ? parts.join('\n') : undefined,
  };
}

/** WB-7: the requests this page has sent, newest first, each with the request and response as they went. */
export function RequestsDrawer() {
  const log = useRequestLog();
  const [open, setOpen] = useState(false);
  const seen = useRef(log.length);
  // WB-7: a send opens the drawer, so the latest request and response are shown with no click.
  useEffect(() => {
    if (log.length > seen.current) setOpen(true);
    seen.current = log.length;
  }, [log.length]);
  const requests = log.map((entry, index) => describe(entry, index + 1)).reverse();
  return <InspectorDrawer requests={requests} open={open} onOpenChange={setOpen} />;
}
