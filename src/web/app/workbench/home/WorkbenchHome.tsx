import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Search } from 'lucide-react';
import { Button, Field, PageHeader, ProblemBanner, RecentPolicies, Spinner, TextInput } from '../../../kit';
import { getPolicy, readRecent } from '../../data/api';
import type { Problem } from '../../data/api';
import { browserDeps } from '../browser';
import { ProblemView } from '../ProblemView';
import '../workbench.css';

type Opening =
  | { kind: 'idle' }
  | { kind: 'empty' }
  | { kind: 'busy'; reference: string }
  | { kind: 'problem'; problem: Problem }
  | { kind: 'unreachable'; reference: string; reason: string };

function liveNoteOf(opening: Opening): string {
  switch (opening.kind) {
    case 'busy':
      return 'answered by the API; one request is in flight and no answer has come back yet';
    case 'problem':
      return `GET /policies answered ${opening.problem.status}`;
    case 'unreachable':
      return 'no answer from the API: nothing to record';
    default:
      return 'answered by the API when a request is sent; nothing has been requested yet';
  }
}

export function WorkbenchHome() {
  const navigate = useNavigate();
  const [reference, setReference] = useState('');
  const [opening, setOpening] = useState<Opening>({ kind: 'idle' });
  const busy = opening.kind === 'busy';
  const recent = readRecent(browserDeps().storage);

  async function open(typed: string): Promise<void> {
    if (busy) return;
    const wanted = typed.trim();
    if (wanted === '') {
      setOpening({ kind: 'empty' });
      return;
    }
    setOpening({ kind: 'busy', reference: wanted });
    const answer = await getPolicy(browserDeps(), wanted);
    if (answer.kind === 'ok') void navigate(`/workbench/policies/${encodeURIComponent(answer.value.reference)}`);
    else if (answer.kind === 'problem') setOpening({ kind: 'problem', problem: answer.problem });
    else setOpening({ kind: 'unreachable', reference: wanted, reason: answer.reason });
  }

  function submit(event: FormEvent): void {
    event.preventDefault();
    void open(reference);
  }

  return (
    <div className="s-wb-home">
      <section className="s-wb-region s-wb-span" data-region="open-a-policy-by-reference" data-req="WB-2">
        <PageHeader
          mode="live"
          title="Workbench"
          eyebrow="Workbench · Home"
          question="Which policy do you want to work on?"
          answer="Open one by its reference, sell a new one, or come back to a recent one."
          liveNote={liveNoteOf(opening)}
        />
        <h2>Open a policy by reference</h2>
        <p>
          {busy
            ? `Opening ${opening.reference}. The reference and the button are locked until the API answers.`
            : 'Type the policy reference, then open it.'}
        </p>
        <form className="s-wb-row" onSubmit={submit} noValidate>
          <div className="s-wb-field">
            <Field label="Policy reference" id="open-reference" error={opening.kind === 'empty' ? 'Type a policy reference.' : undefined}>
              {(control) => (
                <TextInput {...control} mono disabled={busy} value={reference} onChange={(event) => setReference(event.target.value)} />
              )}
            </Field>
          </div>
          <Button type="submit" variant="primary" busy={busy} busyLabel="Opening…" icon={<Search aria-hidden="true" />}>
            Open policy
          </Button>
        </form>
      </section>
      <section
        className="s-wb-region s-wb-span"
        data-region="open-by-reference-busy-while-the-policy-loads"
        data-req="BUSY-1"
        aria-labelledby="s-wb-status-heading"
      >
        <h2 id="s-wb-status-heading">Request status</h2>
        {opening.kind === 'busy' ? (
          <p role="status" className="s-wb-actions">
            <Spinner />
            <span>In flight: GET /policies/{opening.reference}. Waiting for the API to answer.</span>
          </p>
        ) : opening.kind === 'problem' ? (
          <ProblemView problem={opening.problem} />
        ) : opening.kind === 'unreachable' ? (
          <ProblemBanner
            unreachable
            title="The API did not answer"
            detail="No request was completed. Nothing was changed by this screen."
            extensions={[{ name: 'error', value: opening.reason }]}
            onRetry={() => void open(opening.reference)}
          />
        ) : (
          <p role="status">
            Idle. No request sent. Opening a reference sends one GET /policies/‹reference›, and the Open policy button shows
            Opening… and is disabled until the API answers.
          </p>
        )}
      </section>
      <section className="s-wb-region" data-region="sell-a-new-policy-entry" data-req="WB-1" aria-labelledby="s-wb-sell-heading">
        <h2 id="s-wb-sell-heading">Sell a new policy</h2>
        <p>Start a new policy. Its reference appears under recent policies once it is sold.</p>
        <p>
          <a href="#/workbench/sell">Sell a new policy</a>
        </p>
      </section>
      <section className="s-wb-region" data-region="recent-policies-kept-in-this-browser" data-req="WB-9">
        <RecentPolicies
          storage={recent.state}
          policies={
            recent.state === 'available'
              ? recent.entries.map((entry) => ({
                  reference: entry.reference,
                  href: `#/workbench/policies/${encodeURIComponent(entry.reference)}`,
                  how: entry.how,
                }))
              : []
          }
        />
      </section>
    </div>
  );
}
