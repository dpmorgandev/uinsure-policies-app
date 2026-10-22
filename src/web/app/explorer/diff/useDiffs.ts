import { useCallback, useState } from 'react';
import type { DiffFile } from '../../../kit';
import { loadDiffs } from '../../data/trace';
import type { ChunkLoad, DiffRecord, Trace, TraceCommit } from '../../data/trace';
import { parsePatch } from './patch';

export type DiffState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; files: DiffFile[] }
  | { status: 'error'; reason: string };

const IDLE: DiffState = { status: 'idle' };

// One request per node's chunk, whichever of its commits asks first. A chunk that did not load is forgotten, so a retry asks again.
const requests = new Map<string, Promise<ChunkLoad<DiffRecord>>>();

function chunkOf(trace: Trace, plan: string, node: string): Promise<ChunkLoad<DiffRecord>> {
  const key = `${plan}/${node}`;
  const known = requests.get(key);
  if (known !== undefined) return known;
  const request = loadDiffs(trace, plan, node).then((result) => {
    if (result.state !== 'ready') requests.delete(key);
    return result;
  });
  requests.set(key, request);
  return request;
}

async function diffOf(trace: Trace, commit: TraceCommit): Promise<DiffState> {
  if (commit.plan === null || commit.node === null) {
    return { status: 'error', reason: `${commit.short} names no plan and node in its trailers, so no diffs chunk holds it.` };
  }
  const chunk = await chunkOf(trace, commit.plan, commit.node);
  if (chunk.state === 'error') return { status: 'error', reason: chunk.reason };
  const record = chunk.state === 'ready' ? chunk.records.find((candidate) => candidate.sha === commit.sha) : undefined;
  if (record === undefined) return { status: 'error', reason: `The diffs chunk of ${commit.plan}/${commit.node} holds no patch for ${commit.short}.` };
  return { status: 'loaded', files: parsePatch(record.patch) };
}

/** RULE-3: each commit's diff is idle until asked for; asking fetches its node's chunk once. */
export function useDiffs(trace: Trace): { stateOf: (sha: string) => DiffState; load: (commit: TraceCommit) => void } {
  const [states, setStates] = useState<Record<string, DiffState>>({});
  const put = useCallback((sha: string, state: DiffState): void => setStates((all) => ({ ...all, [sha]: state })), []);

  const load = useCallback(
    (commit: TraceCommit): void => {
      put(commit.sha, { status: 'loading' });
      void diffOf(trace, commit).then((state) => put(commit.sha, state));
    },
    [trace, put],
  );
  return { stateOf: (sha) => states[sha] ?? IDLE, load };
}
