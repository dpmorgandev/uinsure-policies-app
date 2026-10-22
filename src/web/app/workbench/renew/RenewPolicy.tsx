import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router';
import { RefreshCw } from 'lucide-react';
import { Button, Field, MoneyInput, PageHeader, ProblemBanner, Select, TermTimeline } from '../../../kit';
import { getPolicy, renewPolicy } from '../../data/api';
import type { ApiAnswer, PaymentMethod, Policy } from '../../data/api';
import { browserDeps } from '../browser';
import { ProblemView } from '../ProblemView';
import { RequestsDrawer } from '../RequestsDrawer';
import '../workbench.css';

const PAYMENT_METHODS = [
  { value: 'Card', label: 'Card' },
  { value: 'DirectDebit', label: 'Direct Debit' },
  { value: 'Cheque', label: 'Cheque' },
];

/** The method the current term was paid by, from the payment its term points at. */
function termMethod(policy: Policy): PaymentMethod {
  const term = policy.terms.find((t) => t.termNumber === policy.currentTermNumber);
  const paid = policy.payments.find((p) => p.reference === term?.paymentReference)?.type;
  const method = PAYMENT_METHODS.find((m) => m.value === paid);
  return (method?.value ?? 'Card') as PaymentMethod;
}

function Timeline({ policy }: { policy: Policy }) {
  return (
    <TermTimeline
      policyReference={policy.reference}
      ruleHref={(ruleId) => '#/rules/' + ruleId}
      claims={policy.claims.map((c) => ({ reference: c.reference, claimDate: c.claimDate, description: c.description }))}
      cancellation={
        policy.cancellation && {
          cancellationDate: policy.cancellation.cancellationDate,
          ruleApplied: policy.cancellation.ruleApplied,
          totalRefund: policy.cancellation.totalRefund.toFixed(2),
        }
      }
      terms={policy.terms.map((term) => {
        const payment = policy.payments.find((p) => p.reference === term.paymentReference);
        return {
          termNumber: term.termNumber,
          startDate: term.startDate,
          endDate: term.endDate,
          amount: term.amount.toFixed(2),
          payment: payment
            ? { type: payment.type, reference: payment.reference, amount: payment.amount.toFixed(2) }
            : { type: 'not returned', reference: term.paymentReference },
        };
      })}
    />
  );
}

export function RenewPolicy() {
  const { reference = '' } = useParams();
  const [policy, setPolicy] = useState<ApiAnswer<Policy> | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [amount, setAmount] = useState('');
  // WB-5: the term amount is only a starting value; it never replaces what the person typed first.
  const typedAmount = useRef(false);
  const [method, setMethod] = useState<PaymentMethod>('Card');
  const [renewal, setRenewal] = useState<ApiAnswer<Policy> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let current = true;
    void getPolicy(browserDeps(), reference).then((got) => {
      if (!current) return;
      setPolicy(got);
      if (got.kind === 'ok') {
        if (!typedAmount.current) setAmount(got.value.amount.toFixed(2));
        setMethod(termMethod(got.value));
      }
    });
    return () => {
      current = false;
    };
  }, [reference, attempt]);

  const known = policy?.kind === 'ok' ? policy.value : null;
  // After a renewal the API answers with the whole policy, new term last.
  const shown = renewal?.kind === 'ok' ? renewal.value : known;

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (known === null) return;
    setBusy(true);
    setRenewal(await renewPolicy(browserDeps(), reference, known.autoRenew ? { amount: Number(amount), paymentMethod: method } : { amount: Number(amount) }));
    setBusy(false);
  }

  const answer =
    renewal?.kind === 'ok'
      ? `Renewed. The policy now has ${renewal.value.terms.length} terms, the new one last.`
      : renewal?.kind === 'problem'
        ? `Not now. The renewal was refused with ${renewal.status}${renewal.problem.ruleId ? ` under ${renewal.problem.ruleId}` : ''}.`
        : renewal?.kind === 'unreachable'
          ? 'The API did not answer, so the renewal may not have gone through.'
          : policy?.kind === 'ok'
            ? 'Not asked yet. Press Renew policy to find out whether the API takes the renewal.'
            : 'Nothing yet. The policy was not read.';

  return (
    <form className="s-wb-page" onSubmit={(event) => void submit(event)} noValidate>
      <section
        className="s-wb-region"
        data-region="renewal-amount-and-payment-method-default-shown-from-the-current-term-omitted-when-auto-renew-is-off"
        data-req="WB-5"
      >
        <PageHeader
          mode="live"
          eyebrow={`Workbench · Renew · policy ${reference}`}
          title="Renew"
          question="If I renew this policy now, will the API take the renewal, and on which amount and payment method?"
          answer={answer}
          missingLabel="not in this response"
          status={known ? { value: known.status === 'Active' ? 'pass' : 'warn', label: known.status } : null}
          ids={[
            { label: 'Policy', value: reference },
            ...(known
              ? [
                  { label: 'Auto-renew', value: String(known.autoRenew) },
                  { label: `Term ${known.currentTermNumber}`, value: `${known.startDate} to ${known.endDate}` },
                ]
              : []),
          ]}
          liveNote={policy === null ? `GET /policies/${reference} is in flight` : `GET /policies/${reference}: ${policy.kind === 'unreachable' ? 'no response' : policy.status}`}
        />
        <h2 className="s-wb-heading">1 · Amount and payment method</h2>
        <div className="s-wb-stack">
          <Field
            id="amount"
            label="Renewal amount"
            hint={known ? `The new term's amount, at most 2 decimal places. Term ${known.currentTermNumber} is ${known.amount.toFixed(2)}.` : "The new term's amount, at most 2 decimal places."}
          >
            {(control) => (
              <MoneyInput
                {...control}
                value={amount}
                onChange={(e) => {
                  typedAmount.current = true;
                  setAmount(e.target.value);
                }}
              />
            )}
          </Field>
          {known?.autoRenew ? (
            <Field
              id="paymentMethod"
              label="Payment method"
              hint={`Defaults from term ${known.currentTermNumber}. Cheque is refused for an auto-renewing renewal.`}
            >
              {(control) => <Select {...control} options={PAYMENT_METHODS} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} />}
            </Field>
          ) : null}
        </div>
      </section>

      <section
        className="s-wb-region"
        data-region="problems-renew-1-2-with-its-window-renew-3b-renew-5-renew-6-could-3-several-at-once-listed-not-placed"
        data-req="WB-3"
      >
        <h2 className="s-wb-heading">2 · What the API said</h2>
        {renewal?.kind === 'problem' ? (
          <>
            <ProblemView problem={renewal.problem} headingLevel={3} />
            {renewal.problem.items.length > 0 ? (
              <ProblemBanner
                headingLevel={3}
                status={renewal.problem.status}
                title={renewal.problem.title ?? `The API answered ${renewal.problem.status}`}
                detail={renewal.problem.detail ?? undefined}
                ruleId={renewal.problem.ruleId ?? undefined}
                ruleHref={renewal.problem.ruleId !== null ? '#/rules/' + renewal.problem.ruleId : undefined}
              />
            ) : null}
          </>
        ) : renewal?.kind === 'unreachable' || policy?.kind === 'unreachable' ? (
          <ProblemBanner
            unreachable
            title="The API did not answer"
            detail="No request was completed. Nothing was changed by this screen."
            onRetry={() => {
              setPolicy(null);
              setRenewal(null);
              setAttempt((n) => n + 1);
            }}
          />
        ) : policy?.kind === 'problem' ? (
          <ProblemView problem={policy.problem} headingLevel={3} />
        ) : (
          <p className="s-wb-note">No problem yet. The API's answer to the renewal appears here, with every rule it names.</p>
        )}
      </section>

      <section className="s-wb-region" data-region="the-new-term-last-on-the-timeline" data-req="WB-5 WB-2">
        <h2 className="s-wb-heading">3 · The new term, last on the timeline</h2>
        {shown !== null ? (
          <>
            <p className="s-wb-note">
              Dates from the API's {renewal?.kind === 'ok' ? 'renewal' : `GET /policies/${reference}`} answer. A renewal that succeeds returns the full policy with the new term last.
            </p>
            <Timeline policy={shown} />
          </>
        ) : (
          <p className="s-wb-note">No policy was read, so there are no dates to draw.</p>
        )}
      </section>

      <section className="s-wb-region" data-region="renew-busy-while-the-request-runs" data-req="BUSY-1">
        <h2 className="s-wb-heading">4 · Renew</h2>
        <p className="s-wb-note">Sends POST /policies/{reference}/renewals with the amount{known?.autoRenew ? ' and payment method' : ''} above.</p>
        <div className="s-wb-actions">
          <Button type="submit" variant="primary" busy={busy} busyLabel="Renewing…" disabled={known === null} icon={<RefreshCw aria-hidden="true" />}>
            Renew policy
          </Button>
          <a href={`#/workbench/policies/${encodeURIComponent(reference)}`}>Open policy {reference}</a>
        </div>
      </section>
      <RequestsDrawer />
    </form>
  );
}
