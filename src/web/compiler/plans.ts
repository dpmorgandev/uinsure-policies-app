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
