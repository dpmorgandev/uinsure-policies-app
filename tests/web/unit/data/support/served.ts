// The trace.json loader's unit tests: a fixture trail is replayed and compiled (by the trail compiler, in process),
// and its src/web/public/ is served to the loader through a recording fetch, as the static host serves it beside
// the app. A test may answer a path with its own body (a changed trace.json, a broken chunk) or with a 404.
// Nothing here throws when the loader fails: `settle` turns a throw into a failed assertion.
import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { expect } from 'vitest';
import type { Fetch } from '../../../../../src/web/app/data/trace';
import { replayTrail, run, thrown } from '../../compiler/support/trail';
import type { Run, Trail } from '../../compiler/support/trail';

/** Where the app is served from: the build's base is './', so the loader reads relative to this. */
export const BASE = 'http://docket.test/app/';

export interface Compiled {
  trail: Trail;
  run: Run;
  /** trace.json as the compiler wrote it, parsed: a test changes a copy. */
  trace: Record<string, unknown>;
}

/** Replays and compiles a fixture trail; fails, as an assertion, when the compiler does not write trace.json. */
export function compileFixture(name: string): Compiled {
  const trail = replayTrail(name);
  const r = run(trail.root);
  expect(r.error, `fixture setup: ${thrown(r)}`).toBeUndefined();
  expect(r.trace, 'fixture setup: the compiler wrote trace.json').not.toBeNull();
  return { trail, run: r, trace: r.trace as Record<string, unknown> };
}

/** A deep copy of the compiled trace.json, changed by `change`, as the body a test serves. */
export function changed(trace: Record<string, unknown>, change: (copy: Record<string, unknown>) => void): string {
  const copy = JSON.parse(JSON.stringify(trace)) as Record<string, unknown>;
  change(copy);
  return JSON.stringify(copy);
}

export interface Served {
  fetch: Fetch;
  /** Every URL the loader asked for, resolved against BASE, in order. */
  requested: string[];
  /** The same, as paths relative to BASE (a URL outside it stays absolute). */
  paths(): string[];
}

/**
 * Serves `publicDir` at BASE. `answers` maps a BASE-relative path to the body to send instead of the file, or to
 * null for a 404. Anything outside BASE, or not a file under publicDir, is a 404.
 */
export function serve(publicDir: string, answers: Record<string, string | null> = {}): Served {
  const requested: string[] = [];
  const root = resolve(publicDir);
  const fetch: Fetch = async (input) => {
    const url = new URL(String(input), BASE);
    requested.push(url.href);
    const notFound = (): Response => new Response('not found', { status: 404, headers: { 'content-type': 'text/plain' } });
    if (!url.href.startsWith(BASE)) return notFound();
    const rel = decodeURIComponent(url.href.slice(BASE.length).replace(/[?#].*$/, ''));
    if (rel in answers) {
      const body = answers[rel];
      return body === null || body === undefined ? notFound() : new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
    }
    const file = resolve(root, rel);
    if (!file.startsWith(root + sep) || !existsSync(file)) return notFound();
    return new Response(readFileSync(file), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return {
    fetch,
    requested,
    paths: () => requested.map((href) => (href.startsWith(BASE) ? href.slice(BASE.length) : href)),
  };
}

/** Awaits a loader call; a throw or a rejection fails the test as an assertion that names it. */
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
  const said = error instanceof Error ? error.message : String(error);
  expect(threw, `the loader settles to a result, never a throw (it threw: ${said})`).toBe(false);
  return value as T;
}
