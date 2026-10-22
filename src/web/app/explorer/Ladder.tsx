import { AgentBadge, AttemptLadder, GateRow, ShaLink, TddStepTag, VerdictCard } from '../../kit';
import type { BranchEntry, GateResult, LadderAttempt, LadderEscalation, LadderStep, RungTag } from '../../kit';
import type { Trace } from '../data/trace';
import { agentOf } from '../shell/agents';
import { commitUrl } from '../shell/repo';
import { eventsOf, findingsRound, fixingCommitsOf, investigationId, markerOf, shortSha, verdictEvent, verdictsOf } from './loopData';
import type { FixingCommit, LoopEvent, LoopVerdict } from './loopData';

export const NO_DETAIL = 'No detail recorded in the log.';

/** The head a loop event names, as the kit's SHA link takes it. The link goes to the commit on GitHub. */
export function headOf(sha: string | null): { sha: string; fullSha: string; githubHref: string } | undefined {
  return sha === null ? undefined : { sha: shortSha(sha), fullSha: sha, githubHref: commitUrl(sha) };
}

/** ok false is a FAIL; a non-zero exit with ok true is a failure the gate expected; a gate that recorded no ok did not decide. */
function resultOf(event: LoopEvent): GateResult {
  if (event.ok === false) return 'failed';
  if (event.ok === null) return 'waived';
  return event.exit !== null && event.exit !== 0 ? 'expected-fail' : 'held';
}

/** One gate or state event of the loop log, drawn by the kit's gate row. */
export function EventRow({ event }: { event: LoopEvent }) {
  const isState = event.kind === 'state';
  return (
    <GateRow
      gate={event.event ?? ''}
      kind={isState ? 'state' : 'gate'}
      marker={markerOf(event)}
      result={isState ? undefined : resultOf(event)}
      exit={event.exit}
      expected={event.expect}
      ok={event.ok}
      head={headOf(event.head)}
      detail={event.detail ?? NO_DETAIL}
    />
  );
}

const STEP_KINDS = ['gate', 'state', 'findings', 'verdict'];
const capital = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);

function commitStep(commit: FixingCommit): LadderStep {
  const trailer = (commit.fixesFinding ?? []).map((f) => (f.round === null ? f.id : `A${f.round}/${f.id}`)).join(', ');
  return {
    marker: commit.order === null ? commit.short : `#${commit.order}`,
    stage: commit.tdd === 'red' ? 'red test' : 'fix commit',
    content: (
      <>
        <p className="s-row">
          <ShaLink sha={commit.short} fullSha={commit.sha} href={`#/commits/${commit.short}`} githubHref={commitUrl(commit.sha)} />
          <TddStepTag step={commit.tdd} />
          <AgentBadge agent={agentOf(commit.agent)} />
        </p>
        <p className="s-text">{commit.subject}</p>
        <p className="s-text">Fixes-Finding: {trailer}</p>
      </>
    ),
  };
}

function verdictStep(event: LoopEvent, verdicts: LoopVerdict[], plan: string, node: string): LadderStep {
  const named = verdictEvent(event);
  const verdict = named === null ? undefined : verdicts.find((v) => v.file === named.file);
  const agent = agentOf(verdict?.agent ?? named?.agent);
  const round = verdict?.round ?? named?.round ?? undefined;
  const base = { marker: markerOf(event), stage: 'verdict' as const, round };
  if (verdict === undefined || agent === null) {
    return { ...base, content: <p className="s-text">{event.event}: the verdict file is not in the trail.</p> };
  }
  return {
    ...base,
    content: (
      <>
        <VerdictCard
          agent={agent}
          round={verdict.round}
          verdict={verdict.verdict === 'PASS' || verdict.verdict === 'FAIL' ? verdict.verdict : undefined}
          head={headOf(verdict.head)}
          rulesCovered={verdict.rulesCovered}
          rulesMissing={verdict.rulesMissing}
          findings={verdict.findings.map((f) => ({
            id: f.id ?? '',
            severity: f.severity === 'P1' ? 'P1' : 'P2',
            summary: f.what ?? '',
            route: f.route_to ?? null,
          }))}
          summary={event.detail}
          headingLevel={3}
          ruleHref={(id) => `#/rules/${encodeURIComponent(id)}`}
        />
        <p className="s-text">
          <a href={`#/plans/${plan}/${node}/verdicts/${verdict.round}/${verdict.agent}`}>
            Open the {verdict.agent} verdict {verdict.round}
          </a>
        </p>
      </>
    ),
  };
}

function eventStep(event: LoopEvent, verdicts: LoopVerdict[], plan: string, node: string): LadderStep {
  if (event.kind === 'verdict') return verdictStep(event, verdicts, plan, node);
  if (event.kind === 'findings') {
    const round = findingsRound(event) ?? undefined;
    return {
      marker: markerOf(event),
      stage: 'findings',
      round,
      content: (
        <p className="s-text">
          Finding round{' '}
          {round === undefined ? null : <a href={`#/plans/${plan}/${node}/findings/${round}`}>{round}</a>}
          {event.detail === null ? '.' : `: ${event.detail}`}
        </p>
      ),
    };
  }
  return { marker: markerOf(event), stage: 'gate', content: <EventRow event={event} /> };
}

/** How an attempt ended: its first gate that came back ok false, else its first FAIL verdict, else its PASS verdicts. */
function outcomeOf(events: LoopEvent[], isLast: boolean): RungTag {
  const failedGate = events.find((e) => e.kind === 'gate' && e.ok === false);
  if (failedGate !== undefined) return { status: 'fail', label: `Failed at ${failedGate.event}` };
  const verdicts = events.flatMap((e) => verdictEvent(e) ?? []);
  const failed = verdicts.find((v) => v.verdict === 'FAIL');
  if (failed !== undefined) return { status: 'fail', label: `${capital(failed.agent)} FAIL at ${failed.round ?? 'an unnamed round'}` };
  const passed = verdicts.filter((v) => v.agent === 'reviewer').at(-1) ?? verdicts.at(-1);
  if (passed !== undefined) return { status: 'pass', label: `${capital(passed.agent)} PASS at ${passed.round ?? 'an unnamed round'}` };
  return isLast ? { status: 'pending', label: 'In progress' } : { status: 'warn', label: 'Turned over with no failure recorded' };
}

interface LadderProps {
  trace: Trace;
  plan: string;
  node: string;
  mode: 'expanded' | 'aggregated';
}

/**
 * LOOP-2: the node's attempts as the loop log, the verdict files and the Fixes-Finding commits give them. A step
 * is a gate or state event, a findings round, a verdict, or a commit that fixes a finding; the commit follows the
 * event that checked it (the one whose head it is), or the last event before its date.
 */
export function Ladder({ trace, plan, node, mode }: LadderProps) {
  const events = eventsOf(trace, plan, node);
  const verdicts = verdictsOf(trace, plan, node);
  const opened = events.find((e) => investigationId(e) !== null);
  const handBack = opened === undefined ? undefined : events.find((e) => e.line > opened.line && e.event === 'state(in_progress)');
  // The investigation's own state changes step off the spine; its findings round stays in the attempt that uses it.
  const onBranch = (e: LoopEvent): boolean =>
    opened !== undefined && e.line >= opened.line && (handBack === undefined || e.line <= handBack.line) && (e.kind === 'state' || e === opened);
  const stepEvents = events.filter((e) => STEP_KINDS.includes(e.kind ?? '') && !onBranch(e));

  const anchored = new Map<number, FixingCommit[]>();
  [...fixingCommitsOf(trace, plan, node)]
    .sort((a, b) => Date.parse(a.date ?? '') - Date.parse(b.date ?? ''))
    .forEach((commit) => {
      const anchor =
        stepEvents.find((e) => e.head === commit.sha) ??
        [...stepEvents].reverse().find((e) => e.ts !== null && Date.parse(e.ts) <= Date.parse(commit.date ?? '')) ??
        stepEvents[0];
      if (anchor !== undefined) anchored.set(anchor.line, [...(anchored.get(anchor.line) ?? []), commit]);
    });

  const numbers = [...new Set(events.flatMap((e) => (e.attempt === null ? [] : [e.attempt])))].sort((a, b) => a - b);
  const attempts: LadderAttempt[] = numbers.map((n, at) => {
    const own = stepEvents.filter((e) => e.attempt === n);
    const steps = own.flatMap((e) => [eventStep(e, verdicts, plan, node), ...(anchored.get(e.line) ?? []).map(commitStep)]);
    const rounds = [...new Set(own.flatMap((e) => verdictEvent(e)?.round ?? []))];
    return {
      n,
      outcome: outcomeOf(own, at === numbers.length - 1),
      rounds,
      steps,
      turn: events.find((e) => e.kind === 'attempt++' && e.attempt === n + 1)?.detail ?? undefined,
    };
  });

  let escalation: LadderEscalation | undefined;
  const id = opened === undefined ? null : investigationId(opened);
  if (opened !== undefined && id !== null && opened.attempt !== null) {
    const entries: BranchEntry[] = events.filter(onBranch).map((e) => ({ marker: markerOf(e), title: e.event, body: e.detail ?? NO_DETAIL }));
    escalation = {
      id,
      beforeAttempt: opened.attempt,
      leaves: `Steps off the spine when attempt ${opened.attempt} opens.`,
      why: opened.detail ?? undefined,
      note: trace.plans.some((p) => p.id === id) ? <a href={`#/plans/${id}`}>Open the investigation plan {id}</a> : undefined,
      entries,
    };
  }
  return <AttemptLadder attempts={attempts} escalation={escalation} mode={mode} headingLevel={2} />;
}
