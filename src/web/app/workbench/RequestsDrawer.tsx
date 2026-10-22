import { useState } from 'react';
import { InspectorDrawer } from '../../kit';
import type { InspectorRequest } from '../../kit';
import type { LoggedExchange } from '../data/api';
import { useRequestLog } from './browser';

/** The path as the API's contract writes it: the app's /api proxy prefix is not part of the exchange. */
export const apiPathOf = (path: string): string => path.replace(/^\/api(?=\/)/, '');

/** A body as it went over the wire, laid out for reading. */
export const bodyText = (body: unknown): string => JSON.stringify(body, null, 2);

function describe(entry: LoggedExchange, number: number): InspectorRequest {
  const parts = [
    entry.requestBody !== null ? `request\n${bodyText(entry.requestBody)}` : null,
    entry.responseBody !== null ? `response\n${bodyText(entry.responseBody)}` : null,
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
  const requests = log.map((entry, index) => describe(entry, index + 1)).reverse();
  return <InspectorDrawer requests={requests} open={open} onOpenChange={setOpen} />;
}
