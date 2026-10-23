// @vitest-environment node
// RULE-3 · Diffs. The rule's red and green commits show their diffs (from the node packet's diff.patch or git). U2's
// acceptance: a commit shows its diff, loaded when asked. The compiler writes each node's commits' diffs to a lazy
// chunk of its own, trace/<plan>/<node>/diffs.json, named by nodes[*].chunks.diffs (trace-data skill; PERF-1), each
// entry { sha, patch } as the design fixture's docs/ui/fixture/trace/<plan>/<node>/diffs.json holds it. On U1's `rules`
// fixture trail (rules/README.md): SELL-1's red c2 adds tests/web/e2e/F1/sell.spec.ts and its green c4 adds
// src/sell.txt ("the sale"); GET-1's green c11 adds src/get.txt ("the retrieve"); F3 has no commit. On the
// `in-flight` fixture (in-flight/README.md): the stub c3 replaces src/sell.txt's one line.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { replayTrail, run, SLOW, thrown } from './support/trail';
import type { Run, Trail } from './support/trail';
import { commitByShort, ruleOf, RULES } from './support/rules';
import { changesOf, diffsOf, filesOf, IN_FLIGHT, idOf, nodeIn, patchOf } from './support/plans';

describe('on the rules fixture', () => {
  let trail: Trail;
  let r: Run;
  beforeAll(() => {
    trail = replayTrail(RULES);
    r = run(trail.root);
  }, SLOW);
  afterAll(() => trail?.cleanup());

  test('RULE-3 · each node with commits names its own diffs chunk, F1 and F2 theirs, and F3, with none, names none', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(['F1', 'F2', 'F3'].map((id) => [id, nodeIn(r, 'build', id)?.chunks?.diffs ?? null])).toEqual([
      ['F1', 'trace/build/F1/diffs.json'],
      ['F2', 'trace/build/F2/diffs.json'],
      ['F3', null],
    ]);
  });

  test('RULE-3 · the diffs load when asked: F1\'s chunk is written beside trace.json, and trace.json holds no patch', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(r.written).toContain('src/Uinsure.Policies.Web/public/trace/build/F1/diffs.json');
    expect(readFileSync(join(r.publicDir, 'trace.json'), 'utf8')).not.toContain('diff --git');
  });

  test("RULE-3 · SELL-1's red and green commits, c2 and c4, each have their diff in the chunk of the node they belong to", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    // From the rule to its commits (rules[*].red and green, the matrix's short SHAs), to each commit's node, to its chunk.
    const rule = ruleOf(r, 'SELL-1');
    const shown = [...(rule?.red ?? []), ...(rule?.green ?? [])].map((short) => {
      const commit = commitByShort(r, short);
      const id = idOf(trail, commit?.sha);
      return [id, commit?.node ?? null, filesOf(patchOf(r, trail, commit?.plan ?? '', commit?.node ?? '', id)).length > 0];
    });
    expect(shown).toEqual([
      ['c2', 'F1', true],
      ['c4', 'F1', true],
    ]);
  });

  test("RULE-3 · SELL-1's green, c4, adds src/sell.txt with its one line, 'the sale'", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const patch = patchOf(r, trail, 'build', 'F1', 'c4');
    expect(filesOf(patch)).toEqual(['src/sell.txt']);
    expect(changesOf(patch)).toEqual(['+the sale']);
  });

  test("RULE-3 · SELL-1's red, c2, adds tests/web/e2e/F1/sell.spec.ts, every line added, the SELL-1 title among them", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const patch = patchOf(r, trail, 'build', 'F1', 'c2');
    expect(filesOf(patch)).toEqual(['tests/web/e2e/F1/sell.spec.ts']);
    const changes = changesOf(patch);
    expect(changes.length, 'the file has lines').toBeGreaterThan(0);
    expect(changes.filter((line) => !line.startsWith('+')), 'a new file: no line removed').toEqual([]);
    expect(changes.join('\n')).toContain('a sale with a new reference answers 201');
  });

  test("RULE-3 · GET-1's green, c11, has its diff in F2's chunk: src/get.txt with 'the retrieve' added", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const patch = patchOf(r, trail, 'build', 'F2', 'c11');
    expect(filesOf(patch)).toEqual(['src/get.txt']);
    expect(changesOf(patch)).toEqual(['+the retrieve']);
  });

  test("RULE-3 · a node's diffs chunk holds its own commits only: F2's holds c11 and c12 and none of F1's", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const ids = (diffsOf(r, 'build', 'F2') ?? []).map((entry) => idOf(trail, entry.sha));
    expect(ids, "F2's chunk is written").toEqual(expect.arrayContaining(['c11', 'c12']));
    expect(ids.filter((id) => !['c10', 'c11', 'c12'].includes(id)), 'no commit of another node').toEqual([]);
  });
});

describe('on the in-flight fixture', () => {
  let trail: Trail;
  let r: Run;
  beforeAll(() => {
    trail = replayTrail(IN_FLIGHT);
    r = run(trail.root);
  }, SLOW);
  afterAll(() => trail?.cleanup());

  test("RULE-3 · the stub c3 of a node in flight has its diff: src/sell.txt's one line removed, then its replacement added", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const chunk = nodeIn(r, 'build', 'F1')?.chunks?.diffs ?? null;
    expect(chunk !== null && existsSync(join(r.publicDir, chunk)), "F1's diffs chunk is named and written").toBe(true);
    const patch = patchOf(r, trail, 'build', 'F1', 'c3');
    expect(filesOf(patch)).toEqual(['src/sell.txt']);
    expect(changesOf(patch)).toEqual(['-the sale is not implemented', '+the canned sale']);
  });
});
