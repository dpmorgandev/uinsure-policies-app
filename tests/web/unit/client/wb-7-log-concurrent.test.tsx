// WB-7 · the workbench's request log (src/web/app/workbench/browser.ts) keeps the exact response of an exchange
// even when another exchange is sent and answered while the first one's body is still being read (U8 A1 I1).
// loggingFetch sets an exchange's status before it reads the body; a publish() from another exchange in that gap
// must not leave the log the page reads holding a copy with the status but no body.
// The fetch is a stub: exchange A's body is a stream this test holds open, exchange B answers at once.
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { browserDeps, useRequestLog } from '../../../../src/web/app/workbench/browser';
import type { LoggedExchange } from '../../../../src/web/app/data/api';

const A_PATH = '/api/policies/U8RACE-A';
const B_PATH = '/api/policies/U8RACE-B';
const A_BODY = '{"reference":"U8RACE-A","status":"Active"}';
const B_BODY = '{"reference":"U8RACE-B","status":"Active"}';

let latest: readonly LoggedExchange[] = [];

function Probe() {
  latest = useRequestLog();
  return null;
}

/** Lets every promise already settled run its continuations: one turn of the event loop, nothing left running. */
const nextTurn = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("WB-7 · an exchange answered while another's body is still being read keeps its exact response body in the log", async () => {
  let releaseA: ((text: string) => void) | null = null;
  const aBody = new ReadableStream<Uint8Array>({
    start(controller) {
      releaseA = (text) => {
        controller.enqueue(new TextEncoder().encode(text));
        controller.close();
      };
    },
  });
  const json = { 'content-type': 'application/json' };
  vi.stubGlobal('fetch', (input: string) =>
    Promise.resolve(input === A_PATH ? new Response(aBody, { status: 200, headers: json }) : new Response(B_BODY, { status: 200, headers: json })),
  );
  render(<Probe />);
  const deps = browserDeps();

  let sendingA: Promise<Response> | null = null;
  await act(async () => {
    sendingA = deps.fetch(A_PATH);
    await nextTurn();
  });
  expect(releaseA, 'setup: exchange A answered with a body the test holds open').not.toBeNull();

  // B is sent and answered while A has its status but A's body is still unread.
  await act(async () => {
    await deps.fetch(B_PATH);
  });

  await act(async () => {
    (releaseA as unknown as (text: string) => void)(A_BODY);
    await sendingA;
    await nextTurn();
  });

  const a = latest.find((entry) => entry.path === A_PATH);
  const b = latest.find((entry) => entry.path === B_PATH);
  expect(b?.responseBody, 'setup: exchange B is logged with its body').toBe(B_BODY);
  expect(a?.status, 'exchange A is logged with its status').toBe(200);
  expect(a?.responseBody, "exchange A's log entry holds the exact body it was answered with").toBe(A_BODY);
});
