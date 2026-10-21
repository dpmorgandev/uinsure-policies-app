// @vitest-environment node
// DATA-3 · Compiled-at stamp. trace.json's compiledAt records the ref as given, the full SHA of the commit it
// resolves to, and the UTC time of the compile (the injected clock, never a commit's date). On the `complete`
// fixture trail: HEAD is the committed trail, HEAD~1 is c4 (complete/README.md).
import { describe, expect, test } from 'vitest';
import { NOW, replayTrail, run, SLOW, thrown } from './support/trail';

const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const FULL_SHA = /^[0-9a-f]{40}$/;

describe('compiledAt', () => {
  test('DATA-3 · compiledAt records the ref as given and the full SHA it resolves to', () => {
    const trail = replayTrail('complete');
    try {
      const r = run(trail.root, { ref: 'HEAD' });
      expect(r.error, thrown(r)).toBeUndefined();
      expect(r.trace?.compiledAt?.ref).toBe('HEAD');
      expect(r.trace?.compiledAt?.sha).toMatch(FULL_SHA);
      expect(r.trace?.compiledAt?.sha).toBe(trail.head);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test("DATA-3 · compiledAt.utc is the compile's own time, in UTC with a Z", () => {
    const trail = replayTrail('complete');
    try {
      const r = run(trail.root, { now: NOW });
      expect(r.error, thrown(r)).toBeUndefined();
      const utc = r.trace?.compiledAt?.utc ?? '(none)';
      expect(utc).toMatch(UTC);
      expect(Date.parse(utc), `${utc} is the compile time ${NOW.toISOString()}`).toBe(NOW.getTime());
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test("DATA-3 · compiledAt.utc is not the stamped commit's date", () => {
    const trail = replayTrail('complete');
    try {
      const at = new Date(Date.UTC(2027, 0, 2, 3, 4, 5, 0));
      const r = run(trail.root, { now: at });
      expect(r.error, thrown(r)).toBeUndefined();
      const utc = r.trace?.compiledAt?.utc ?? '(none)';
      // Every fixture commit is dated 2026-10-18.
      expect(utc.startsWith('2026-10-18'), `${utc} is a commit date`).toBe(false);
      expect(Date.parse(utc)).toBe(at.getTime());
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test("DATA-3 · compiling at an earlier ref stamps that ref's commit, not HEAD's", () => {
    const trail = replayTrail('complete');
    try {
      const r = run(trail.root, { ref: 'HEAD~1' });
      expect(r.error, thrown(r)).toBeUndefined();
      expect(r.trace?.compiledAt?.ref).toBe('HEAD~1');
      expect(r.trace?.compiledAt?.sha).toBe(trail.shas['c4']);
      expect(r.trace?.compiledAt?.sha).not.toBe(trail.head);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-3 · a short SHA as the ref is kept as given, and stamped with the full SHA it names', () => {
    const trail = replayTrail('complete');
    try {
      const c3 = trail.shas['c3'] ?? '(no c3)';
      const r = run(trail.root, { ref: c3.slice(0, 7) });
      expect(r.error, thrown(r)).toBeUndefined();
      expect(r.trace?.compiledAt?.ref).toBe(c3.slice(0, 7));
      expect(r.trace?.compiledAt?.sha).toBe(c3);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-3 · a ref that names no commit fails the compile with a problem naming it, and stamps nothing', () => {
    const trail = replayTrail('complete');
    try {
      const r = run(trail.root, { ref: 'no-such-ref' });
      expect(r.problems, thrown(r)).toBeDefined();
      expect(r.problems?.some((p) => p.reason.includes('no-such-ref')), JSON.stringify(r.problems)).toBe(true);
      expect(r.written, 'no trace.json carries a stamp it could not resolve').toEqual([]);
    } finally {
      trail.cleanup();
    }
  }, SLOW);
});
