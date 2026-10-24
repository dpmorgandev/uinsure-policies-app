import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router';
import { Receipt } from 'lucide-react';
import { Button, DateInput, Field, PageHeader, ProblemBanner, RefundWorkedSum, RuleChip, RungSpine, TextArea } from '../../../kit';
import type { Rung } from '../../../kit';
import { getPolicy, quoteCancellation, recordClaim } from '../../data/api';
import type { ApiAnswer, CancellationQuote, Policy, RecordedClaim } from '../../data/api';
import { browserDeps, todayInLondon } from '../browser';
import { ProblemView } from '../ProblemView';
import { RequestsDrawer } from '../RequestsDrawer';
import '../workbench.css';

const ruleHref = (ruleId: string): string => '#/rules/' + ruleId;

const MAX_DESCRIPTION = 500;

type Step = 'before' | 'claim' | 'after';

const money = (amount: number): string => '£' + amount.toFixed(2);

/** What a request that did not succeed leaves in a rung's receipt: the API's own words, or that nothing answered. */
function failure(answer: ApiAnswer<unknown>): string {
  if (answer.kind === 'problem') return `The API answered ${answer.status}${answer.problem.title ? `, ${answer.problem.title}` : ''}.`;
  if (answer.kind === 'unreachable') return 'The API did not answer.';
  return '';
}

function quoteRung(id: string, marker: string, label: string, hint: string, step: Step | null, mine: Step, quote: ApiAnswer<CancellationQuote> | null, date: string): Rung {
  const running = step === mine;
  if (quote === null) {
    return {
      id,
      marker,
      label,
      hint,
      state: running ? 'busy' : 'waiting',
      busy: running,
      busyLabel: 'Asking for the quote',
      tag: { status: 'pending', label: running ? 'Quoting' : 'Not asked yet' },
    };
  }
  if (quote.kind !== 'ok') {
    return { id, marker, label, hint, state: 'stopped', tag: { status: 'fail', label: 'Quote not returned' }, receipt: <p>{failure(quote)}</p> };
  }
  return {
    id,
    marker,
    label,
    hint,
    state: 'done',
    tag: { status: 'pass', label: 'Quoted' },
    carried: { label: 'Quote date', value: quote.value.cancellationDate, note: `asked for ${date}` },
    receipt: (
      <p>
        Refund quoted: <b>{money(quote.value.totalRefund)}</b>, rule applied {quote.value.ruleApplied}.
      </p>
    ),
  };
}

function claimRung(step: Step | null, claim: ApiAnswer<RecordedClaim> | null, date: string): Rung {
  const base = { id: 'claim', marker: '2', label: 'Record the claim', hint: 'Saves the claim on the policy.' };
  if (claim === null) {
    const running = step === 'claim';
    return { ...base, state: running ? 'busy' : 'waiting', busy: running, busyLabel: 'Recording the claim', tag: { status: 'pending', label: running ? 'Recording' : 'Not sent yet' } };
  }
  if (claim.kind !== 'ok') {
    return { ...base, state: 'stopped', tag: { status: 'fail', label: 'Claim not recorded' }, receipt: <p>{failure(claim)}</p> };
  }
  return {
    ...base,
    state: 'done',
    tag: { status: 'pass', label: 'Claim recorded' },
    carried: { label: 'Claim date', value: date, note: 'from the form above, sent as typed.' },
    receipt: (
      <p>
        Claim {claim.value.reference} recorded; the policy now reads hasClaims {String(claim.value.hasClaims)}.
      </p>
    ),
  };
}

export function RecordClaim() {
  const { reference = '' } = useParams();
  const [policy, setPolicy] = useState<ApiAnswer<Policy> | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [date, setDate] = useState(() => todayInLondon());
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<Step | null>(null);
  const [before, setBefore] = useState<ApiAnswer<CancellationQuote> | null>(null);
  const [claim, setClaim] = useState<ApiAnswer<RecordedClaim> | null>(null);
  const [after, setAfter] = useState<ApiAnswer<CancellationQuote> | null>(null);
  const [sentDate, setSentDate] = useState(date);

  useEffect(() => {
    let current = true;
    void getPolicy(browserDeps(), reference).then((got) => {
      if (current) setPolicy(got);
    });
    return () => {
      current = false;
    };
  }, [reference, attempt]);

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    const deps = browserDeps();
    const asked = date;
    setSentDate(asked);
    setBefore(null);
    setClaim(null);
    setAfter(null);
    setStep('before');
    setBefore(await quoteCancellation(deps, reference, asked));
    setStep('claim');
    const recorded = await recordClaim(deps, reference, description === '' ? { claimDate: asked } : { claimDate: asked, description });
    setClaim(recorded);
    if (recorded.kind === 'ok') {
      setStep('after');
      setAfter(await quoteCancellation(deps, reference, asked));
    }
    setStep(null);
  }

  const busy = step !== null;
  const problem = claim !== null && claim.kind === 'problem' ? claim.problem : null;

  const known = policy?.kind === 'ok' ? policy.value : null;
  const answer =
    claim?.kind === 'ok'
      ? `Claim ${claim.value.reference} is recorded for ${sentDate} and the policy now reads hasClaims ${String(claim.value.hasClaims)}.`
      : claim?.kind === 'problem'
        ? `The claim was refused with ${claim.status}${claim.problem.ruleId ? ` under ${claim.problem.ruleId}` : ''}. Nothing was recorded.`
        : claim?.kind === 'unreachable'
          ? 'The API did not answer, so the claim may not have been recorded.'
          : policy?.kind === 'unreachable'
            ? 'Nothing yet. The API did not answer.'
            : 'No claim is recorded yet. Fill in the date and press Record this claim.';

  const rungs: Rung[] = [
    quoteRung('quote', '1', 'Quote the refund', 'Read-only. A quote never saves.', step, 'before', before, sentDate),
    claimRung(step, claim, sentDate),
    quoteRung('requote', '3', 'Quote again', 'Read-only. The quote after the claim.', step, 'after', after, sentDate),
  ];

  return (
    <form className="s-wb-page" onSubmit={(event) => void submit(event)} noValidate>
      <section className="s-wb-region" data-region="claim-date-and-description" data-req="WB-5">
        <PageHeader
          mode="live"
          eyebrow={`Workbench · Record a claim · policy ${reference}`}
          title="Record a claim"
          question="After a claim is recorded, does the quote I ask for again refund 0.00?"
          answer={answer}
          missingLabel="not in this response"
          status={known ? { value: known.status === 'Active' ? 'pass' : 'warn', label: known.status } : null}
          ids={[
            { label: 'Policy', value: reference },
            ...(known ? [{ label: `Term ${known.currentTermNumber}`, value: `${known.startDate} to ${known.endDate}` }] : []),
          ]}
          liveNote={policy === null ? `GET /policies/${reference} is in flight` : `GET /policies/${reference}: ${policy.kind === 'unreachable' ? 'no response' : policy.status}`}
        />
        <h2 className="s-wb-heading">The claim</h2>
        <Field id="claim-date" label="Claim date" hint="Format yyyy-MM-dd. A date after today is refused under COULD-2a.">
          {(control) => <DateInput {...control} value={date} onChange={(e) => setDate(e.target.value)} />}
        </Field>
        <div className="s-wb-stack">
          <Field id="claim-description" label="Claim description">
            {(control) => <TextArea {...control} maxLength={MAX_DESCRIPTION} value={description} onChange={(e) => setDescription(e.target.value)} />}
          </Field>
        </div>
      </section>

      <section className="s-wb-region" data-region="refund-before-and-after-the-claim-two-quotes" data-req="WB-5">
        <h2 className="s-wb-heading">Refund before and after the claim</h2>
        <p className="s-wb-note">Three rungs, read down: quote, record the claim, quote again.</p>
        <RungSpine label="Record a claim, three rungs: quote, record the claim, quote again" items={rungs} />
        {after?.kind === 'ok' ? (
          <div className="s-wb-stack">
            <h3 className="s-wb-heading">The refund after the claim</h3>
            <RefundWorkedSum
              ruleHref={ruleHref}
              totalRefund={after.value.totalRefund.toFixed(2)}
              terms={after.value.terms.map((term) => ({
                termNumber: term.termNumber,
                ruleApplied: term.ruleApplied,
                daysInTerm: term.daysInTerm,
                daysUsed: term.daysUsed,
                unusedDays: term.unusedDays,
                refundAmount: term.refundAmount.toFixed(2),
              }))}
            />
            <p className="s-wb-note">
              The API quotes {money(after.value.totalRefund)} under {after.value.ruleApplied}.
            </p>
          </div>
        ) : null}
      </section>

      <section className="s-wb-region" data-region="problems-could-2a-could-2b-could-2c" data-req="WB-3">
        <h2 className="s-wb-heading">Problems</h2>
        {problem !== null ? (
          <>
            <ProblemView problem={problem} focusKey={0} headingLevel={3} />
            {problem.items.length > 0 ? (
              <ProblemBanner
                headingLevel={3}
                status={problem.status}
                title={problem.title ?? `The API answered ${problem.status}`}
                detail={problem.detail ?? undefined}
                ruleId={problem.ruleId ?? undefined}
                ruleHref={problem.ruleId !== null ? ruleHref(problem.ruleId) : undefined}
              />
            ) : null}
          </>
        ) : claim?.kind === 'unreachable' || policy?.kind === 'unreachable' ? (
          <ProblemBanner
            unreachable
            title="The API did not answer"
            detail="No request was completed. Nothing was changed by this screen."
            onRetry={() => {
              setPolicy(null);
              setClaim(null);
              setAttempt((n) => n + 1);
            }}
          />
        ) : policy?.kind === 'problem' ? (
          <ProblemView problem={policy.problem} headingLevel={3} />
        ) : (
          <>
            <p className="s-wb-note">No problem. These rules can refuse a claim here:</p>
            <ul className="s-wb-list">
              <li>
                <RuleChip ruleId="COULD-2a" href={ruleHref('COULD-2a')} /> Claim date in the future (422)
              </li>
              <li>
                <RuleChip ruleId="COULD-2c" href={ruleHref('COULD-2c')} /> Claim on a cancelled policy (409)
              </li>
            </ul>
          </>
        )}
      </section>

      <section className="s-wb-region" data-region="record-claim-busy-while-the-request-and-the-two-quotes-run" data-req="BUSY-1">
        <h2 className="s-wb-heading">Record the claim</h2>
        <div className="s-wb-actions">
          <Button type="submit" variant="primary" busy={busy} busyLabel="Recording…" icon={<Receipt aria-hidden="true" />}>
            Record this claim
          </Button>
        </div>
        <p className="s-wb-note">Sends the claim, then asks for the quote again. While the request and the two quotes run, this button is busy and disabled.</p>
        <div className="s-wb-dock">
          <RequestsDrawer />
        </div>
      </section>
    </form>
  );
}
