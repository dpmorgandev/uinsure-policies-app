// A workbench screen in jsdom, reached the way a person reaches it: the app's own router root (App, hash routing)
// at the screen's route, so the screen gets its route params from the route table the app registers.
// jsdom has no matchMedia, which the frame's theme reads (THEME-1): a stub answers "not dark". The frame's own
// trace.json read gets a 404 from the test's fetch, which leaves the workbench screen as it is.
import { readFileSync } from 'node:fs';
import { URL as NodeURL, fileURLToPath } from 'node:url';
import { render } from '@testing-library/react';
import { expect, vi } from 'vitest';
import { App } from '../../../../../src/Uinsure.Policies.Web/app/shell/App';
import type { RecordedExchange } from '../../client/support/recorded';

// jsdom replaces the global URL, which node's fileURLToPath refuses, so the fixture's path is built with node's own.
const recordedDir = fileURLToPath(new NodeURL('../../../../../docs/ui/fixture/api/', import.meta.url));

/** The `n`th exchange of a recording in docs/ui/fixture/api/, in the order it was recorded. */
export function recordedExchange(file: string, n: number): RecordedExchange {
  const recording = JSON.parse(readFileSync(recordedDir + file, 'utf8')) as { exchanges: RecordedExchange[] };
  const found = recording.exchanges[n];
  expect(found, `fixture setup: ${file} has an exchange ${n}`).toBeDefined();
  return found as RecordedExchange;
}

function quietMedia(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  };
}

/** Renders the app at `#/<route>`. Call vi.unstubAllGlobals() after each test. */
export function renderAppAt(route: string): void {
  vi.stubGlobal('matchMedia', quietMedia);
  window.location.hash = `#/${route}`;
  render(<App />);
}

/** What the test's fetch answers for anything that isn't the API: the frame's trace.json read. */
export function notFound(): Response {
  return new Response('not found', { status: 404, headers: { 'content-type': 'text/plain' } });
}
