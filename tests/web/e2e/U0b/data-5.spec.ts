// DATA-5 · Privacy. The compiler fails the build if its output matches the privacy denylist, naming the file and
// line and never the matched text, with every hit listed; and it keeps the trail's own redactions (<user>,
// <outside-repo>) as they are. On the `privacy-hit` and `bounded` fixture trails.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { activityLines, compile, replayTrail, writeIn } from './support/trail';

// The two values privacy-hit/README.md describes, made from parts so that no file in this repo holds one: the
// pre-commit privacy scan would refuse it.
const TOKEN = ['gh', 'p_', 'FixtureTokenNotARealOne'.padEnd(36, '0')].join('');
const USER_PATH = ['C:', 'Users', 'fixture-person', 'notes.txt'].join('/');

function plantPrivacyHits(root: string): void {
  for (const [rel, placeholder, value] of [
    ['docs/trace/build/F1/activity.jsonl', '{{privacy-hit:token}}', TOKEN],
    ['docs/trace/build/F1/loop.jsonl', '{{privacy-hit:path}}', USER_PATH],
  ] as const) {
    const text = readFileSync(join(root, rel), 'utf8');
    expect(text, `the fixture holds ${placeholder}`).toContain(placeholder);
    writeIn(root, rel, text.replace(placeholder, value));
  }
}

/** "<file>:<line>", "<file> line <line>", "<file>#L<line>" and the like. */
function fileAndLine(file: string, line: number): RegExp {
  return new RegExp(`${file.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?::|#L?|,? (?:at )?line )${line}\\b`);
}

test('DATA-5 · a privacy-denylist match fails the compile, named by file and line, never by its text', () => {
  const trail = replayTrail('privacy-hit', plantPrivacyHits);
  try {
    const run = compile(trail.root);
    expect(run.status, run.output).toBe(1);
    expect(run.output).toMatch(fileAndLine('docs/trace/build/F1/activity.jsonl', 2));
    expect(run.output, 'the matched text is never printed').not.toContain('FixtureTokenNotARealOne');
    expect(run.output, 'the matched text is never printed').not.toContain('fixture-person');
    expect(run.written, 'a failed compile writes no trace.json and no chunk').toEqual([]);
  } finally {
    trail.cleanup();
  }
});

test('DATA-5 · every privacy hit is listed, not only the first', () => {
  const trail = replayTrail('privacy-hit', plantPrivacyHits);
  try {
    const run = compile(trail.root);
    expect(run.status, run.output).toBe(1);
    expect(run.output).toMatch(fileAndLine('docs/trace/build/F1/activity.jsonl', 2));
    expect(run.output).toMatch(fileAndLine('docs/trace/build/F1/loop.jsonl', 3));
  } finally {
    trail.cleanup();
  }
});

test("DATA-5 · the trail's own redactions, <user> and <outside-repo>, are kept as written", () => {
  const trail = replayTrail('bounded');
  try {
    const run = compile(trail.root);
    expect(run.status, run.output).toBe(0);
    const lines = activityLines(run, 'build', 'F1');
    expect(lines.map((l) => l.command)).toContain('node ~/AppData/Local/Temp/claude/C--Users-<user>-Documents-repo/scratch/probe.mjs');
    expect(lines.map((l) => l.file)).toContain('<outside-repo>');
  } finally {
    trail.cleanup();
  }
});
