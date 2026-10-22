import { useParams } from 'react-router';
import type { MouseEvent } from 'react';
import { CodeBlock, MarkdownText, NotBuiltYet, StatusTag, VerifyCommand } from '../../../kit';
import type { Trace } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { Region } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';
import { EventRow, Ladder } from '../Ladder';
import { eventsOf, markerOf } from '../loopData';
import type { LoopEvent } from '../loopData';
import '../explorer.css';
import './loop.css';

const QUESTION = 'Which gate failed, and did the attempt after it pass the same gate?';

/** A link on this page to a log line. The route is a hash, so the link scrolls to the line instead of changing the hash. */
function jumpTo(line: number) {
  return (click: MouseEvent<HTMLAnchorElement>): void => {
    click.preventDefault();
    const target = document.getElementById(`gate-line-${line}`);
    target?.scrollIntoView({ block: 'start' });
    target?.focus();
  };
}

/** DATA-2: the provenance sentence comes from each line's own source value, never a constant. */
function sourceSentence(events: LoopEvent[]): string {
  const sources = [...new Set(events.map((e) => e.source))];
  if (sources.length === 1) {
    return sources[0] === null ? 'The log records no source for its events.' : `Every event is recorded as ${sources[0]}.`;
  }
  const named = sources.filter((s): s is string => s !== null);
  const [main] = [...named].sort((a, b) => events.filter((e) => e.source === b).length - events.filter((e) => e.source === a).length);
  const others = events.filter((e) => e.source !== main);
  const parts = others.map((e) => `line ${e.line} is ${e.source ?? 'without a source'}`);
  return `Events are recorded as ${main ?? 'unknown'}, except ${parts.join('; ')}.`;
}

function Ladders({ trace, plan, node, events }: { trace: Trace; plan: string; node: string; events: LoopEvent[] }) {
  const failed = events.filter((e) => e.kind === 'gate' && e.ok === false);
  return (
    <>
      <p className="s-text">
        <strong>Question.</strong> {QUESTION}
      </p>
      {failed.map((e) => (
        <p className="s-text" key={e.line}>
          <StatusTag status="fail">{`Attempt ${e.attempt ?? '?'}: ${e.event} failed`}</StatusTag>{' '}
          <a href={`#gate-line-${e.line}`} onClick={jumpTo(e.line)}>
            Read the FAIL at line {e.line} in the gate timeline
          </a>
        </p>
      ))}
      <p className="s-text">
        Markers read attempt · log line. Source: the loop log of {plan}/{node}, log lines {events[0]!.line} to {events[events.length - 1]!.line}.{' '}
        {sourceSentence(events)}
      </p>
      <Ladder trace={trace} plan={plan} node={node} mode="expanded" />
    </>
  );
}

export function Loop() {
  const { planId = '', nodeId = '' } = useParams();
  const { trace } = useShell();
  if (trace.state !== 'ready') return <DataNotice trace={trace} />;
  const node = trace.trace.nodes.find((candidate) => candidate.plan === planId && candidate.id === nodeId);
  if (node === undefined) return <NotBuiltYet kind="node" name={`${planId}/${nodeId}`} back={{ href: '#/', label: 'Back to the overview' }} />;

  const events = eventsOf(trace.trace, planId, nodeId);
  const timeline = events.filter((e) => e.kind === 'gate' || e.kind === 'state');
  const nodeRef = `${planId}/${nodeId}`;
  return (
    <>
      <Region region="attempt-ladder" req="LOOP-2" label="Attempt ladder">
        {events.length > 0 ? (
          <Ladders trace={trace.trace} plan={planId} node={nodeId} events={events} />
        ) : (
          <>
            <p className="s-text">
              <strong>Question.</strong> {QUESTION}
            </p>
            <p className="s-text">
              <StatusTag status="not-built">No loop log</StatusTag> {nodeRef} has no loop.jsonl, so there is no attempt to draw.
            </p>
            {node.completenessReasons.length > 0 ? <MarkdownText source={node.completenessReasons.join('\n\n')} /> : null}
            <VerifyCommand command={`git log --oneline --grep='(${nodeRef})'`} intro="Run this in a clone. It lists the commits whose message names this node." />
            <p className="s-text">
              <a href={`#/plans/${planId}/${nodeId}`}>Open the node page</a>
            </p>
          </>
        )}
      </Region>
      <Region region="gate-timeline" req="LOOP-1" label="Gate timeline">
        <h2 className="s-heading">Gate and state events, in log order</h2>
        {timeline.length > 0 ? (
          <>
            <p className="s-text">
              Every gate and state event of {nodeRef}, from its loop log. Other events in the same log (setup, attempt++, findings, pause1, verdicts, the
              investigation) are not gate or state events and are not listed here. Markers read attempt · log line.
            </p>
            <div className="s-timeline" role="list">
              {timeline.map((e) => (
                <div className="s-entry" role="listitem" id={`gate-line-${e.line}`} tabIndex={-1} key={e.line}>
                  <EventRow event={e} />
                  {e.cmd === null ? null : <CodeBlock label={`Command of ${markerOf(e)} ${e.event}`}>{e.cmd}</CodeBlock>}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="s-text">
            <StatusTag status="not-built">No events</StatusTag>{' '}
            {events.length === 0 ? `${nodeRef} has no loop.jsonl, so there is no gate or state event to list.` : `The loop log of ${nodeRef} holds no gate or state event.`}{' '}
            A node with gates shows each event's command, exit code, expected outcome, ok and detail here.
          </p>
        )}
      </Region>
    </>
  );
}
