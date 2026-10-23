import { DiffViewer } from '../../../kit';
import type { TraceCommit } from '../../data/trace';
import { agentOf } from '../../shell/agents';
import { commitUrl } from '../../shell/repo';
import type { DiffState } from './useDiffs';

/** One commit's diff, as the kit draws it: waiting to be asked for, loading, loaded or failed (RULE-3, BUSY-1). */
export function CommitDiff({ commit, state, onLoad }: { commit: TraceCommit; state: DiffState; onLoad: (commit: TraceCommit) => void }) {
  const rung = commit.order === null ? undefined : `#${commit.order}`;
  const where = rung === undefined ? commit.short : `${rung} ${commit.short}`;
  return (
    <DiffViewer
      status={state.status}
      rung={rung}
      sha={commit.short}
      githubHref={commitUrl(commit.sha)}
      tdd={commit.tdd}
      agent={agentOf(commit.agent)}
      files={state.status === 'loaded' ? state.files : undefined}
      error={state.status === 'error' ? state.reason : undefined}
      loadLabel={commit.tdd === null ? undefined : `Load ${commit.tdd} diff, ${where}`}
      onLoad={() => onLoad(commit)}
      onRetry={() => onLoad(commit)}
    />
  );
}
