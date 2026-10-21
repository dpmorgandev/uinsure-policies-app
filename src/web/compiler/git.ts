// Reads git at one ref. Every call here is read-only (rev-parse, ls-tree, cat-file, log): DATA-6.
import { execFileSync } from 'node:child_process';

export interface GitCommit {
  sha: string;
  subject: string;
  trailers: Record<string, string>;
}

const git = (root: string, args: string[]): string =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });

/** The full SHA of the commit a ref names, or null when it names none. */
export function resolveRef(root: string, ref: string): string | null {
  if (ref.startsWith('-')) return null;
  try {
    return git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]).trim();
  } catch (error) {
    // `--verify --quiet` exits 1 for a ref that names nothing; any other failure is a real one.
    if ((error as { status?: number }).status === 1) return null;
    throw error;
  }
}

/** Every path under docs/ at the commit. */
export function listDocs(root: string, sha: string): string[] {
  return git(root, ['ls-tree', '-r', '-z', '--name-only', sha, '--', 'docs']).split('\0').filter(Boolean);
}

export function readBlob(root: string, sha: string, path: string): string {
  return git(root, ['cat-file', 'blob', `${sha}:${path}`]);
}

/** A trailer block is the last paragraph, when every one of its lines is `Key: value`. */
function trailersOf(body: string): Record<string, string> {
  const paragraphs = body.trim().split(/\n\s*\n/);
  const lines = (paragraphs[paragraphs.length - 1] ?? '').split('\n').filter((line) => line.trim() !== '');
  const pairs = lines.map((line) => /^([A-Za-z][A-Za-z-]*):\s*(.*)$/.exec(line.trim()));
  if (lines.length === 0 || pairs.some((pair) => pair === null)) return {};
  return Object.fromEntries(pairs.map((pair) => [pair?.[1] ?? '', pair?.[2]?.trim() ?? '']));
}

/** Every commit reachable from the commit, oldest first. */
export function readCommits(root: string, sha: string): GitCommit[] {
  const log = git(root, ['log', '--reverse', '--format=%H%x1f%s%x1f%b%x1e', sha]);
  return log
    .split('\x1e')
    .map((record) => record.replace(/^\n/, ''))
    .filter((record) => record.trim() !== '')
    .map((record) => {
      const [commit = '', subject = '', body = ''] = record.split('\x1f');
      return { sha: commit, subject, trailers: trailersOf(body) };
    });
}
