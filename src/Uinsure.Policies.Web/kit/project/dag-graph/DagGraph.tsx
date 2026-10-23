import { useId } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Radio } from 'lucide-react';
import { Disclosure } from '../../primitives/disclosure/Disclosure';
import { DagStatusTag, DagTable } from '../dag-table/DagTable';
import type { DagNode } from '../dag-table/DagTable';
import styles from './DagGraph.module.css';

export interface DagGraphProps {
  nodes: readonly DagNode[];
  /** The node the reader is looking at, or the one running now. It gets a heavier frame and `aria-current`. */
  focalId?: string;
  /** The graph is being kept up to date as the build runs. Draws the Live marker. */
  live?: boolean;
  /** Words beside the Live marker: "F4 in progress". */
  liveNote?: ReactNode;
  /** Says what the figure shows. Defaults to how to read it. */
  caption?: ReactNode;
  /** Start with the text-equivalent table open. On by default, because it is the accessible form. */
  tableOpen?: boolean;
  /**
   * Where each rule chip in the text equivalent links, given the rule ID: the same prop, with the same signature, as
   * the dag-table takes. Return `undefined` (or leave the prop out) to keep the chip's own default, `/rules/<ruleId>`.
   */
  ruleHref?: (ruleId: string) => string | undefined;
}

interface Placed {
  node: DagNode;
  layer: number;
  column: number;
}

/**
 * A node sits one layer below the deepest node it waits for. This is where the node is drawn, not what the plan says:
 * the plan's own facts are only the nodes and their `dependsOn`.
 */
function place(nodes: readonly DagNode[]): { placed: Placed[]; layers: number; columns: number } {
  const byId = new Map(nodes.map((node) => [node.id, node] as const));
  const depth = new Map<string, number>();

  function layerOf(node: DagNode, trail: ReadonlySet<string>): number {
    const known = depth.get(node.id);
    if (known !== undefined) return known;
    if (trail.has(node.id)) return 0;
    const next = new Set(trail).add(node.id);
    let deepest = -1;
    for (const dep of node.dependsOn) {
      const parent = byId.get(dep);
      if (parent) deepest = Math.max(deepest, layerOf(parent, next));
    }
    depth.set(node.id, deepest + 1);
    return deepest + 1;
  }

  const layerOfEach = nodes.map((node) => layerOf(node, new Set()));
  const layers = layerOfEach.reduce((most, layer) => Math.max(most, layer + 1), 0);
  const sizes = new Array<number>(layers).fill(0);
  for (const layer of layerOfEach) sizes[layer] = (sizes[layer] ?? 0) + 1;
  const columns = sizes.reduce((most, size) => Math.max(most, size), 1);

  const seen = new Array<number>(layers).fill(0);
  const placed = nodes.map((node, position) => {
    const layer = layerOfEach[position] ?? 0;
    const inLayer = sizes[layer] ?? 1;
    const offset = Math.floor((columns - inLayer) / 2);
    const column = offset + (seen[layer] ?? 0);
    seen[layer] = (seen[layer] ?? 0) + 1;
    return { node, layer, column };
  });
  return { placed, layers, columns };
}

// Row height 8rem, node height 6rem, centred: a node's top edge is 1/8 down its row and its bottom edge 7/8.
const TOP = 1 / 8;
const BOTTOM = 7 / 8;

export function DagGraph({ nodes, focalId, live = false, liveNote, caption, tableOpen = true, ruleHref }: DagGraphProps) {
  const captionId = useId();
  const { placed, layers, columns } = place(nodes);
  const at = new Map(placed.map((p) => [p.node.id, p] as const));
  const hasNotBuilt = nodes.some((node) => node.status === 'not-built');
  const state = hasNotBuilt ? 'nb' : live ? 'live' : 'pop';

  const edges = placed.flatMap(({ node, layer, column }) =>
    node.dependsOn.flatMap((dep) => {
      const from = at.get(dep);
      if (!from) return [];
      return [
        {
          key: `${dep}-${node.id}`,
          x1: from.column + 0.5,
          y1: from.layer + BOTTOM,
          x2: column + 0.5,
          y2: layer + TOP,
          dashed: node.status === 'not-built' || node.status === 'pending',
        },
      ];
    }),
  );

  const canvasStyle = { '--dag-columns': columns, '--dag-layers': layers } as CSSProperties;

  return (
    <figure className={styles.root} data-state={state} aria-labelledby={captionId}>
      <figcaption id={captionId} className={styles.caption}>
        {caption ?? (
          <>
            <strong>Read top to bottom.</strong> A node sits below every node it waits for, and the lines join them.
            The table underneath says the same in words.
          </>
        )}
      </figcaption>
      {live ? (
        <p className={styles.live} role="status">
          <Radio className={styles.icon} aria-hidden="true" focusable="false" />
          <span className={styles.liveWord}>Live</span>
          {liveNote ? <span className={styles.liveNote}>{liveNote}</span> : null}
        </p>
      ) : null}
      <div className={styles.scroll} role="region" aria-label="Plan graph, scrolls sideways" tabIndex={0}>
        <div className={styles.canvas} style={canvasStyle}>
          <svg
            className={styles.edges}
            viewBox={`0 0 ${columns} ${layers}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            {edges.map((edge) => (
              <line
                key={edge.key}
                className={edge.dashed ? `${styles.edge} ${styles.edgeDashed}` : styles.edge}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
              />
            ))}
          </svg>
          <ol className={styles.nodes} aria-label="Plan nodes, in layers from the top">
            {placed.map(({ node, layer, column }) => {
              const focal = node.id === focalId;
              const cell = { gridRow: layer + 1, gridColumn: column + 1 } as CSSProperties;
              return (
                <li
                  key={node.id}
                  className={styles.node}
                  style={cell}
                  data-status={node.status}
                  data-layer={layer + 1}
                  data-column={column + 1}
                  data-focal={focal ? 'true' : undefined}
                  aria-current={focal ? 'step' : undefined}
                >
                  <span className={styles.head}>
                    {node.href ? (
                      <a className={styles.id} href={node.href}>
                        {node.id}
                      </a>
                    ) : (
                      <span className={styles.id}>{node.id}</span>
                    )}
                    {node.pr !== undefined && node.pr !== null ? <span className={styles.pr}>PR #{node.pr}</span> : null}
                    {focal ? <span className={styles.focal}>focal</span> : null}
                  </span>
                  <span className={styles.title} title={node.title}>
                    {node.title}
                  </span>
                  <DagStatusTag status={node.status} />
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <div className={styles.equivalent}>
        <Disclosure summary="Text equivalent: the plan as a table" defaultOpen={tableOpen}>
          <DagTable nodes={nodes} ruleHref={ruleHref} />
        </Disclosure>
      </div>
    </figure>
  );
}
