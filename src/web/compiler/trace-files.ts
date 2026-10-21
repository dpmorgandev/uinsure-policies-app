// Reads the files the trace step writes after the loop (node README, walkthrough.md, requirements-matrix.md). The
// compiler reads what they say and does not re-derive it (DATA-4); a value they don't hold is null.

export interface MatrixRow {
  rule: string;
  plan: string | null;
  node: string | null;
  tests: { pass: number | null; total: number; raw: string } | null;
  red: string | null;
  green: string | null;
  refactor: string | null;
  qaStep: string | null;
  signoff: string | null;
  pr: string | null;
  source: { file: string; line: number };
}

const cell = (value: string | undefined): string | null => {
  const text = (value ?? '').trim();
  return text === '' || text === '—' ? null : text;
};

/** The matrix rows by rule ID; `not built yet` is no count, and `?` is a count with no pass figure. */
export function parseMatrix(file: string, source: string): Map<string, MatrixRow> {
  const rows = new Map<string, MatrixRow>();
  source.split(/\r?\n/).forEach((text, index) => {
    const cells = text.split('|').slice(1, -1).map((c) => c.trim());
    if (!/^[A-Z][A-Z0-9]*-\d+[a-z]?$/.test(cells[0] ?? '')) return;
    const count = /^(\d+|\?)\/(\d+)$/.exec(cells[2] ?? '');
    const [plan, node] = (cells[1] ?? '').split('/');
    rows.set(cells[0] ?? '', {
      rule: cells[0] ?? '',
      plan: node === undefined ? null : (plan ?? null),
      node: node ?? null,
      tests: count ? { pass: count[1] === '?' ? null : Number(count[1]), total: Number(count[2]), raw: count[0] } : null,
      red: cell(cells[3]), green: cell(cells[4]), refactor: cell(cells[5]),
      qaStep: cell(cells[6]), signoff: cell(cells[7]), pr: cell(cells[8]),
      source: { file, line: index + 1 },
    });
  });
  return rows;
}

/** Short SHA to its row number in a node's walkthrough. */
export function parseWalkthrough(source: string): Map<string, number> {
  const rows = new Map<string, number>();
  for (const text of source.split(/\r?\n/)) {
    const cells = text.split('|').slice(1, -1).map((c) => c.trim());
    if (/^\d+$/.test(cells[0] ?? '') && /^[0-9a-f]{7,40}$/.test(cells[1] ?? '')) rows.set(cells[1] ?? '', Number(cells[0]));
  }
  return rows;
}

/**
 * A README's "## Completeness": the label (`OK`, `OK (git-only, F0a)` or `TRAIL INCOMPLETE: …`) and its reasons as
 * written. An incomplete label's reasons are its `; `-separated parts; any other label's are the paragraphs after it.
 */
export function parseCompleteness(readme: string | null): { completeness: string | null; reasons: string[] } {
  const lines = (readme ?? '').split(/\r?\n/);
  const start = lines.indexOf('## Completeness');
  if (start < 0) return { completeness: null, reasons: [] };
  const end = lines.findIndex((line, i) => i > start && line.startsWith('## '));
  const body = lines.slice(start + 1, end < 0 ? undefined : end);
  const first = body.findIndex((line) => line.trim() !== '');
  if (first < 0) return { completeness: null, reasons: [] };
  const line = body[first] ?? '';
  const completeness = /→ `([^`]+)`/.exec(line)?.[1] ?? line.trim();
  if (completeness.startsWith('TRAIL INCOMPLETE: ')) {
    return { completeness, reasons: completeness.slice('TRAIL INCOMPLETE: '.length).split('; ') };
  }
  const reasons = body
    .slice(first + 1)
    .join('\n')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim().replace(/\s*\n\s*/g, ' '))
    .filter((paragraph) => paragraph !== '' && !paragraph.startsWith('Re-verify'));
  return { completeness, reasons };
}
