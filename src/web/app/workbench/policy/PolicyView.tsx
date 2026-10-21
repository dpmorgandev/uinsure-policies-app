import { DataTable, KeyValueList, PageHeader, StatusTag, TermTimeline } from '../../../kit';
import type { DataTableColumn } from '../../../kit';
import { NotBuiltRegion } from '../../shell/Rung';
import '../workbench.css';

// Stub: the canned content of docs/ui/derived/W1/wb-policy/populated.html. The client replaces it.
const REFERENCE = 'F2-MVFJQA9DQG';
const PAYMENT_REFERENCE = 'PAY-0e2c23022f8e492885b80b36e774a63d';

interface HolderRow {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

interface PaymentRow {
  id: string;
  reference: string;
  type: string;
  amount: string;
}

const HOLDER_COLUMNS: DataTableColumn<HolderRow>[] = [
  { id: 'n', header: '#', cell: (row) => `#${row.id}`, rowHeader: true, sortable: true },
  { id: 'firstName', header: 'First name', cell: (row) => row.firstName },
  { id: 'lastName', header: 'Last name', cell: (row) => row.lastName },
  { id: 'dateOfBirth', header: 'Date of birth', cell: (row) => row.dateOfBirth, mono: true },
];

const PAYMENT_COLUMNS: DataTableColumn<PaymentRow>[] = [
  { id: 'n', header: '#', cell: (row) => `#${row.id}`, rowHeader: true, sortable: true },
  { id: 'reference', header: 'Reference', cell: (row) => row.reference, mono: true },
  { id: 'type', header: 'Type', cell: (row) => row.type },
  { id: 'amount', header: 'Amount', cell: (row) => row.amount, numeric: true },
];

const HOLDERS: HolderRow[] = [
  { id: '1', firstName: 'Grace', lastName: 'Hopper', dateOfBirth: '1990-04-12' },
  { id: '2', firstName: 'Alan', lastName: 'Turing', dateOfBirth: '1992-06-23' },
];

const PAYMENTS: PaymentRow[] = [{ id: '1', reference: PAYMENT_REFERENCE, type: 'Card', amount: '412.34' }];

export function PolicyView() {
  return (
    <div className="s-wb-page">
      <section className="s-wb-region" data-region="status-and-current-term" data-req="WB-2">
        <PageHeader
          mode="live"
          title={`Policy ${REFERENCE}`}
          eyebrow={`Workbench · Policy · ${REFERENCE}`}
          question="What does the API say this policy is, term by term, and what has happened to it?"
          answer="Pending. Term 1 runs 2026-11-18 to 2027-11-17, with one payment of 412.34 by Card. No claims, no refunds, no cancellation."
          status={{ value: 'pending', label: 'Pending' }}
          ids={[
            { label: 'Policy', value: REFERENCE },
            { label: 'Type', value: 'BuyToLet' },
            { label: 'Term 1', value: '2026-11-18 to 2027-11-17' },
          ]}
          liveNote={`GET /policies/${REFERENCE} answered 200, recorded 2026-10-19T17:46:34Z (GET-1 · sold policy reads back in full → 200)`}
        />
        <div className="s-wb-stack">
          <h2 className="s-wb-heading">Current term</h2>
          <KeyValueList
            items={[
              { label: 'Current term number', value: '1', mono: true },
              { label: 'Start date', value: '2026-11-18', mono: true },
              { label: 'End date', value: '2027-11-17', mono: true },
              { label: 'Amount', value: '412.34', mono: true },
              { label: 'Has claims', value: 'false', mono: true },
              { label: 'Auto renew', value: 'false', mono: true },
            ]}
          />
        </div>
      </section>

      <section
        className="s-wb-region"
        data-region="terms-timeline-terms-payments-claims-cancellation-dates-the-api-returned-only"
        data-req="WB-2"
      >
        <h2 className="s-wb-heading">Terms timeline</h2>
        <TermTimeline
          policyReference={REFERENCE}
          terms={[
            {
              termNumber: 1,
              startDate: '2026-11-18',
              endDate: '2027-11-17',
              amount: '412.34',
              payment: { type: 'Card', reference: PAYMENT_REFERENCE, amount: '412.34' },
            },
          ]}
        />
        <p className="s-wb-note">
          The response holds no claim and no cancellation, so the timeline has no rung for either. The payment reference is the
          one on term 1 in the response.
        </p>
      </section>

      <section className="s-wb-region" data-region="policyholders-and-property" data-req="WB-2">
        <h2 className="s-wb-heading">Policyholders and property</h2>
        <div className="s-wb-stack">
          <h3 className="s-wb-heading">Policyholders</h3>
          <DataTable
            caption={`Policyholders on ${REFERENCE}, numbered in the order the API returned them. Two policyholders.`}
            columns={HOLDER_COLUMNS}
            rows={HOLDERS}
            sort={{ columnId: 'n', direction: 'ascending' }}
          />
        </div>
        <div className="s-wb-stack">
          <h3 className="s-wb-heading">Property</h3>
          <KeyValueList
            items={[
              { label: 'Address line 1', value: '7 Canal St' },
              { label: 'Address line 2', value: 'Flat 3' },
              { label: 'Address line 3', value: 'Ancoats' },
              { label: 'Postcode', value: 'M4 6BX', mono: true },
            ]}
          />
        </div>
      </section>

      <section className="s-wb-region" data-region="payments-and-refunds" data-req="WB-2">
        <h2 className="s-wb-heading">Payments and refunds</h2>
        <div className="s-wb-stack">
          <h3 className="s-wb-heading">Payments</h3>
          <DataTable
            caption={`Payments on ${REFERENCE}, numbered in the order the API returned them. One payment.`}
            columns={PAYMENT_COLUMNS}
            rows={PAYMENTS}
            sort={{ columnId: 'n', direction: 'ascending' }}
          />
        </div>
        <div className="s-wb-stack">
          <h3 className="s-wb-heading">Refunds</h3>
          <DataTable
            caption={`Refunds on ${REFERENCE}: none returned.`}
            columns={[
              { id: 'n', header: '#', cell: () => null, sortable: true },
              { id: 'reference', header: 'Refund reference', cell: () => null },
              { id: 'type', header: 'Type', cell: () => null },
              { id: 'amount', header: 'Amount', cell: () => null, numeric: true },
              { id: 'payment', header: 'Payment reference', cell: () => null },
            ]}
            rows={[]}
            empty={{
              context: 'empty',
              title: `The API returned no refunds for ${REFERENCE}.`,
              why: 'refunds is an empty list and cancellation is null: nothing has been cancelled.',
              to: { label: 'Quote a cancellation', href: `#/workbench/policies/${REFERENCE}/cancel` },
            }}
          />
        </div>
      </section>

      <section className="s-wb-region" data-region="claims" data-req="WB-2 WB-5">
        <h2 className="s-wb-heading">Claims</h2>
        <DataTable
          caption={`Claims on ${REFERENCE}: none returned (hasClaims is false).`}
          columns={[
            { id: 'n', header: '#', cell: () => null, sortable: true },
            { id: 'reference', header: 'Claim reference', cell: () => null },
            { id: 'date', header: 'Date', cell: () => null },
            { id: 'description', header: 'Description', cell: () => null },
          ]}
          rows={[]}
          empty={{
            context: 'empty',
            title: `The API returned no claims for ${REFERENCE}.`,
            why: 'claims is an empty list and hasClaims is false. A recorded claim would appear here as one numbered row.',
            to: { label: 'Record a claim', href: `#/workbench/policies/${REFERENCE}/claims/new` },
          }}
        />
      </section>

      <section
        className="s-wb-region"
        data-region="cancellation-summary-from-get-per-term-breakdown-from-the-logged-cancel-response"
        data-req="WB-2 WB-4"
      >
        <h2 className="s-wb-heading">Cancellation</h2>
        <KeyValueList
          items={[
            { label: 'Summary, from the GET', missing: 'cancellation is null: this policy has not been cancelled' },
            { label: 'Per-term breakdown, from the cancel response', missing: 'no cancel response is logged for this policy' },
          ]}
        />
      </section>

      <section className="s-wb-region" data-region="record-level-problem-banner-404-409" data-req="WB-3">
        <h2 className="s-wb-heading">Record-level problem</h2>
        <p className="s-wb-note">
          <StatusTag status="pass">200</StatusTag> GET /policies/{REFERENCE} answered 200, so there is no problem to show. A 404
          or a 409 on this policy would appear here as a banner.
        </p>
      </section>

      <NotBuiltRegion region="actions-quote-and-cancel-record-a-claim-renew" name="actions: quote and cancel, record a claim, renew" />
      <NotBuiltRegion region="requests-that-touched-this-policy" name="requests that touched this policy" />
    </div>
  );
}
