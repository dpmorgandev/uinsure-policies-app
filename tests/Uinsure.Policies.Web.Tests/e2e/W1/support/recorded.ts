// The workbench's design fixture: the API's real answers recorded in docs/ui/fixture/api/, the data the W1
// screens were signed off on. For parity only: a parity flow answers the page's /api/… requests from a recording,
// so the built route and its derived reference show the same exchange. Behaviour tests use the live API.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page, Route } from '@playwright/test';
import { repoRoot } from './api';

export const recordedDir = join(repoRoot, 'docs', 'ui', 'fixture', 'api');

export interface RecordedExchange {
  role: string;
  method: string;
  /** The API's path, /policies/… (the page asks for /api/policies/…). */
  path: string;
  requestBody: unknown;
  status: number;
  responseHeaders: Record<string, string>;
  responseBody: unknown;
}

interface Recording {
  item: string;
  exchanges: RecordedExchange[];
}

export function recording(file: string): RecordedExchange[] {
  return (JSON.parse(readFileSync(join(recordedDir, file), 'utf8')) as Recording).exchanges;
}

/** The `n`th exchange of a recording (in the order it was recorded). */
export function exchangeAt(file: string, n: number): RecordedExchange {
  const exchange = recording(file)[n];
  if (exchange === undefined) throw new Error(`${file} has no exchange ${n}`);
  return exchange;
}

/** The page's next `method` request to the exchange's path is answered with the recorded answer. */
export async function answerWith(page: Page, exchange: RecordedExchange): Promise<void> {
  const path = `/api${exchange.path}`;
  await page.route(
    (url) => url.pathname === path,
    (handled: Route) =>
      handled.request().method() === exchange.method
        ? handled.fulfill({
            status: exchange.status,
            contentType: exchange.responseHeaders['content-type'] ?? 'application/json',
            body: JSON.stringify(exchange.responseBody),
          })
        : handled.fallback(),
  );
}

/** The recordings the W1 screens' states name (docs/ui/screens/wb-*\/screen.json). */
export const REC = {
  /** SELL-1, a new reference, 201: F1-MVFJOFJ8IS, then read back. */
  sold: '003-sell-1-new-reference-201.json',
  /** SELL-2, start today + 61, 4 policyholders, one under 16, amount 0: 422 with 4 violations. */
  refused: '021-sell-2-start-today-61-4-policyholders-one-under-16-amount-0-422.json',
  /** GET-1, a sold policy read back in full: F2-MVFJQA9DQG, sold then read. */
  readBack: '045-get-1-sold-policy-reads-back-in-full-200.json',
  /** GET-1, an unknown reference: 404. */
  unknown: '053-get-1-unknown-reference-404.json',
} as const;
