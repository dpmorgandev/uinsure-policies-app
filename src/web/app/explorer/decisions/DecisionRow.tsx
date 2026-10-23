import { HumanDecisionRow } from '../../../kit';
import type { HumanDecisionRowProps } from '../../../kit';
import type { Trace, TraceDecision } from '../../data/trace';
import { blobUrl, commitUrl } from '../../shell/repo';

type DecisionKind = HumanDecisionRowProps['kind'];

const KINDS: Record<string, DecisionKind> = {
  pause1: 'pause-1',
  pause2: 'pause-2',
  steer: 'steer',
  signoff: 'sign-off',
  merge: 'merge',
};

/** The kind the kit draws, or null for a kind of decision it has no row for. */
export const kindOf = (decision: TraceDecision): DecisionKind | null => KINDS[decision.kind] ?? null;

/** "pause1" is the loop's word; the page says "pause 1". */
const spoken = (at: string): string => at.replace(/^pause(\d)$/, 'pause $1');

/** HITL-1: one decision, with the loop line that records it. A sign-off and a merge name their commit. */
export function DecisionRow({ trace, decision, marker }: { trace: Trace; decision: TraceDecision; marker?: string }) {
  const kind = kindOf(decision);
  if (kind === null) return null;
  const commit = decision.sha ? trace.commits.find((c) => c.sha.startsWith(decision.sha ?? '')) : undefined;
  const steer = kind === 'steer' ? [decision.round ? `round ${decision.round}` : null, decision.at ? `given at ${spoken(decision.at)}` : null].filter(Boolean).join(', ') : '';
  const said = decision.what ?? null;
  const evidence = decision.evidence ?? null;
  return (
    <HumanDecisionRow
      as="li"
      kind={kind}
      who="david"
      what={[steer, said].filter((part): part is string => part !== null && part !== '').join(': ') || 'No words recorded on this loop line.'}
      when={decision.when}
      where={decision.node === null ? decision.plan : `${decision.plan}/${decision.node}`}
      marker={marker}
      outcome={kind === 'sign-off' ? { status: 'pass', label: 'Signed off' } : kind === 'merge' ? { status: 'pass', label: 'Merged' } : undefined}
      sha={
        decision.sha
          ? commit
            ? { sha: commit.short, fullSha: commit.sha, href: `#/commits/${commit.short}`, githubHref: commitUrl(commit.sha) }
            : { sha: decision.sha.slice(0, 7) }
          : undefined
      }
      evidence={
        evidence === null
          ? undefined
          : [{ label: `${evidence.file}, line ${evidence.line}`, href: blobUrl(trace.compiledAt.sha, evidence.file, evidence.line), external: true }]
      }
    />
  );
}
