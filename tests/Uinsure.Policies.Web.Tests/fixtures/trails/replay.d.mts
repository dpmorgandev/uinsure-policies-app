// Types for replay.mjs, for the TypeScript tests that import it.
export interface Replayed {
  /** The replayed repo. */
  root: string;
  /** Each commit's full SHA, by its id in commits.json (c0, c1, …). */
  shas: Record<string, string>;
}

export function replay(fixture: string, root: string, options?: { trail?: boolean }): Replayed;
