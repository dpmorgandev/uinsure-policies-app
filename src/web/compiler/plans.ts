// Reads the plan DAG (docs/plans/*/<plan>.dag.yaml) and the requirement tables. Only the shapes those files hold:
// top-level scalars, and under `nodes:` one `- id:` item with scalar and `[a, b]` fields. Nested lists (tasks,
// acceptance) are skipped.

export interface DagNode {
  id: string;
  title: string | null;
  owner: string | null;
  status: string | null;
  attempt: number | null;
  rules: string[];
}

export interface Dag {
  id: string | null;
  kind: string | null;
  title: string | null;
  nodes: DagNode[];
}

export interface Requirement {
  id: string;
  title: string | null;
  feature: string | null;
  priority: string | null;
  interpretation: string | null;
  /** The row's line in its file, counting from 1. */
  line: number;
}

type Scalar = string | number | null | string[];

function scalar(raw: string): Scalar {
  const value = raw.trim();
  if (value === '' || value === 'null') return null;
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1).split(',').map((item) => item.trim()).filter(Boolean);
  }
  if (/^(["']).*\1$/.test(value)) return value.slice(1, -1);
  return /^\d+$/.test(value) ? Number(value) : value;
}

const text = (value: Scalar | undefined): string | null => (typeof value === 'string' ? value : null);

export function parseDag(source: string): Dag {
  const top: Record<string, Scalar> = {};
  const items: Record<string, Scalar>[] = [];
  let inNodes = false;
  for (const line of source.split(/\r?\n/)) {
    const item = /^ {2}- (\w+):(.*)$/.exec(line);
    const field = /^ {4}(\w+):(.*)$/.exec(line);
    if (line === 'nodes:') inNodes = true;
    else if (!inNodes) {
      const entry = /^(\w+):(.*)$/.exec(line);
      if (entry) top[entry[1] ?? ''] = scalar(entry[2] ?? '');
    } else if (item) items.push({ [item[1] ?? '']: scalar(item[2] ?? '') });
    else if (field && items.length > 0) (items[items.length - 1] as Record<string, Scalar>)[field[1] ?? ''] = scalar(field[2] ?? '');
  }
  return {
    id: text(top['plan_id']),
    kind: text(top['kind']),
    title: text(top['title']),
    nodes: items.map((node) => ({
      id: text(node['id']) ?? '',
      title: text(node['title']),
      owner: text(node['owner']),
      status: text(node['status']),
      attempt: typeof node['attempt'] === 'number' ? node['attempt'] : null,
      rules: Array.isArray(node['rules']) ? node['rules'] : [],
    })),
  };
}

/**
 * The rule rows of a requirements table: `| ID | Rule | Agreed interpretation |` under `### Sell (MUST-1)`, or
 * `| ID | Priority | Requirement | Draft interpretation |` under a heading with no tag. The feature is the heading's
 * name; the priority is the heading's tag without its number, or the Priority column. A cell the file lacks is null.
 */
export function parseRequirements(source: string): Requirement[] {
  const found: Requirement[] = [];
  let feature: string | null = null;
  let tag: string | null = null;
  let columns = { title: -1, priority: -1 };
  source.split(/\r?\n/).forEach((text, index) => {
    const heading = /^###\s+(.*?)(?:\s+\(([A-Z]+)-\d+\))?\s*$/.exec(text);
    if (heading) {
      feature = heading[1] ?? null;
      tag = heading[2] ?? null;
      return;
    }
    if (!text.startsWith('|')) return;
    const cells = text.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells[0] === 'ID') {
      columns = { title: cells.findIndex((c) => ['Title', 'Rule', 'Requirement'].includes(c)), priority: cells.indexOf('Priority') };
    } else if (/^[A-Z][A-Z0-9]*-\d+[a-z]?(\/\d+)?$/.test(cells[0] ?? '')) {
      found.push({
        id: cells[0] ?? '',
        title: columns.title >= 0 ? (cells[columns.title] ?? null) : null,
        feature,
        priority: columns.priority >= 0 ? (cells[columns.priority] ?? null) : tag,
        interpretation: cells.length > 1 ? (cells[cells.length - 1] ?? null) : null,
        line: index + 1,
      });
    }
  });
  return found;
}

/** A slash rule's parts, as the API's RuleCoverage expands it: `RENEW-1/2` is `RENEW-1` and `RENEW-2`. */
export function partsOf(id: string): string[] {
  const slash = id.indexOf('/');
  if (slash < 0) return [id];
  return [id.slice(0, slash), id.slice(0, id.lastIndexOf('-', slash) + 1) + id.slice(slash + 1)];
}

/** The `key: value` lines between a file's leading `---` fences, and the text after them. No fence: no frontmatter. */
export function splitFrontmatter(source: string): { frontmatter: Record<string, Scalar> | null; body: string } {
  const fenced = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/.exec(source);
  if (fenced === null) return { frontmatter: null, body: source };
  const frontmatter: Record<string, Scalar> = {};
  for (const line of (fenced[1] ?? '').split(/\r?\n/)) {
    const entry = /^(\w+):(.*)$/.exec(line);
    if (entry) frontmatter[entry[1] ?? ''] = scalar(entry[2] ?? '');
  }
  return { frontmatter, body: fenced[2] ?? '' };
}

/** The text under a `## <heading>` line, up to the next `##` heading, trimmed; null when the file has no such section. */
export function sectionOf(source: string, heading: string): string | null {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start < 0) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('## '));
  return (end < 0 ? rest : rest.slice(0, end)).join('\n').trim();
}

export interface RootCause {
  symptom: string | null;
  cause: string | null;
  fixDirection: string | null;
}

/** A root_cause split at its "Symptom:", "Cause:" and "Fix direction:" markers; text with no marker is kept whole as the cause. */
export function splitRootCause(text: string): RootCause {
  const marks = [...text.matchAll(/(Symptom|Cause|Fix direction):/g)];
  if (marks.length === 0) return { symptom: null, cause: text, fixDirection: null };
  const found: Record<string, string> = {};
  marks.forEach((mark, at) => {
    const name = mark[1] ?? '';
    if (name in found) return;
    const from = (mark.index ?? 0) + mark[0].length;
    found[name] = text.slice(from, marks[at + 1]?.index ?? text.length).trim();
  });
  return { symptom: found['Symptom'] ?? null, cause: found['Cause'] ?? null, fixDirection: found['Fix direction'] ?? null };
}
