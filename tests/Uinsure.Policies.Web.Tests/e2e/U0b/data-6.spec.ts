// DATA-6 · The trail is read, never changed. The compiler is read-only over the repo and writes only its own output:
// src/Uinsure.Policies.Web/public/trace.json and the chunks under src/Uinsure.Policies.Web/public/trace/<plan>/<node>/. On the `complete` fixture trail.
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { compile, git, replayTrail, treeHashes } from './support/trail';

test('DATA-6 · compiling changes nothing it reads: the files, the index and the refs are as they were', () => {
  const trail = replayTrail('complete');
  try {
    const read = (): Record<string, string> => ({
      head: git(trail.root, 'rev-parse', 'HEAD'),
      branch: git(trail.root, 'symbolic-ref', 'HEAD'),
      refs: git(trail.root, 'for-each-ref'),
      index: git(trail.root, 'ls-files', '--stage'),
    });
    const before = { ...read(), tree: treeHashes(trail.root) };
    const run = compile(trail.root);
    expect(run.status, run.output).toBe(0);
    expect(run.trace, 'trace.json is written').not.toBeNull();
    const tree = Object.fromEntries(Object.entries(treeHashes(trail.root)).filter(([rel]) => !rel.startsWith('src/Uinsure.Policies.Web/public/')));
    expect({ ...read(), tree }).toEqual(before);
  } finally {
    trail.cleanup();
  }
});

test('DATA-6 · the compiler writes only trace.json and its chunks, run with write access to src/Uinsure.Policies.Web/public/ alone', () => {
  const trail = replayTrail('complete');
  try {
    // Node's permission model: any write outside src/Uinsure.Policies.Web/public/ is refused, and the run fails.
    const run = compile(trail.root, { permissions: { read: ['*'], write: [join(trail.root, 'src', 'Uinsure.Policies.Web', 'public', '*')] } });
    expect(run.status, run.output).toBe(0);
    expect(run.written).toContain('src/Uinsure.Policies.Web/public/trace.json');
    const strays = run.written.filter((rel) => !/^src\/Uinsure\.Policies\.Web\/public\/(trace\.json|trace\/[^/]+\/[^/]+\/(activity|diffs)\.json)$/.test(rel));
    expect(strays, 'nothing but trace.json and trace/<plan>/<node>/{activity,diffs}.json').toEqual([]);
  } finally {
    trail.cleanup();
  }
});
