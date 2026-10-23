import type { DiffFile, DiffLine } from '../../../kit';

const HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

/** The path a `diff --git a/<old> b/<new>` header names: the new side, as git writes it. */
function pathOf(header: string): string {
  const at = header.lastIndexOf(' b/');
  return at < 0 ? header.slice('diff --git '.length) : header.slice(at + 3);
}

/**
 * A commit's `git show` patch as the files it touches and each file's lines. Lines before a file's first hunk are git's
 * own headers (mode, index, ---, +++) and are not code; a file with no hunk (a binary, a mode change) keeps its path
 * and no lines.
 */
export function parsePatch(patch: string): DiffFile[] {
  const files: DiffFile[] = [];
  let lines: DiffLine[] | null = null;
  let inHunk = false;
  let oldNo = 0;
  let newNo = 0;
  for (const line of patch.split('\n')) {
    if (line.startsWith('diff --git ')) {
      lines = [];
      inHunk = false;
      files.push({ path: pathOf(line), lines });
      continue;
    }
    const hunk = HUNK.exec(line);
    if (hunk) {
      inHunk = true;
      oldNo = Number(hunk[1]);
      newNo = Number(hunk[2]);
      continue;
    }
    // Header lines only precede a hunk; inside one, every line starts with its marker.
    if (lines === null || !inHunk) continue;
    const text = line.slice(1);
    if (line.startsWith('+')) lines.push({ kind: 'add', text, newNo: newNo++ });
    else if (line.startsWith('-')) lines.push({ kind: 'del', text, oldNo: oldNo++ });
    else if (line.startsWith(' ')) lines.push({ kind: 'ctx', text, oldNo: oldNo++, newNo: newNo++ });
  }
  return files;
}
