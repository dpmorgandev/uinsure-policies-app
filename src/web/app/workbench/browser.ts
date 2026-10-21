import type { ApiDeps, RecentStore } from '../data/api';

// A browser can refuse local storage by throwing on the first touch (WB-9).
function browserStorage(): RecentStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** What the API client needs from the browser: its fetch and its local storage. */
export function browserDeps(): ApiDeps {
  return { fetch: (input, init) => fetch(input, init), storage: browserStorage() };
}

/** Today as yyyy-MM-dd on the UK calendar, which is the API's (SELL-2). Only the form's own checks read it. */
export function todayInLondon(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
}
