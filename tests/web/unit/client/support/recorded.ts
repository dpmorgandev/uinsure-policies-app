// The API client's unit tests run on the API's real answers, recorded in docs/ui/fixture/api/ (the workbench's
// design fixture): a test picks one recorded exchange and a recording fetch answers the client's request with it,
// as the app's /api proxy would. Every expected value a test asserts is read from that recording. Nothing here
// throws when the client fails: `settle` and `outcome` turn a throw into a failed assertion that names it.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';
import type { Fetch, RecentStore } from '../../../../../src/web/app/data/api';

const recordedDir = fileURLToPath(new URL('../../../../../docs/ui/fixture/api/', import.meta.url));

export interface RecordedExchange {
  role: string;
  method: string;
  /** The API's own path, /policies/…; the app asks for it as /api/policies/…. */
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

/** The `n`th exchange of a recording, in the order it was recorded. */
export function exchange(file: string, n: number): RecordedExchange {
  const recording = JSON.parse(readFileSync(recordedDir + file, 'utf8')) as Recording;
  const found = recording.exchanges[n];
  expect(found, `fixture setup: ${file} has an exchange ${n}`).toBeDefined();
  return found as RecordedExchange;
}

/** The recordings these tests use (docs/ui/fixture/api/index.json names each). */
export const REC = {
  /** SELL-1, a new reference: 0 POST 201 F1-MVFJOFJ8IS, 1 GET 200. */
  sold: '003-sell-1-new-reference-201.json',
  /** SELL-1, "  f1-mvfjohjgc6  " typed: 0 POST 201 F1-MVFJOHJGC6, 2 GET by the lower-case reference 200. */
  normalised: '004-sell-1-lower-case-reference-with-spaces-is-normalised-201.json',
  /** SELL-1, a duplicate reference: 1 POST 409. */
  duplicate: '014-sell-1-duplicate-reference-409.json',
  /** SELL-2, SELL-4, SELL-5, SELL-7 at once: 0 POST 422 with 4 violations. */
  refused: '021-sell-2-start-today-61-4-policyholders-one-under-16-amount-0-422.json',
  /** A malformed body: 0 POST 400 under "$" and "request". */
  malformed: '029-shape-malformed-json-400.json',
  /** hasClaims sent: 0 POST 400 under "request" and "$.hasClaims". */
  hasClaims: '031-shape-hasclaims-sent-400.json',
  /** No start date: 0 POST 400 under "startDate". */
  noStartDate: '032-shape-startdate-missing-400.json',
  /** A start date that isn't yyyy-MM-dd: 0 POST 400 under "request" and "$.startDate". */
  badStartDate: '033-shape-startdate-not-yyyy-mm-dd-400.json',
  /** No address line 1: 0 POST 400 under "property.addressLine1". */
  noAddressLine1: '038-shape-address-line-1-missing-400.json',
  /** No date of birth: 0 POST 400 under "policyholders[0].dateOfBirth". */
  noDateOfBirth: '039-shape-policyholder-date-of-birth-missing-400.json',
  /** GET-1, read back in full: 1 GET 200 F2-MVFJQA9DQG. */
  readBack: '045-get-1-sold-policy-reads-back-in-full-200.json',
  /** GET-1, a lower-case reference: 1 GET /policies/f2-mvfjqeynmy 200 F2-MVFJQEYNMY. */
  lowerCase: '048-get-1-lower-case-reference-finds-the-policy-200.json',
  /** GET-1, an unknown reference: 0 GET 404. */
  unknown: '053-get-1-unknown-reference-404.json',
} as const;

export interface SentRequest {
  url: string;
  method: string;
  contentType: string | null;
  /** The body as sent, parsed from JSON; undefined when none was sent. */
  body: unknown;
}

export interface Served {
  fetch: Fetch;
  /** Every request the client made, in order. */
  sent: SentRequest[];
}

function record(sent: SentRequest[], input: string, init: RequestInit | undefined): void {
  const raw = init?.body;
  sent.push({
    url: String(input),
    method: (init?.method ?? 'GET').toUpperCase(),
    contentType: new Headers(init?.headers).get('content-type'),
    body: raw === undefined || raw === null ? undefined : JSON.parse(String(raw)),
  });
}

/** A fetch that answers every request with the recorded exchange's status, content type and body. */
export function answering(recorded: RecordedExchange): Served {
  const sent: SentRequest[] = [];
  const fetch: Fetch = async (input, init) => {
    record(sent, input, init);
    return new Response(JSON.stringify(recorded.responseBody), {
      status: recorded.status,
      headers: { 'content-type': recorded.responseHeaders['content-type'] ?? 'application/json' },
    });
  };
  return { fetch, sent };
}

/** A fetch whose every request fails before an answer, as when the API isn't running. */
export function unreachable(): Served {
  const sent: SentRequest[] = [];
  const fetch: Fetch = async (input, init) => {
    record(sent, input, init);
    throw new TypeError('Failed to fetch');
  };
  return { fetch, sent };
}

export interface MemoryStore extends RecentStore {
  /** How many times the client wrote to it. */
  writes(): number;
}

/** A browser's local storage, in memory: one per browser. */
export function memoryStore(): MemoryStore {
  const values = new Map<string, string>();
  let written = 0;
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      written += 1;
      values.set(key, value);
    },
    writes: () => written,
  };
}

/** Local storage the browser refuses: every read and write throws, as a SecurityError does. */
export function refusingStore(): RecentStore {
  return {
    getItem: () => {
      throw new Error('SecurityError: the operation is insecure');
    },
    setItem: () => {
      throw new Error('SecurityError: the operation is insecure');
    },
  };
}

/** Local storage that reads but won't take a write, as when it is full. */
export function fullStore(): RecentStore {
  return {
    getItem: () => null,
    setItem: () => {
      throw new Error('QuotaExceededError: the quota has been exceeded');
    },
  };
}

/** Local storage holding text that is no list of policies, under every key. */
export function garbledStore(): RecentStore {
  return { getItem: () => '{ not json', setItem: () => undefined };
}

function said(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Awaits a client call; a throw or a rejection fails the test as an assertion that names it. */
export async function settle<T>(call: () => Promise<T>): Promise<T> {
  let value: T | undefined;
  let error: unknown;
  let threw = false;
  try {
    value = await call();
  } catch (caught) {
    threw = true;
    error = caught;
  }
  expect(threw, `the client settles to an answer, never a throw (it threw: ${said(error)})`).toBe(false);
  return value as T;
}

/** Runs a synchronous client call; a throw fails the test as an assertion that names it. */
export function outcome<T>(call: () => T): T {
  let value: T | undefined;
  let error: unknown;
  let threw = false;
  try {
    value = call();
  } catch (caught) {
    threw = true;
    error = caught;
  }
  expect(threw, `the client returns a result, never a throw (it threw: ${said(error)})`).toBe(false);
  return value as T;
}
