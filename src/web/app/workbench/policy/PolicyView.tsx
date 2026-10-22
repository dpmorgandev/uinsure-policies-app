import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { DataTable, KeyValueList, PageHeader, ProblemBanner, StatusTag, TermTimeline } from '../../../kit';
import type { DataTableColumn, KeyValueItem, Status, TermTimelineProps } from '../../../kit';
import { getPolicy } from '../../data/api';
import type { ApiAnswer, Policy, Problem } from '../../data/api';
import { NotBuiltRegion } from '../../shell/Rung';
import { browserDeps } from '../browser';
import { ProblemView } from '../ProblemView';
import '../workbench.css';

// How the API's status word is drawn. The word shown is always the API's own.
const STATUS_TAGS: Record<string, Status> = { Pending: 'pending', Active: 'pass', Expired: 'warn', Cancelled: 'fail' };

type TimelineClaim = NonNullable<TermTimelineProps['claims']>[number];
type TimelineCancellation = NonNullable<TermTimelineProps['cancellation']>;

interface Row {
  id: string;
  cells: (string | null)[];
}

function columns(headers: string[], mono: number[] = [], numeric: number[] = []): DataTableColumn<Row>[] {
  return [
    { id: 'n', header: '#', cell: (row) => `#${row.id}`, rowHeader: true, sortable: true },
    ...headers.map((header, index) => ({
      id: `c${index}`,
      header,
      cell: (row: Row) => row.cells[index] ?? null,
      mono: mono.includes(index),
      numeric: numeric.includes(index),
    })),
  ];
}

const HOLDER_COLUMNS = columns(['First name', 'Last name', 'Date of birth'], [2]);
const PAYMENT_COLUMNS = columns(['Reference', 'Type', 'Amount'], [0], [2]);
const REFUND_COLUMNS = columns(['Refund reference', 'Type', 'Amount', 'Payment reference'], [0, 3], [2]);
const CLAIM_COLUMNS = columns(['Claim reference', 'Date', 'Description'], [0, 1]);

const numbered = (cells: (string | null)[][]): Row[] => cells.map((row, index) => ({ id: String(index + 1), cells: row }));

const sorted = { columnId: 'n', direction: 'ascending' } as const;

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

function Region({ slug, req, heading, children }: { slug: string; req: string; heading: string; children: ReactNode }) {
  return (
    <section className="s-wb-region" data-region={slug} data-req={req}>
      <h2 className="s-wb-heading">{heading}</h2>
      {children}
    </section>
  );
}

/** A section's value when the API sent no policy: the words say why, and no figure is drawn. */
function notReturned(label: string, why: string): ReactNode {
  return <KeyValueList items={[{ label, missing: why }]} />;
}

interface PolicyDetailProps {
  policy: Policy;
}

function PolicyDetail({ policy }: PolicyDetailProps) {
  const reference = policy.reference;
  const { claims, refunds, cancellation } = policy;

  const timelineClaims: TimelineClaim[] = claims.map((claim) => ({
    reference: claim.reference,
    claimDate: claim.claimDate,
    description: claim.description,
  }));
  const timelineCancellation: TimelineCancellation | null = cancellation && {
    cancellationDate: cancellation.cancellationDate,
    ruleApplied: cancellation.ruleApplied,
    totalRefund: cancellation.totalRefund.toFixed(2),
  };

  return (
    <>
      <Region slug="terms-timeline-terms-payments-claims-cancellation-dates-the-api-returned-only" req="WB-2" heading="Terms timeline">
        <TermTimeline
          policyReference={reference}
          ruleHref={(ruleId) => '#/rules/' + ruleId}
          claims={timelineClaims}
          cancellation={timelineCancellation}
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
        {claims.length === 0 && cancellation === null ? (
          <p className="s-wb-note">The response holds no claim and no cancellation, so the timeline has no rung for either.</p>
        ) : null}
      </Region>

      <Region slug="policyholders-and-property" req="WB-2" heading="Policyholders and property">
        <div className="s-wb-stack">
          <h3 className="s-wb-heading">Policyholders</h3>
          <DataTable
            caption={`Policyholders on ${reference}, numbered in the order the API returned them. ${plural(policy.policyholders.length, 'policyholder', 'policyholders')}.`}
            columns={HOLDER_COLUMNS}
            rows={numbered(policy.policyholders.map((h) => [h.firstName, h.lastName, h.dateOfBirth]))}
            sort={sorted}
          />
        </div>
        <div className="s-wb-stack">
          <h3 className="s-wb-heading">Property</h3>
          <KeyValueList
            missingLabel="null: the API returned none"
            items={[
              { label: 'Address line 1', value: policy.property.addressLine1 },
              { label: 'Address line 2', value: policy.property.addressLine2 },
              { label: 'Address line 3', value: policy.property.addressLine3 },
              { label: 'Postcode', value: policy.property.postcode, mono: true },
            ]}
          />
        </div>
      </Region>

      <Region slug="payments-and-refunds" req="WB-2" heading="Payments and refunds">
        <div className="s-wb-stack">
          <h3 className="s-wb-heading">Payments</h3>
          <DataTable
            caption={`Payments on ${reference}, numbered in the order the API returned them. ${plural(policy.payments.length, 'payment', 'payments')}.`}
            columns={PAYMENT_COLUMNS}
            rows={numbered(policy.payments.map((p) => [p.reference, p.type, p.amount.toFixed(2)]))}
            sort={sorted}
            empty={{ context: 'empty', title: `The API returned no payments for ${reference}.` }}
          />
        </div>
        <div className="s-wb-stack">
          <h3 className="s-wb-heading">Refunds</h3>
          <DataTable
            caption={`Refunds on ${reference}: ${plural(refunds.length, 'refund', 'refunds')} returned.`}
            columns={REFUND_COLUMNS}
            rows={numbered(refunds.map((r) => [r.reference, r.type, r.amount.toFixed(2), r.paymentReference]))}
            sort={sorted}
            empty={{
              context: 'empty',
              title: `The API returned no refunds for ${reference}.`,
              why: 'refunds is an empty list. Quoting a cancellation is not built yet.',
            }}
          />
        </div>
      </Region>

      <Region slug="claims" req="WB-2 WB-5" heading="Claims">
        <DataTable
          caption={`Claims on ${reference}: ${plural(claims.length, 'claim', 'claims')} returned (hasClaims is ${String(policy.hasClaims)}).`}
          columns={CLAIM_COLUMNS}
          rows={numbered(claims.map((c) => [c.reference, c.claimDate, c.description]))}
          sort={sorted}
          empty={{
            context: 'empty',
            title: `The API returned no claims for ${reference}.`,
            why: 'claims is an empty list. A recorded claim would appear here as one numbered row.',
          }}
        />
      </Region>

      <Region
        slug="cancellation-summary-from-get-per-term-breakdown-from-the-logged-cancel-response"
        req="WB-2 WB-4"
        heading="Cancellation"
      >
        <KeyValueList
          items={
            cancellation
              ? [
                  { label: 'Cancellation date', value: cancellation.cancellationDate, mono: true },
                  { label: 'Rule applied', value: cancellation.ruleApplied, mono: true },
                  { label: 'Total refund', value: cancellation.totalRefund.toFixed(2), mono: true },
                  { label: 'Per-term breakdown, from the cancel response', missing: 'no cancel response is logged for this policy' },
                ]
              : [
                  { label: 'Summary, from the GET', missing: 'cancellation is null: this policy has not been cancelled' },
                  { label: 'Per-term breakdown, from the cancel response', missing: 'no cancel response is logged for this policy' },
                ]
          }
        />
      </Region>

      <Region slug="record-level-problem-banner-404-409" req="WB-3" heading="Record-level problem">
        <p className="s-wb-note">
          <StatusTag status="pass">200</StatusTag> GET /policies/{reference} answered 200, so there is no problem to show. A 404 or
          a 409 on this policy would appear here as a banner.
        </p>
      </Region>
    </>
  );
}

/** What a policy that did not come back leaves in each section: the API's own words, and no figure. */
function NoPolicy({ why, problem }: { why: string; problem: ReactNode }) {
  return (
    <>
      <Region slug="terms-timeline-terms-payments-claims-cancellation-dates-the-api-returned-only" req="WB-2" heading="Terms timeline">
        {notReturned('Terms', `not returned: ${why}`)}
      </Region>
      <Region slug="policyholders-and-property" req="WB-2" heading="Policyholders and property">
        <KeyValueList
          items={[
            { label: 'Policyholders', missing: 'not returned' },
            { label: 'Property', missing: 'not returned' },
          ]}
        />
      </Region>
      <Region slug="payments-and-refunds" req="WB-2" heading="Payments and refunds">
        <KeyValueList
          items={[
            { label: 'Payments', missing: 'not returned' },
            { label: 'Refunds', missing: 'not returned' },
          ]}
        />
      </Region>
      <Region slug="claims" req="WB-2 WB-5" heading="Claims">
        {notReturned('Claims', `not returned: this is not an empty list, ${why}`)}
      </Region>
      <Region
        slug="cancellation-summary-from-get-per-term-breakdown-from-the-logged-cancel-response"
        req="WB-2 WB-4"
        heading="Cancellation"
      >
        <KeyValueList
          items={[
            { label: 'Summary, from the GET', missing: 'not returned' },
            { label: 'Per-term breakdown, from the cancel response', missing: 'no cancel response is logged for this policy' },
          ]}
        />
      </Region>
      <Region slug="record-level-problem-banner-404-409" req="WB-3" heading="Record-level problem">
        {problem}
      </Region>
    </>
  );
}

/** Why a policy did not come back, in the API's own status and title; no reason is invented. */
function problemWhy(status: number, problem: Problem): string {
  return `the API answered ${status}${problem.title ? `, ${problem.title}` : ''}`;
}

function headerOf(reference: string, answer: ApiAnswer<Policy> | null): ReactNode {
  const common = {
    mode: 'live' as const,
    eyebrow: `Workbench · Policy · ${reference}`,
    question: 'What does the API say this policy is, term by term, and what has happened to it?',
    missingLabel: 'not in this response',
  };
  if (answer === null) {
    return (
      <PageHeader
        {...common}
        title={`Policy ${reference}`}
        answer="Waiting for the API. No status, term, date or amount is shown until it answers."
        ids={[{ label: 'Policy', value: reference }]}
        liveNote={`GET /policies/${reference} is in flight`}
      />
    );
  }
  if (answer.kind === 'ok') {
    const policy = answer.value;
    return (
      <PageHeader
        {...common}
        title={`Policy ${policy.reference}`}
        answer={`${policy.status}. Term ${policy.currentTermNumber} runs ${policy.startDate} to ${policy.endDate}, with ${plural(policy.payments.length, 'payment', 'payments')}, ${plural(policy.refunds.length, 'refund', 'refunds')} and ${plural(policy.claims.length, 'claim', 'claims')}.`}
        status={{ value: STATUS_TAGS[policy.status] ?? 'warn', label: policy.status }}
        ids={[
          { label: 'Policy', value: policy.reference },
          { label: 'Type', value: policy.type },
          { label: `Term ${policy.currentTermNumber}`, value: `${policy.startDate} to ${policy.endDate}` },
        ]}
        liveNote={`GET /policies/${policy.reference} answered ${answer.status}`}
      />
    );
  }
  if (answer.kind === 'problem') {
    return (
      <PageHeader
        {...common}
        title={`Policy ${reference}`}
        answer={`The API answered ${answer.status}${answer.problem.title ? `, ${answer.problem.title}` : ''}, so no status, term, date or amount is shown: none was returned.`}
        ids={[{ label: 'Policy', value: reference }]}
        liveNote={`GET /policies/${reference} answered ${answer.status}`}
      />
    );
  }
  return (
    <PageHeader
      {...common}
      title={`Policy ${reference}`}
      answer="Nothing yet. The API did not answer, so no status, term, date or amount is shown: none was returned."
      ids={[{ label: 'Policy', value: reference }]}
      liveNote="no response: nothing to record"
    />
  );
}

export function PolicyView() {
  const { reference = '' } = useParams();
  const [attempt, setAttempt] = useState(0);
  const key = `${reference}#${attempt}`;
  const [settled, setSettled] = useState<{ key: string; answer: ApiAnswer<Policy> } | null>(null);
  const answer = settled?.key === key ? settled.answer : null;

  useEffect(() => {
    let current = true;
    void getPolicy(browserDeps(), reference).then((got) => {
      if (current) setSettled({ key, answer: got });
    });
    return () => {
      current = false;
    };
  }, [reference, key]);

  const status: KeyValueItem[] = [
    { label: 'Current term number', missing: 'not returned' },
    { label: 'Start date', missing: 'not returned' },
    { label: 'End date', missing: 'not returned' },
    { label: 'Amount', missing: 'not returned' },
  ];

  return (
    <div className="s-wb-page">
      <section className="s-wb-region" data-region="status-and-current-term" data-req="WB-2">
        {headerOf(reference, answer)}
        <div className="s-wb-stack">
          <h2 className="s-wb-heading">Current term</h2>
          {answer?.kind === 'ok' ? (
            <KeyValueList
              items={[
                { label: 'Current term number', value: String(answer.value.currentTermNumber), mono: true },
                { label: 'Start date', value: answer.value.startDate, mono: true },
                { label: 'End date', value: answer.value.endDate, mono: true },
                { label: 'Amount', value: answer.value.amount.toFixed(2), mono: true },
                { label: 'Has claims', value: String(answer.value.hasClaims), mono: true },
                { label: 'Auto renew', value: String(answer.value.autoRenew), mono: true },
              ]}
            />
          ) : (
            <KeyValueList
              items={status.map((item) => ({
                ...item,
                missing: answer === null ? 'waiting for the API' : 'not returned',
              }))}
            />
          )}
        </div>
      </section>

      {answer?.kind === 'ok' ? (
        <PolicyDetail policy={answer.value} />
      ) : answer === null ? (
        <NoPolicy why="the API has not answered yet" problem={<p className="s-wb-note">Waiting for the API to answer.</p>} />
      ) : (
        <NoPolicy
          why={answer.kind === 'problem' ? problemWhy(answer.status, answer.problem) : 'the API did not answer'}
          problem={
            answer.kind === 'problem' ? (
              <ProblemView problem={answer.problem} />
            ) : answer.kind === 'unreachable' ? (
              <ProblemBanner
                unreachable
                title="The API did not answer"
                detail="No request was completed. Nothing was changed by this screen."
                extensions={[{ name: 'error', value: answer.reason }]}
                onRetry={() => setAttempt((n) => n + 1)}
              />
            ) : null
          }
        />
      )}

      <section className="s-wb-region" data-region="actions-quote-and-cancel-record-a-claim-renew" data-req="WB-5">
        <h2 className="s-wb-heading">Actions</h2>
        <ul className="s-wb-list">
          <li>
            <Link to={`/workbench/policies/${encodeURIComponent(reference)}/claims/new`}>Record a claim</Link>
          </li>
          <li>
            <Link to={`/workbench/policies/${encodeURIComponent(reference)}/renew`}>Renew</Link>
          </li>
        </ul>
        <NotBuiltRegion region="quote-and-cancel" name="quote and cancel" />
      </section>
      <NotBuiltRegion region="requests-that-touched-this-policy" name="requests that touched this policy" />
    </div>
  );
}
