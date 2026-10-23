// @vitest-environment node
// DATA-7 · Bounded to docs/ and git. The harness in trace.json is docs/trace/harness.json's, or null when the
// trail has none; nothing under .claude/ is read: not its agents, its settings, nor its copy of the privacy
// denylist. On the `bounded` and `complete` fixture trails, with a .claude/ planted after the replay.
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { filesUnder, readIn, replayTrail, run, SLOW, thrown, writeIn } from './support/trail';

// Text that exists only in the planted .claude/.
const SENTINEL = 'sentinel-from-dot-claude';

function plantDotClaude(root: string): void {
  writeIn(root, '.claude/agents/sentinel.md', `---\nname: ${SENTINEL}-agent\ndescription: An agent that exists only under .claude/.\ntools: Read\nskills: [${SENTINEL}-skill]\n---\n`);
  writeIn(root, '.claude/skills/sentinel/SKILL.md', `---\nname: ${SENTINEL}-skill\ndescription: A skill that exists only under .claude/.\n---\n`);
  writeIn(root, '.claude/hooks/sentinel-hook.mjs', `// ${SENTINEL}-hook\n`);
  writeIn(root, '.claude/settings.json', `${JSON.stringify({ note: SENTINEL, hooks: {} }, null, 1)}\n`);
}

describe('the harness comes from docs/trace/harness.json', () => {
  test("DATA-7 · trace.json's harness carries every field of docs/trace/harness.json as written", () => {
    const trail = replayTrail('bounded', plantDotClaude);
    try {
      const r = run(trail.root);
      expect(r.error, thrown(r)).toBeUndefined();
      const written = JSON.parse(readIn(trail.root, 'docs/trace/harness.json')) as Record<string, unknown>;
      expect(r.trace?.harness ?? null).toMatchObject(written);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test("DATA-7 · the harness's agents and skills are harness.json's alone, never the planted .claude/'s", () => {
    const trail = replayTrail('bounded', plantDotClaude);
    try {
      const r = run(trail.root);
      expect(r.error, thrown(r)).toBeUndefined();
      const harness = (r.trace?.harness ?? null) as { agents?: { name?: string }[]; skills?: { name?: string }[] } | null;
      expect(harness?.agents?.map((a) => a.name)).toEqual(['fixture-tester']);
      expect(harness?.skills?.map((s) => s.name)).toEqual(['fixture-skill']);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-7 · with no docs/trace/harness.json the harness is null, never read from .claude/', () => {
    const trail = replayTrail('complete', plantDotClaude);
    try {
      const r = run(trail.root);
      expect(r.error, thrown(r)).toBeUndefined();
      expect(r.trace && 'harness' in r.trace, 'trace.json has a harness field').toBe(true);
      expect(r.trace?.harness).toBeNull();
    } finally {
      trail.cleanup();
    }
  }, SLOW);
});

describe('nothing under .claude/ is read', () => {
  test('DATA-7 · nothing from a planted .claude/ reaches any file the compiler writes', () => {
    const trail = replayTrail('bounded', plantDotClaude);
    try {
      const r = run(trail.root);
      expect(r.error, thrown(r)).toBeUndefined();
      expect(r.written).toContain('src/Uinsure.Policies.Web/public/trace.json');
      const leaks = filesUnder(r.publicDir).filter((rel) => readFileSync(join(r.publicDir, rel), 'utf8').includes(SENTINEL));
      expect(leaks, 'written files holding text from .claude/').toEqual([]);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test("DATA-7 · the denylist under .claude/hooks/ is never read: a pattern only it holds refuses nothing", () => {
    // The plan title "Fixture build" is emitted; only the planted .claude/ copy refuses it.
    const trail = replayTrail('bounded', (root) => {
      plantDotClaude(root);
      writeIn(root, '.claude/hooks/privacy-denylist.txt', `${readIn(root, 'docs/trace/privacy-denylist.txt')}\nfixture build\n`);
    });
    try {
      const r = run(trail.root);
      expect(r.error, thrown(r)).toBeUndefined();
      expect(r.trace?.plans?.map((p) => p.title)).toEqual(['Fixture build']);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-7 · with no docs/trace/ denylist the compile fails, and never falls back to .claude/hooks/', () => {
    const trail = replayTrail('bounded', (root) => {
      plantDotClaude(root);
      writeIn(root, '.claude/hooks/privacy-denylist.txt', readIn(root, 'docs/trace/privacy-denylist.txt'));
      rmSync(join(root, 'docs/trace/privacy-denylist.txt'));
    });
    try {
      const r = run(trail.root);
      expect(r.problems, thrown(r)).toBeDefined();
      expect(r.problems?.map((p) => p.file)).toContain('docs/trace/privacy-denylist.txt');
      expect(r.written, 'no output from a list read under .claude/').toEqual([]);
    } finally {
      trail.cleanup();
    }
  }, SLOW);
});
