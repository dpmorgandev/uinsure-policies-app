// Reads the plan DAG (docs/plans/*/<plan>.dag.yaml) and the requirement tables. Only the shapes those files hold:
// top-level scalars, and under `nodes:` one `- id:` item with scalar and `[a, b]` fields, its `acceptance:` lines
// (one quoted string each) and its `tasks:` lines (one `{key: value, …}` each).

export interface DagNode {
  id: string;
  title: string | null;
  owner: string | null;
  status: string | null;
  attempt: number | null;
  rules: string[];
  dependsOn: string[];
  pr: number | null;
  qa: string | null;
  /** The node's acceptance lines, in the plan file's order. */
  acceptance: string[];
  /** The node's tasks, in the plan file's order. */
  tasks: DagTask[];
}

export interface DagTask {
  id: string;
  title: string | null;
  status: string | null;
  role: string | null;
  step: string | null;
}

export interface Dag {
  id: string | null;
  kind: string | null;
  title: string | null;
  status: string | null;
  approvedBy: string | null;
  approvedOn: string | null;
  requirementsRev: string | null;
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

/** The `key: value` pairs of a one-line `{…}` mapping; a comma inside quotes or `[]` does not split it. */
function flowMapping(raw: string): Record<string, Scalar> {
  const inner = raw.trim().replace(/^\{/, '').replace(/\}$/, '');
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let start = 0;
  [...inner].forEach((char, at) => {
    if (quote !== null) quote = char === quote ? null : quote;
    else if (char === '"' || char === "'") quote = char;
    else if (char === '[') depth += 1;
    else if (char === ']') depth -= 1;
    else if (char === ',' && depth === 0) {
      parts.push(inner.slice(start, at));
      start = at + 1;
    }
  });
  parts.push(inner.slice(start));
  const pairs = parts.flatMap((part) => {
    const colon = part.indexOf(':');
    return colon < 0 ? [] : [[part.slice(0, colon).trim(), scalar(part.slice(colon + 1))] as const];
  });
  return Object.fromEntries(pairs);
}

export function parseDag(source: string): Dag {
  const top: Record<string, Scalar> = {};
  const items: Record<string, Scalar>[] = [];
  const acceptance: string[][] = [];
  const tasks: Record<string, Scalar>[][] = [];
  let listKey: string | null = null;
  let inNodes = false;
  for (const line of source.split(/\r?\n/)) {
    const item = /^ {2}- (\w+):(.*)$/.exec(line);
    const field = /^ {4}(\w+):(.*)$/.exec(line);
    if (line === 'nodes:') inNodes = true;
    else if (!inNodes) {
      const entry = /^(\w+):(.*)$/.exec(line);
      if (entry) top[entry[1] ?? ''] = scalar(entry[2] ?? '');
    } else if (item) {
      items.push({ [item[1] ?? '']: scalar(item[2] ?? '') });
      acceptance.push([]);
      tasks.push([]);
      listKey = null;
    } else if (field && items.length > 0) {
      (items[items.length - 1] as Record<string, Scalar>)[field[1] ?? ''] = scalar(field[2] ?? '');
      listKey = field[2]?.trim() === '' ? (field[1] ?? null) : null;
    } else if (listKey !== null && items.length > 0) {
      const entry = /^ {6}- (.*)$/.exec(line);
      if (entry && listKey === 'acceptance') acceptance[items.length - 1]?.push(text(scalar(entry[1] ?? '')) ?? '');
      else if (entry && listKey === 'tasks') tasks[items.length - 1]?.push(flowMapping(entry[1] ?? ''));
    }
  }
  return {
    id: text(top['plan_id']),
    kind: text(top['kind']),
    title: text(top['title']),
    status: text(top['status']),
    approvedBy: text(top['approved_by']),
    approvedOn: text(top['approved_on']),
    requirementsRev: text(top['requirements_rev']),
    nodes: items.map((node, at) => ({
      id: text(node['id']) ?? '',
      title: text(node['title']),
      owner: text(node['owner']),
      status: text(node['status']),
      attempt: typeof node['attempt'] === 'number' ? node['attempt'] : null,
      rules: Array.isArray(node['rules']) ? node['rules'] : [],
      dependsOn: Array.isArray(node['depends_on']) ? node['depends_on'] : [],
      pr: typeof node['pr'] === 'number' ? node['pr'] : null,
      qa: text(node['qa']),
      acceptance: acceptance[at] ?? [],
      tasks: (tasks[at] ?? []).map((task) => ({
        id: text(task['id']) ?? '',
        title: text(task['title']),
        status: text(task['status']),
        role: text(task['role']),
        step: text(task['step']),
      })),
    })),
  };
}

/** An investigation's front matter (`---` to `---`): its plan_id and title. Null when the file has no front matter. */
export function parseInvestigation(source: string): { id: string | null; title: string | null } | null {
  const lines = source.split(/\r?\n/);
  if (lines[0] !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end < 0) return null;
  const front: Record<string, Scalar> = {};
  for (const line of lines.slice(1, end)) {
    const entry = /^(\w+):(.*)$/.exec(line);
    if (entry) front[entry[1] ?? ''] = scalar(entry[2] ?? '');
  }
  return { id: text(front['plan_id']), title: text(front['title']) };
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

/**
 * A root_cause split at its "Symptom:", "Cause:" and "Fix direction:" markers (LOOP-4). Every character lands in a field:
 * a sentence before the first marker opens the symptom, a repeated marker's text joins its field in order, and a marker's
 * parenthesised qualifier ("Cause (kit):") stays in the field text. Text with no marker is kept whole as the cause.
 */
export function splitRootCause(text: string): RootCause {
  const marks = [...text.matchAll(/(Symptom|Cause|Fix direction)(\s*\([^)]*\))?:/g)];
  if (marks.length === 0) return { symptom: null, cause: text, fixDirection: null };
  const found: Record<string, string[]> = {};
  const preamble = text.slice(0, marks[0]?.index ?? 0).trim();
  if (preamble !== '') found['Symptom'] = [preamble];
  marks.forEach((mark, at) => {
    const from = (mark.index ?? 0) + mark[0].length;
    const body = text.slice(from, marks[at + 1]?.index ?? text.length).trim();
    const qualifier = (mark[2] ?? '').trim();
    (found[mark[1] ?? ''] ??= []).push(qualifier === '' ? body : `${qualifier} ${body}`);
  });
  const field = (name: string): string | null => found[name]?.join(' ') ?? null;
  return { symptom: field('Symptom'), cause: field('Cause'), fixDirection: field('Fix direction') };
}
