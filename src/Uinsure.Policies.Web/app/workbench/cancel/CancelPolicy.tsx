import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { X } from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  DateInput,
  Field,
  PageHeader,
  ProblemBanner,
  QuoteCancelCompare,
  RefundWorkedSum,
  RuleChip,
  RungSpine,
} from '../../../kit';
import type { QuoteCancelCompareProps, RungSpineItem } from '../../../kit';
import { cancelPolicy, getPolicy, quoteCancellation } from '../../data/api';
import type { ApiAnswer, CancellationQuote, CancellationResult, Policy } from '../../data/api';
import { RequestsDrawer } from '../RequestsDrawer';
import { browserDeps } from '../browser';
import { ProblemView } from '../ProblemView';
import '../workbench.css';

const ruleHref = (ruleId: string): string => '#/rules/' + ruleId;

// The rules that can refuse a date on this screen.
const REFUSALS = [
  { ruleId: 'CANCEL-3', words: 'Cancellation date in the past (422)' },
  { ruleId: 'CANCEL-4', words: 'Policy already cancelled (409)' },
  { ruleId: 'CANCEL-7', words: 'Cancellation date after the end of cover (422)' },
];

/** A quote the API gave, with the date it was asked for: the date the cancel will carry (not the field's later text). */
interface Quoted {
  date: string;
  quote: CancellationQuote;
}

type Step<T> = { kind: 'idle' } | { kind: 'busy' } | { kind: 'done'; status: number; value: T } | { kind: 'failed'; answer: ApiAnswer<T> };

function stepOf<T>(answer: ApiAnswer<T>): Step<T> {
  return answer.kind === 'ok' ? { kind: 'done', status: answer.status, value: answer.value } : { kind: 'failed', answer };
}

const money = (amount: number): string => amount.toFixed(2);

function Region({ slug, req, heading, children }: { slug: string; req: string; heading: string; children: ReactNode }) {
  return (
    <section className="s-wb-region" data-region={slug} data-req={req}>
      <h2 className="s-wb-heading">{heading}</h2>
      {children}
    </section>
  );
}

function answerOf(quoted: Quoted | null, cancelled: CancellationResult | null, cancelStatus: number | null, quoting: boolean): string {
  if (cancelled) return `Cancelled on ${cancelled.cancellationDate}. The API answered ${cancelStatus}, with a total refund of ${money(cancelled.totalRefund)}.`;
  if (quoting) return 'Not known yet. The quote is in flight, so no refund is shown until the API answers.';
  if (quoted) return `Cancel on ${quoted.date} and the refund quoted is ${money(quoted.quote.totalRefund)}. Nothing is cancelled yet.`;
  return 'Nothing is quoted yet. Quote a date to see the refund before anything is cancelled.';
}

export function CancelPolicy() {
  const { reference = '' } = useParams();
  const [policy, setPolicy] = useState<Policy | null>(null);
  // HONEST-1: true when the re-read after a cancel failed, so the status drawn is the one read before the cancel.
  const [stale, setStale] = useState(false);
  const [date, setDate] = useState('');
  const [quoting, setQuoting] = useState<Step<CancellationQuote>>({ kind: 'idle' });
  const [quoted, setQuoted] = useState<Quoted | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState<Step<CancellationResult>>({ kind: 'idle' });
  const inFlight = useRef(false);

  useEffect(() => {
    let current = true;
    void getPolicy(browserDeps(), reference).then((got) => {
      if (current && got.kind === 'ok') setPolicy(got.value);
    });
    return () => {
      current = false;
    };
  }, [reference]);

  async function quote(asked: string): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setQuoting({ kind: 'busy' });
    setQuoted(null);
    setCancelling({ kind: 'idle' });
    const answer = await quoteCancellation(browserDeps(), reference, asked);
    inFlight.current = false;
    if (answer.kind === 'ok') setQuoted({ date: asked, quote: answer.value });
    setQuoting(stepOf(answer));
  }

  async function cancel(): Promise<void> {
    if (inFlight.current || quoted === null) return;
    inFlight.current = true;
    setCancelling({ kind: 'busy' });
    // The carried date: the one that was quoted, never what the field says now.
    const answer = await cancelPolicy(browserDeps(), reference, quoted.date);
    inFlight.current = false;
    setConfirming(false);
    setCancelling(stepOf(answer));
    // WB-4: after a 201 the policy is read again, so the header shows the status the API holds now.
    if (answer.kind === 'ok' && answer.status === 201) {
      const again = await getPolicy(browserDeps(), reference);
      if (again.kind === 'ok') setPolicy(again.value);
      else setStale(true);
    }
  }

  const quoteBusy = quoting.kind === 'busy';
  const cancelBusy = cancelling.kind === 'busy';
  const cancelled = cancelling.kind === 'done' ? cancelling.value : null;
  const term = policy?.terms[0];
  const failure = cancelling.kind === 'failed' ? cancelling.answer : quoting.kind === 'failed' ? quoting.answer : null;
  const retry = cancelling.kind === 'failed' ? () => void cancel() : () => void quote(date);

  const refundLines =
    quoted === null
      ? []
      : quoted.quote.terms.map((line) => {
          const held = policy?.terms.find((t) => t.termNumber === line.termNumber);
          return {
            termNumber: line.termNumber,
            ruleApplied: line.ruleApplied,
            amount: held ? money(held.amount) : null,
            daysInTerm: line.daysInTerm,
            daysUsed: line.daysUsed,
            unusedDays: line.unusedDays,
            refundAmount: money(line.refundAmount),
          };
        });

  const compareRows: QuoteCancelCompareProps['rows'] =
    quoted !== null && cancelled !== null
      ? [
          { field: 'cancellationDate', quote: quoted.quote.cancellationDate, cancellation: cancelled.cancellationDate },
          { field: 'ruleApplied', quote: quoted.quote.ruleApplied, cancellation: cancelled.ruleApplied },
          { field: 'totalRefund', quote: money(quoted.quote.totalRefund), cancellation: money(cancelled.totalRefund) },
          { field: 'quotedOn', quote: quoted.quote.quotedOn, only: 'quote' },
          { field: 'refunds[0].reference', cancellation: cancelled.refunds[0]?.reference ?? null, only: 'cancellation' },
        ]
      : [];

  const quotePath = `GET /policies/${reference}/cancellation-quote?cancellationDate=${quoted?.date ?? date}`;
  const cancelPath = `POST /policies/${reference}/cancellation`;
  // HONEST-1: every header field that shows the status reads this one value, so none shows the pre-cancel status unmarked.
  const statusShown = policy ? (stale ? `${policy.status} (read before the cancel)` : policy.status) : undefined;

  const rungs: RungSpineItem[] = [
    {
      id: 'quote',
      marker: '1',
      shape: 'round',
      label: 'Quote the date',
      hint: 'Read-only. A quote never saves.',
      state: quoted ? 'done' : quoteBusy ? 'busy' : 'current',
      busy: quoteBusy,
      busyLabel: 'Asking for the quote',
      tag: quoted
        ? { status: 'pass', label: 'Quote returned' }
        : quoting.kind === 'failed'
          ? { status: 'fail', label: 'No quote' }
          : { status: 'pending', label: 'Not quoted yet' },
      receipt: quoted && quoting.kind === 'done' ? (
        <p className="s-wb-note">
          {quotePath} answered {quoting.status}, quotedOn {quoted.quote.quotedOn}.
        </p>
      ) : (
        <p className="s-wb-note">Nothing quoted yet, so there is no quoted date to carry down.</p>
      ),
    },
    {
      id: 'cancel',
      marker: '2',
      shape: 'round',
      label: 'Cancel on that date',
      hint: 'The date is carried down from rung 1, not typed again.',
      state: cancelled ? 'done' : cancelBusy ? 'busy' : quoted ? 'current' : 'waiting',
      busy: cancelBusy,
      busyLabel: 'Sending the cancel',
      tag: cancelled
        ? { status: 'pass', label: 'Cancelled' }
        : cancelBusy
          ? { status: 'pending', label: 'In flight' }
          : cancelling.kind === 'failed'
            ? { status: 'fail', label: 'Refused' }
            : quoted
              ? { status: 'pending', label: 'Ready, not sent' }
              : { status: 'pending', label: 'Waiting for rung 1' },
      carried: quoted
        ? { label: 'Cancellation date', value: quoted.date, note: 'carried from rung 1. To change it, quote again.' }
        : undefined,
      receipt: cancelling.kind === 'done' ? (
        <p className="s-wb-note">
          {cancelPath} answered {cancelling.status}, cancellationDate {cancelling.value.cancellationDate}.
        </p>
      ) : (
        <p className="s-wb-note">
          {quoted ? `${cancelPath} with cancellationDate ${quoted.date}. Not sent.` : 'Waits for rung 1: there is no quoted date to send.'}
        </p>
      ),
    },
    {
      id: 'agree',
      marker: '3',
      shape: 'round',
      label: 'Check they agree',
      hint: 'Quote and cancellation, field by field.',
      state: cancelled ? 'done' : 'waiting',
      tag: cancelled ? { status: 'pass', label: 'Compared' } : { status: 'pending', label: 'Waiting for rung 2' },
      receipt: cancelled ? (
        <QuoteCancelCompare rows={compareRows} />
      ) : (
        <p className="s-wb-note">Waits for rung 2: there is no cancellation to set against the quote yet.</p>
      ),
    },
  ];

  return (
    <div className="s-wb-page">
      <section className="s-wb-region" data-region="cancellation-date-and-quote" data-req="WB-4">
        <PageHeader
          mode="live"
          title="Quote and cancel"
          eyebrow={`Workbench · Quote and cancel · policy ${reference}`}
          question="If I cancel on the date I quoted, is the refund the one I was quoted?"
          answer={answerOf(quoted, cancelled, cancelling.kind === 'done' ? cancelling.status : null, quoteBusy)}
          missingLabel="not returned"
          status={policy ? { value: stale ? 'warn' : 'pass', label: statusShown } : null}
          ids={[
            { label: 'Policy status', value: statusShown, missing: 'not returned' },
            { label: 'Policy', value: reference },
            { label: 'Term 1', value: term ? `${term.startDate} to ${term.endDate}` : null, missing: 'not returned' },
          ]}
          liveNote={quoting.kind === 'done' ? `${quotePath} answered ${quoting.status}` : 'answered by the API when a request is sent'}
        />
        <Field id="cancellationDate" label="Cancellation date" hint="Format yyyy-MM-dd, the only format the API accepts. Shown as typed.">
          {(control) => <DateInput {...control} value={date} onChange={(e) => setDate(e.target.value)} />}
        </Field>
      </section>

      <section className="s-wb-region" data-region="quote-and-cancel-actions-each-busy-while-its-request-runs" data-req="BUSY-1">
        <h2 className="s-wb-heading">Actions</h2>
        <div className="s-wb-actions">
          {quoted !== null && cancelled === null ? (
            <Button variant="destructive" icon={<X aria-hidden="true" />} disabled={quoteBusy || cancelBusy} onClick={() => setConfirming(true)}>
              {`Cancel on ${quoted.date}`}
            </Button>
          ) : null}
          {cancelled === null ? (
            <Button variant="secondary" busy={quoteBusy} busyLabel="Quoting…" disabled={cancelBusy} onClick={() => void quote(date)}>
              {quoted !== null ? 'Quote again' : 'Quote this date'}
            </Button>
          ) : null}
        </div>
        {quoted !== null && cancelled === null ? (
          <p className="s-wb-note">Cancel asks you to confirm, then sends exactly the quoted date, {quoted.date}.</p>
        ) : null}
        {cancelBusy ? <p role="status">In flight: {cancelPath}. Waiting for the API to answer.</p> : null}
        {confirming && quoted !== null ? (
          <ConfirmDialog
            title={`Cancel policy ${reference}?`}
            confirmLabel={`Cancel policy on ${quoted.date}`}
            busyLabel="Cancelling…"
            busy={cancelBusy}
            onConfirm={() => void cancel()}
            onCancel={() => setConfirming(false)}
          >
            <p>
              This cancels policy {reference} on {quoted.date}, the quoted date. The refund quoted is {money(quoted.quote.totalRefund)}. A
              cancellation cannot be undone.
            </p>
          </ConfirmDialog>
        ) : null}
      </section>

      <Region slug="problems-cancel-3-cancel-4-cancel-7" req="WB-3" heading="Problems">
        {failure?.kind === 'problem' ? (
          <ProblemView problem={failure.problem} />
        ) : failure?.kind === 'unreachable' ? (
          <ProblemBanner
            unreachable
            title="The API did not answer"
            detail="No request was completed. Nothing was changed by this screen."
            extensions={[{ name: 'error', value: failure.reason }]}
            onRetry={retry}
          />
        ) : (
          <>
            <p className="s-wb-note">No problem. These rules can refuse a date here:</p>
            <ul className="s-wb-list">
              {REFUSALS.map(({ ruleId, words }) => (
                <li key={ruleId}>
                  <RuleChip ruleId={ruleId} href={ruleHref(ruleId)} /> {words}
                </li>
              ))}
            </ul>
          </>
        )}
      </Region>

      <Region slug="the-refund-as-a-worked-sum-per-term-with-the-rule-applied" req="WB-4" heading="The refund, term by term">
        {quoted === null ? (
          <p className="s-wb-note">Nothing quoted yet, so there is no refund to work out. The days and the refund are the API&apos;s own.</p>
        ) : (
          <>
            <p className="s-wb-note">
              Quote for {quoted.date}, rule {quoted.quote.ruleApplied}. The days and the refund are the quote&apos;s own.
            </p>
            <RefundWorkedSum terms={refundLines} totalRefund={money(quoted.quote.totalRefund)} ruleHref={ruleHref} />
          </>
        )}
      </Region>

      <Region slug="cancel-with-the-quoted-date-then-quote-and-cancellation-compared" req="WB-4" heading="Quote, cancel, agree">
        <RungSpine label="Quote and cancel, three rungs" items={rungs} headingLevel={3} />
      </Region>

      <Region slug="the-requests-as-sent-inspector" req="WB-7" heading="Requests">
        <div className="s-wb-dock">
          <RequestsDrawer />
        </div>
      </Region>
    </div>
  );
}
