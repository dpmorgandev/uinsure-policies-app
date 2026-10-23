import { useSyncExternalStore } from 'react';
import { loggingFetch } from '../data/api';
import type { ApiDeps, LoggedExchange, RecentStore } from '../data/api';

// A browser can refuse local storage by throwing on the first touch (WB-9).
function browserStorage(): RecentStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// WB-7: every request the page sends goes through one log, kept for the life of the page.
const requestLog: LoggedExchange[] = [];
let logSnapshot: readonly LoggedExchange[] = [];
const watchers = new Set<() => void>();
const loggedFetch = loggingFetch((input, init) => fetch(input, init), requestLog);

// The page keeps the newest exchanges only, so a long session cannot grow the log without bound.
const MAX_EXCHANGES = 1000;
// A settled exchange is copied once; every later snapshot holds that same copy.
const settledCopies = new WeakMap<LoggedExchange, LoggedExchange>();

function publish(): void {
  if (requestLog.length > MAX_EXCHANGES) requestLog.splice(0, requestLog.length - MAX_EXCHANGES);
  logSnapshot = requestLog.map((entry) => {
    const settled = settledCopies.get(entry);
    if (settled !== undefined) return settled;
    const copy = { ...entry };
    if (entry.status !== null) settledCopies.set(entry, copy);
    return copy;
  });
  watchers.forEach((watcher) => watcher());
}

async function sendLogged(input: string, init?: RequestInit): Promise<Response> {
  const sending = loggedFetch(input, init);
  publish();
  try {
    return await sending;
  } finally {
    publish();
  }
}

/** The requests sent so far, oldest first; a new array each time one is sent or answered. */
export function useRequestLog(): readonly LoggedExchange[] {
  return useSyncExternalStore(
    (watcher) => {
      watchers.add(watcher);
      return () => watchers.delete(watcher);
    },
    () => logSnapshot,
  );
}

/** What the API client needs from the browser: its logging fetch and its local storage. */
export function browserDeps(): ApiDeps {
  return { fetch: sendLogged, storage: browserStorage() };
}

/** Today as yyyy-MM-dd on the UK calendar, which is the API's (SELL-2). Only the form's own checks read it. */
export function todayInLondon(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
}
