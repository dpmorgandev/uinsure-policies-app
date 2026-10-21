// Replays a fixture trail into a fresh git repo (web-testing.spec C3; the form is in README.md beside this).
// The base becomes origin/main; each commit in commits.json is made on feature/<plan>/<node> with its
// trailers; then the trail files are written, uncommitted, as at the trace step. {{cN}} and {{cN:7}} in any
// file become commit cN's SHA. A path ending .fixture loses the suffix, so the repo's own rule-tag walker
// never counts a fixture's test titles.
//
//   import { replay } from './replay.mjs';  const { root, shas } = replay('<fixture dir>', '<empty dir>');
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const files = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : [join(dir, n)]));
const fill = (text, shas) => text.replace(/\{\{(c\d+)(?::(\d+))?\}\}/g, (m, id, n) => {
  if (!shas[id]) throw new Error(`placeholder ${m} names a commit that isn't made yet`);
  return n ? shas[id].slice(0, Number(n)) : shas[id];
});

function place(from, root, rel, shas) {
  const to = join(root, rel.replace(/\.fixture$/, ''));
  mkdirSync(dirname(to), { recursive: true });
  // LF always: a Windows checkout gives the fixture CRLF, and the trail it stands for is LF.
  writeFileSync(to, fill(readFileSync(from, 'utf8').replace(/\r\n/g, '\n'), shas));
}

const placeAll = (dir, root, shas) => {
  for (const f of files(dir)) place(f, root, relative(dir, f).replace(/\\/g, '/'), shas);
};

export function replay(fixture, root, { trail = true } = {}) {
  const spec = JSON.parse(readFileSync(join(fixture, 'commits.json'), 'utf8'));
  // A commit may carry its own `date`; every other git call, and a commit without one, is at the fixture's `date`.
  const gitAt = (date, a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } }).trim();
  const git = (...a) => gitAt(spec.date, a);
  mkdirSync(root, { recursive: true });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'fixture@example.com');
  git('config', 'user.name', 'Fixture');
  git('config', 'core.autocrlf', 'false');
  placeAll(join(fixture, 'base'), root, {});
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  git('update-ref', 'refs/remotes/origin/main', 'HEAD');
  git('checkout', '-q', '-b', spec.branch);
  const shas = {};
  for (const c of spec.commits) {
    for (const rel of c.files) place(join(fixture, 'files', rel), root, rel, shas);
    git('add', '-A');
    const trailers = Object.entries(c.trailers).map(([k, v]) => `${k}: ${v}`).join('\n');
    gitAt(c.date ?? spec.date, ['commit', '-q', '--allow-empty', '-m', c.subject, '-m', trailers]);
    shas[c.id] = git('rev-parse', 'HEAD');
  }
  if (trail && existsSync(join(fixture, 'trail'))) placeAll(join(fixture, 'trail'), root, shas);
  return { root, shas };
}
