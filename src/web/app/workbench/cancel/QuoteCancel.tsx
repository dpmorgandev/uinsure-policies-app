import { X } from 'lucide-react';
import { Button, RuleChip } from '../../../kit';
import { NotBuiltRegion } from '../../shell/Rung';
import '../workbench.css';

// Stub: the canned content of docs/ui/derived/W1/wb-cancel/populated.html. The client replaces it.
const REFUSALS = [
  { ruleId: 'CANCEL-3', words: 'Cancellation date in the past (422)' },
  { ruleId: 'CANCEL-4', words: 'Policy already cancelled (409)' },
  { ruleId: 'CANCEL-7', words: 'Cancellation date after the end of cover (422)' },
];

export function QuoteCancel() {
  return (
    <div className="s-wb-page">
      <NotBuiltRegion region="cancellation-date-and-quote" name="cancellation date and quote" />

      <section
        className="s-wb-region"
        data-region="quote-and-cancel-actions-each-busy-while-its-request-runs"
        data-req="BUSY-1"
      >
        <h2 className="s-wb-heading">Actions</h2>
        <div className="s-wb-actions">
          <Button variant="destructive" icon={<X aria-hidden="true" />}>
            Cancel on 2026-12-02
          </Button>
          <Button variant="secondary">Quote again</Button>
        </div>
        <p className="s-wb-note">Cancel asks you to confirm, then sends exactly the quoted date, 2026-12-02.</p>
      </section>

      <section className="s-wb-region" data-region="problems-cancel-3-cancel-4-cancel-7" data-req="WB-3">
        <h2 className="s-wb-heading">Problems</h2>
        <p className="s-wb-note">No problem. The quote answered 200. These rules can refuse a date here:</p>
        <ul className="s-wb-list">
          {REFUSALS.map((refusal) => (
            <li key={refusal.ruleId}>
              <RuleChip ruleId={refusal.ruleId} href={`#/rules/${refusal.ruleId}`} /> {refusal.words}
            </li>
          ))}
        </ul>
      </section>

      <NotBuiltRegion
        region="the-refund-as-a-worked-sum-per-term-with-the-rule-applied"
        name="the refund as a worked sum, per term, with the rule applied"
      />
      <NotBuiltRegion
        region="cancel-with-the-quoted-date-then-quote-and-cancellation-compared"
        name="cancel with the quoted date, then quote and cancellation compared"
      />
      <NotBuiltRegion region="the-requests-as-sent-inspector" name="the requests as sent (inspector)" />
    </div>
  );
}
