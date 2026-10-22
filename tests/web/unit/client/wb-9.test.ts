// @vitest-environment node
// WB-9 · Recent policies. The references this browser has sold or opened, kept in local storage; no list
// endpoint (David, 2026-10-19). A sale the API accepts (sellPolicy, 201) is remembered as sold, a policy the API
// returns (getPolicy, 200) as opened, each under the reference the API wrote; readRecent lists them newest first.
// Each test has a browser's storage of its own (an in-memory store); the answers are recorded in
// docs/ui/fixture/api/.
import { describe, expect, test } from 'vitest';
import { getPolicy, readRecent, sellPolicy } from '../../../../src/web/app/data/api';
import type { RecentRead, RecentStore, SellRequest } from '../../../../src/web/app/data/api';
import {
  REC,
  answering,
  exchange,
  fullStore,
  garbledStore,
  memoryStore,
  outcome,
  refusingStore,
  settle,
  unreachable,
} from './support/recorded';
import type { RecordedExchange } from './support/recorded';

/** Sells through the client, answered by a recorded POST. */
async function sold(storage: RecentStore | null, recorded: RecordedExchange) {
  return settle(() => sellPolicy({ fetch: answering(recorded).fetch, storage }, recorded.requestBody as SellRequest));
}

/** Opens `reference` through the client, answered by a recorded GET. */
async function opened(storage: RecentStore | null, recorded: RecordedExchange, reference: string) {
  return settle(() => getPolicy({ fetch: answering(recorded).fetch, storage }, reference));
}

/** The list a store holds; fails, as an assertion, when the store can't be read. */
function entriesIn(storage: RecentStore | null): { reference: string; how: string }[] {
  const read: RecentRead = outcome(() => readRecent(storage));
  expect(read.state, 'the store can be read').toBe('available');
  return read.state === 'available' ? read.entries : [];
}

describe('what is listed', () => {
  test('WB-9 · a browser that has sold or opened nothing lists nothing', () => {
    expect(entriesIn(memoryStore())).toEqual([]);
  });

  test('WB-9 · a policy the API sold (201) is listed as sold, under its reference', async () => {
    const store = memoryStore();
    await sold(store, exchange(REC.sold, 0));
    expect(entriesIn(store)).toEqual([{ reference: 'F1-MVFJOFJ8IS', how: 'sold' }]);
  });

  test('WB-9 · a sale typed in lower case with spaces is listed under the reference the API stored', async () => {
    const store = memoryStore();
    await sold(store, exchange(REC.normalised, 0));
    expect(entriesIn(store)).toEqual([{ reference: 'F1-MVFJOHJGC6', how: 'sold' }]);
  });

  test('WB-9 · a policy the API returned (200) is listed as opened, under its reference', async () => {
    const store = memoryStore();
    await opened(store, exchange(REC.readBack, 1), 'F2-MVFJQA9DQG');
    expect(entriesIn(store)).toEqual([{ reference: 'F2-MVFJQA9DQG', how: 'opened' }]);
  });

  test('WB-9 · a policy opened by a lower-case reference is listed under the reference the API returned', async () => {
    const store = memoryStore();
    await opened(store, exchange(REC.lowerCase, 1), 'f2-mvfjqeynmy');
    expect(entriesIn(store)).toEqual([{ reference: 'F2-MVFJQEYNMY', how: 'opened' }]);
  });

  test('WB-9 · the list is newest first', async () => {
    const store = memoryStore();
    await sold(store, exchange(REC.sold, 0));
    await opened(store, exchange(REC.readBack, 1), 'F2-MVFJQA9DQG');
    expect(entriesIn(store)).toEqual([
      { reference: 'F2-MVFJQA9DQG', how: 'opened' },
      { reference: 'F1-MVFJOFJ8IS', how: 'sold' },
    ]);
  });

  test('WB-9 · a reference sold then opened again is listed once, at its newest place', async () => {
    const store = memoryStore();
    await sold(store, exchange(REC.sold, 0));
    await opened(store, exchange(REC.readBack, 1), 'F2-MVFJQA9DQG');
    await opened(store, exchange(REC.sold, 1), 'F1-MVFJOFJ8IS');
    expect(entriesIn(store).map((e) => e.reference)).toEqual(['F1-MVFJOFJ8IS', 'F2-MVFJQA9DQG']);
  });
});

describe('what is not listed', () => {
  test('WB-9 · a sale the API refused (422) is not listed', async () => {
    const store = memoryStore();
    await sold(store, exchange(REC.refused, 0));
    expect(entriesIn(store)).toEqual([]);
  });

  test('WB-9 · a duplicate sale the API refused (409) is not listed', async () => {
    const store = memoryStore();
    await sold(store, exchange(REC.duplicate, 1));
    expect(entriesIn(store)).toEqual([]);
  });

  test('WB-9 · a sale the API refused for its shape (400) is not listed', async () => {
    const store = memoryStore();
    await sold(store, exchange(REC.noStartDate, 0));
    expect(entriesIn(store)).toEqual([]);
  });

  test('WB-9 · a reference the API has no policy for (404) is not listed', async () => {
    const store = memoryStore();
    await opened(store, exchange(REC.unknown, 0), 'F2-MVFJQMPREM');
    expect(entriesIn(store)).toEqual([]);
  });

  test('WB-9 · a sale or a read the API never answered is not listed', async () => {
    const store = memoryStore();
    await settle(() => sellPolicy({ fetch: unreachable().fetch, storage: store }, exchange(REC.sold, 0).requestBody as SellRequest));
    await settle(() => getPolicy({ fetch: unreachable().fetch, storage: store }, 'F2-MVFJQA9DQG'));
    expect(entriesIn(store)).toEqual([]);
  });
});

describe('kept in this browser', () => {
  test("WB-9 · the list is written to the browser's storage, and read back from it", async () => {
    const store = memoryStore();
    await sold(store, exchange(REC.sold, 0));
    expect(store.writes(), 'the sale was written to storage').toBeGreaterThan(0);
    expect(entriesIn(store), 'read again, as after a reload').toEqual([{ reference: 'F1-MVFJOFJ8IS', how: 'sold' }]);
  });

  test("WB-9 · another browser's storage doesn't list it", async () => {
    await sold(memoryStore(), exchange(REC.sold, 0));
    expect(entriesIn(memoryStore())).toEqual([]);
  });
});

describe('storage the browser withholds', () => {
  test('WB-9 · with no storage, the list is unavailable, and the sale still answers', async () => {
    expect(outcome(() => readRecent(null))).toEqual({ state: 'unavailable' });
    const answer = await sold(null, exchange(REC.sold, 0));
    expect(answer.kind).toBe('ok');
  });

  test('WB-9 · storage the browser refuses makes the list unavailable, never a throw', () => {
    expect(outcome(() => readRecent(refusingStore()))).toEqual({ state: 'unavailable' });
  });

  test('WB-9 · storage the browser refuses leaves the sale and the read answered', async () => {
    const store = refusingStore();
    expect((await sold(store, exchange(REC.sold, 0))).kind).toBe('ok');
    expect((await opened(store, exchange(REC.readBack, 1), 'F2-MVFJQA9DQG')).kind).toBe('ok');
  });

  test("WB-9 · storage that won't take a write leaves the sale answered", async () => {
    expect((await sold(fullStore(), exchange(REC.sold, 0))).kind).toBe('ok');
  });

  test('WB-9 · storage holding text that is no list lists no policy it cannot read, never a throw', () => {
    const read = outcome(() => readRecent(garbledStore()));
    const listed = read.state === 'available' ? read.entries : [];
    expect(listed, 'no entry made up from unreadable text').toEqual([]);
  });
});
