// @vitest-environment node
// DATA-5 · Privacy. The compiler runs the denylist it reads from docs/trace/privacy-denylist.txt (the exact copy
// render-trace emits; every fixture's base carries one). What these tests prove it covers: the trail files it reads,
// each commit's subject, each commit's trailer values, and the ref it compiles. A hit fails the compile: the thrown
// CompileFailure lists every hit by its file and line (a trail file) or its commit (a value from git), never the
// matched text, and nothing is written. A ref that names no commit fails without repeating the ref. The list's
// format: '#' comment, blank ignored, '!' an allow pattern, any other line a deny pattern, matched
// case-insensitively. The trail's own redactions (<user>, <outside-repo>) are kept as written. On the
// `privacy-hit` fixture (its two placeholders sit on activity.jsonl line 2 and loop.jsonl line 3), `complete`
// and `bounded`.
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  ACTIVITY,
  activity,
  DENYLIST,
  git,
  locations,
  LOOP,
  placeHits,
  readIn,
  replayTrail,
  run,
  SLOW,
  thrown,
  TOKEN,
  writeIn,
} from './support/trail';
import type { Run } from './support/trail';

/** A path no denylist pattern refuses, for the placeholder a test doesn't use. */
const CLEAN_PATH = 'docs/requirements.md';

/** Everything a failed run says: the error's message and every problem. */
const said = (r: Run): string => `${r.error instanceof Error ? r.error.message : String(r.error)}\n${JSON.stringify(r.problems ?? [])}`;

describe('a denylist match fails the compile', () => {
  test('DATA-5 · a denylisted value fails the compile with one problem naming its file and line', () => {
    const trail = replayTrail('privacy-hit', (root) => placeHits(root, TOKEN, CLEAN_PATH));
    try {
      const r = run(trail.root);
      expect(r.problems, thrown(r)).toBeDefined();
      expect(locations(r.problems)).toEqual([`${ACTIVITY}:2`]);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-5 · every hit is listed, not only the first', () => {
    const trail = replayTrail('privacy-hit', (root) => placeHits(root));
    try {
      const r = run(trail.root);
      expect(r.problems, thrown(r)).toBeDefined();
      expect(locations(r.problems)).toEqual([`${ACTIVITY}:2`, `${LOOP}:3`]);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-5 · no problem and no message holds the matched text', () => {
    const trail = replayTrail('privacy-hit', (root) => placeHits(root));
    try {
      const r = run(trail.root);
      expect(r.problems?.length, thrown(r)).toBe(2);
      expect(said(r)).not.toContain('FixtureTokenNotARealOne');
      expect(said(r)).not.toContain('fixture-person');
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-5 · a failed compile writes no trace.json and no chunk', () => {
    const trail = replayTrail('privacy-hit', (root) => placeHits(root));
    try {
      const r = run(trail.root);
      expect(r.problems?.length, thrown(r)).toBe(2);
      expect(r.written).toEqual([]);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-5 · the match is case-insensitive: an upper-case token is a hit', () => {
    const trail = replayTrail('privacy-hit', (root) => placeHits(root, TOKEN.toUpperCase(), CLEAN_PATH));
    try {
      const r = run(trail.root);
      expect(r.problems, thrown(r)).toBeDefined();
      expect(locations(r.problems)).toEqual([`${ACTIVITY}:2`]);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-5 · a value from git, a commit subject, is scanned too', () => {
    // An address the denylist refuses, made from parts; no pattern allows it.
    const address = ['privacy-subject-person', 'mail-fixture.net'].join('@');
    const trail = replayTrail('privacy-hit', (root) => {
      placeHits(root, 'the qa script', CLEAN_PATH);
      git(root, 'commit', '-q', '--allow-empty', '-m', `docs(F1): ask ${address}`, '-m', 'Agent: main\nPlan: build\nNode: F1');
    });
    try {
      const r = run(trail.root);
      expect(r.problems?.length ?? 0, thrown(r)).toBeGreaterThan(0);
      expect(said(r)).not.toContain('privacy-subject-person');
      expect(r.written).toEqual([]);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-5 · the ref the compile names is scanned too', () => {
    // A branch named as an address the denylist refuses, made from parts: git refuses '@' only alone or before '{'.
    const address = ['privacy-ref-person', 'mail-fixture.net'].join('@');
    const trail = replayTrail('complete');
    try {
      git(trail.root, 'branch', address);
      const r = run(trail.root, { ref: address });
      expect(r.problems?.length ?? 0, thrown(r)).toBeGreaterThan(0);
      expect(said(r)).not.toContain('privacy-ref-person');
      expect(r.written).toEqual([]);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-5 · a ref that names no commit is not repeated in the failure', () => {
    // The denylist is read from the ref's own tree, so a ref that names nothing can't be scanned: it must not be said.
    const address = ['privacy-noref-person', 'mail-fixture.net'].join('@');
    const trail = replayTrail('complete');
    try {
      const r = run(trail.root, { ref: address });
      expect(r.problems?.length ?? 0, thrown(r)).toBeGreaterThan(0);
      expect(said(r)).not.toContain('privacy-noref-person');
      expect(r.written).toEqual([]);
    } finally {
      trail.cleanup();
    }
  }, SLOW);
});

describe("the denylist's format", () => {
  test('DATA-5 · a value an allow pattern covers is not a hit, and is kept as written', () => {
    const trail = replayTrail('privacy-hit', (root) => placeHits(root, 'noreply@anthropic.com', CLEAN_PATH));
    try {
      const r = run(trail.root);
      expect(r.error, thrown(r)).toBeUndefined();
      expect(activity(r, 'build', 'F1')?.map((l) => l.command)).toContain('echo noreply@anthropic.com');
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-5 · an address no allow pattern covers is a hit', () => {
    const trail = replayTrail('privacy-hit', (root) => placeHits(root, ['someone', 'fixture-mail.net'].join('@'), CLEAN_PATH));
    try {
      const r = run(trail.root);
      expect(r.problems, thrown(r)).toBeDefined();
      expect(locations(r.problems)).toEqual([`${ACTIVITY}:2`]);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-5 · comment and blank lines in the denylist are not patterns', () => {
    // As a pattern, '# Sell' would refuse the command below, and a blank line would refuse every value.
    const trail = replayTrail('privacy-hit', (root) => {
      writeIn(root, DENYLIST, `# Sell\n\n${readIn(root, DENYLIST)}`);
      placeHits(root, '# Sell', CLEAN_PATH);
    });
    try {
      const r = run(trail.root);
      expect(r.error, thrown(r)).toBeUndefined();
      expect(activity(r, 'build', 'F1')?.map((l) => l.command)).toContain('echo # Sell');
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-5 · a denylist with CRLF line ends still refuses its patterns', () => {
    const trail = replayTrail('privacy-hit', (root) => {
      writeIn(root, DENYLIST, readIn(root, DENYLIST).replace(/\r?\n/g, '\r\n'));
      placeHits(root, TOKEN, CLEAN_PATH);
    });
    try {
      const r = run(trail.root);
      expect(r.problems, thrown(r)).toBeDefined();
      expect(locations(r.problems)).toEqual([`${ACTIVITY}:2`]);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-5 · a pattern added to docs/trace/privacy-denylist.txt refuses a value nothing else refuses', () => {
    const trail = replayTrail('privacy-hit', (root) => {
      writeIn(root, DENYLIST, `${readIn(root, DENYLIST)}\nsell-[0-9]{4}-private\n`);
      placeHits(root, 'sell-2026-private', CLEAN_PATH);
    });
    try {
      const r = run(trail.root);
      expect(r.problems, thrown(r)).toBeDefined();
      expect(locations(r.problems)).toEqual([`${ACTIVITY}:2`]);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-5 · with no docs/trace/privacy-denylist.txt the compile fails, naming the missing list, and writes nothing', () => {
    const trail = replayTrail('complete', (root) => rmSync(join(root, DENYLIST)));
    try {
      const r = run(trail.root);
      expect(r.problems, thrown(r)).toBeDefined();
      expect(r.problems?.map((p) => p.file)).toContain(DENYLIST);
      expect(r.written).toEqual([]);
    } finally {
      trail.cleanup();
    }
  }, SLOW);
});

describe("the trail's own redactions", () => {
  test('DATA-5 · <user> in a command is kept exactly as written', () => {
    const trail = replayTrail('bounded');
    try {
      const r = run(trail.root);
      expect(r.error, thrown(r)).toBeUndefined();
      expect(activity(r, 'build', 'F1')?.[1]?.command).toBe('node ~/AppData/Local/Temp/claude/C--Users-<user>-Documents-repo/scratch/probe.mjs');
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-5 · <outside-repo> as a file is kept exactly as written', () => {
    const trail = replayTrail('bounded');
    try {
      const r = run(trail.root);
      expect(r.error, thrown(r)).toBeUndefined();
      expect(activity(r, 'build', 'F1')?.[2]?.file).toBe('<outside-repo>');
    } finally {
      trail.cleanup();
    }
  }, SLOW);
});
