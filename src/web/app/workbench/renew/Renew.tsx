import { RefreshCw } from 'lucide-react';
import { Button, ProblemBanner, TermTimeline } from '../../../kit';
import { NotBuiltRegion } from '../../shell/Rung';
import '../workbench.css';

// Stub: the canned content of docs/ui/derived/W1/wb-renew/populated.html. The client replaces it.
const REFERENCE = 'F4-MVFJSC6LXX';
const PAYMENT_REFERENCE = 'PAY-c6a842df7edb49a8879a1563151c32fd';

export function Renew() {
  return (
    <div className="s-wb-page">
      <NotBuiltRegion
        region="renewal-amount-and-payment-method-default-shown-from-the-current-term-omitted-when-auto-renew-is-off"
        name="renewal amount and payment method (default shown from the current term; omitted when auto-renew is off)"
      />

      <section
        className="s-wb-region"
        data-region="problems-renew-1-2-with-its-window-renew-3b-renew-5-renew-6-could-3-several-at-once-listed-not-placed"
        data-req="WB-3"
      >
        <h2 className="s-wb-heading">2 · What the API said</h2>
        <p className="s-wb-note">
          Recorded response to POST /policies/{REFERENCE}/renewals, 422. The window is shown because the API stated it in
          windowStart and windowEnd, not worked out here.
        </p>
        <ProblemBanner
          title="Outside the renewal window"
          status={422}
          ruleId="RENEW-1/2"
          detail="A policy can be renewed from 2027-09-18 to 2027-10-18."
          extensions={[
            { name: 'windowStart', value: '2027-09-18' },
            { name: 'windowEnd', value: '2027-10-18' },
            { name: 'type', value: '/problems/renew-1-2' },
            { name: 'instance', value: `/policies/${REFERENCE}/renewals` },
          ]}
        />
      </section>

      <section className="s-wb-region" data-region="the-new-term-last-on-the-timeline" data-req="WB-5 WB-2">
        <h2 className="s-wb-heading">3 · The new term, last on the timeline</h2>
        <p className="s-wb-note">
          Dates from GET /policies/{REFERENCE} after the refusal, 200: one term. A renewal that succeeds returns the full policy
          with the new term last.
        </p>
        <TermTimeline
          policyReference={REFERENCE}
          terms={[
            {
              termNumber: 1,
              startDate: '2026-10-19',
              endDate: '2027-10-18',
              amount: '384.29',
              payment: { type: 'Card', reference: PAYMENT_REFERENCE, amount: '384.29' },
            },
          ]}
        />
      </section>

      <section className="s-wb-region" data-region="renew-busy-while-the-request-runs" data-req="BUSY-1">
        <h2 className="s-wb-heading">4 · Renew</h2>
        <p className="s-wb-note">
          Sends POST /policies/{REFERENCE}/renewals. The recorded request body was amount 401.16 and nothing else.
        </p>
        <div className="s-wb-actions">
          <Button variant="primary" icon={<RefreshCw aria-hidden="true" />}>
            Renew policy
          </Button>
          <a href={`#/workbench/policies/${REFERENCE}`}>Open policy {REFERENCE}</a>
        </div>
      </section>
    </div>
  );
}
