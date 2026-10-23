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

function publish(): void {
  // Only an exchange still waiting is copied afresh; a settled one is kept as the same object.
  const before = logSnapshot;
  logSnapshot = requestLog.map((entry, index) => {
    const seen = before[index];
    return seen !== undefined && seen.status !== null ? seen : { ...entry };
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
