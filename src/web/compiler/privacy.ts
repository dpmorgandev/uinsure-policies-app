// DATA-5: the privacy denylist. Format: '#' comment, blank ignored, '!' an allow pattern, any other line a deny
// pattern; POSIX ERE written so that JS RegExp agrees, matched case-insensitively.
import type { Problem } from './index.ts';

export interface Denylist {
  deny: RegExp[];
  allow: RegExp[];
}

export function parseDenylist(text: string, file: string): { list: Denylist; problems: Problem[] } {
  const list: Denylist = { deny: [], allow: [] };
  const problems: Problem[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (line.trim() === '' || line.startsWith('#')) return;
    const allowed = line.startsWith('!');
    try {
      (allowed ? list.allow : list.deny).push(new RegExp(allowed ? line.slice(1) : line, allowed ? 'i' : 'gi'));
    } catch {
      problems.push({ file, line: index + 1, reason: 'the denylist pattern is not a valid expression' });
    }
  });
  return { list, problems };
}

/** True when a deny pattern matches somewhere in the text that no allow pattern covers. */
export function isHit(list: Denylist, text: string): boolean {
  return list.deny.some((deny) =>
    [...text.matchAll(deny)].some((match) => !list.allow.some((allow) => allow.test(match[0]))),
  );
}

/** One problem per line that is a hit, naming the file and line and never the matched text. */
export function scan(list: Denylist, file: string, text: string): Problem[] {
  return text
    .split(/\r?\n/)
    .flatMap((line, index) => (isHit(list, line) ? [{ file, line: index + 1, reason: 'matches the privacy denylist' }] : []));
}
