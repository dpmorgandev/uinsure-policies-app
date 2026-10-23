// U5's overlay (tests/Uinsure.Policies.Web.Tests/fixtures/overlays/u5/README.md): the clean `complete` trail (build/F1, run once) with four
// context snapshots and a generated harness file laid over it before it is committed.
import { cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { replayTrail } from './trail';
import type { Trail } from './trail';

export const overlayDir = fileURLToPath(new URL('../../../fixtures/overlays/u5/tree/', import.meta.url));

/** The `complete` trail with U5's overlay committed on top. */
export function replayU5(): Trail {
  return replayTrail('complete', (root) => cpSync(overlayDir, root, { recursive: true }));
}

/** One session as trace.json holds it (trace-data skill: sessions[]). */
export interface Session {
  file?: string;
  ts?: string | null;
  slug?: string | null;
  plan?: string | null;
  node?: string | null;
  status?: string | null;
  nextAction?: string | null;
}

/** One verdict as trace.json holds it, with the fields the stats screen reads (docs/ui/derived/U5/stats/screen.json). */
export interface Verdict {
  plan?: string;
  node?: string;
  round?: string;
  agent?: string;
  verdict?: string;
  ts?: string | null;
  attempt?: number | null;
}
