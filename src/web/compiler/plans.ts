// Reads the plan DAG (docs/plans/*/<plan>.dag.yaml) and the requirement tables. Only the shapes those files hold:
// top-level scalars, and under `nodes:` one `- id:` item with scalar and `[a, b]` fields. Nested lists (tasks,
// acceptance) are skipped.

export interface DagNode {
  id: string;
  title: string | null;
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
  priority: string | null;
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
      status: text(node['status']),
      attempt: typeof node['attempt'] === 'number' ? node['attempt'] : null,
      rules: Array.isArray(node['rules']) ? node['rules'] : [],
    })),
  };
}

/** The rule rows of a requirements table: `| ID | Priority | [Title |] Rule |`. */
export function parseRequirements(source: string): Requirement[] {
  const found: Requirement[] = [];
  let titleColumn = -1;
  for (const line of source.split(/\r?\n/)) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells[0] === 'ID') titleColumn = cells.indexOf('Title');
    else if (/^[A-Z][A-Z0-9]*-\d+[a-z]?$/.test(cells[0] ?? '')) {
      found.push({ id: cells[0] ?? '', priority: cells[1] ?? null, title: titleColumn >= 0 ? (cells[titleColumn] ?? null) : null });
    }
  }
  return found;
}
