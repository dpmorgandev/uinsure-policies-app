// @vitest-environment node
// DATA-6 · The trail is read, never changed. A compile, clean or failed, leaves every file outside its output
// and all of .git/ byte for byte as they were, and keeps any file already in src/Uinsure.Policies.Web/public/ that isn't its own.
// On the `complete` and `privacy-hit` fixture trails.
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { git, hashes, placeHits, readIn, replayTrail, run, SLOW, thrown, writeIn } from './support/trail';

/** Every work-tree file but .git/ and the compiler's output directory, with its hash. */
const readTree = (root: string): Record<string, string> => hashes(root, (rel) => rel === '.git' || rel === 'src/Uinsure.Policies.Web/public');
/** Every file under .git/, with its hash: refs, the index, objects, config. */
const readGitDir = (root: string): Record<string, string> => hashes(join(root, '.git'));

describe('a compile changes nothing it reads', () => {
  test('DATA-6 · a clean compile leaves every work-tree file outside src/Uinsure.Policies.Web/public/ as it was, and adds none', () => {
    const trail = replayTrail('complete');
    try {
      const before = readTree(trail.root);
      const r = run(trail.root);
      expect(r.error, thrown(r)).toBeUndefined();
      expect(r.trace, 'trace.json is written').not.toBeNull();
      expect(readTree(trail.root)).toEqual(before);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-6 · a clean compile leaves .git/ byte for byte as it was: no ref, index, object or config written', () => {
    const trail = replayTrail('complete');
    try {
      const before = readGitDir(trail.root);
      const r = run(trail.root);
      expect(r.error, thrown(r)).toBeUndefined();
      expect(r.trace, 'trace.json is written').not.toBeNull();
      expect(readGitDir(trail.root)).toEqual(before);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-6 · compiling at an earlier ref checks nothing out: HEAD, the branch and the work tree stay', () => {
    const trail = replayTrail('complete');
    try {
      const branch = git(trail.root, 'symbolic-ref', 'HEAD');
      const before = readTree(trail.root);
      const r = run(trail.root, { ref: 'HEAD~2' });
      expect(r.error, thrown(r)).toBeUndefined();
      expect(r.trace?.compiledAt?.sha).toBe(trail.shas['c3']);
      expect(git(trail.root, 'rev-parse', 'HEAD')).toBe(trail.head);
      expect(git(trail.root, 'symbolic-ref', 'HEAD')).toBe(branch);
      expect(readTree(trail.root)).toEqual(before);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-6 · a file already in src/Uinsure.Policies.Web/public/ that is not its output is kept as it was', () => {
    const icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>\n';
    const trail = replayTrail('complete', (root) => writeIn(root, 'src/Uinsure.Policies.Web/public/favicon.svg', icon));
    try {
      const r = run(trail.root);
      expect(r.error, thrown(r)).toBeUndefined();
      expect(r.written).toContain('src/Uinsure.Policies.Web/public/trace.json');
      expect(r.written).toContain('src/Uinsure.Policies.Web/public/favicon.svg');
      expect(readIn(trail.root, 'src/Uinsure.Policies.Web/public/favicon.svg')).toBe(icon);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-6 · a failed compile changes nothing either: the work tree and .git/ stay as they were', () => {
    const trail = replayTrail('privacy-hit', (root) => placeHits(root));
    try {
      const tree = readTree(trail.root);
      const gitDir = readGitDir(trail.root);
      const r = run(trail.root);
      expect(r.problems?.length, thrown(r)).toBe(2);
      expect(readTree(trail.root)).toEqual(tree);
      expect(readGitDir(trail.root)).toEqual(gitDir);
    } finally {
      trail.cleanup();
    }
  }, SLOW);
});
