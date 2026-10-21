import { Receipt } from 'lucide-react';
import { Button, RuleChip } from '../../../kit';
import { NotBuiltRegion } from '../../shell/Rung';
import '../workbench.css';

// Stub: the canned content of docs/ui/derived/W1/wb-claim/populated.html. The client replaces it.
export function RecordClaim() {
  return (
    <div className="s-wb-page">
      <NotBuiltRegion region="claim-date-and-description" name="claim date and description" />
      <NotBuiltRegion region="refund-before-and-after-the-claim-two-quotes" name="refund before and after the claim, two quotes" />

      <section className="s-wb-region" data-region="problems-could-2a-could-2b-could-2c" data-req="WB-3">
        <h2 className="s-wb-heading">Problems</h2>
        <p className="s-wb-note">No problem. The claim request answered 201. These rules can refuse a claim here:</p>
        <ul className="s-wb-list">
          <li>
            <RuleChip ruleId="COULD-2a" href="#/rules/COULD-2a" /> Claim date in the future (422)
          </li>
          <li>COULD-2b: no refusal under it is recorded in this data, so what it refuses is not shown.</li>
          <li>
            <RuleChip ruleId="COULD-2c" href="#/rules/COULD-2c" /> Claim on a cancelled policy (409)
          </li>
        </ul>
      </section>

      <section
        className="s-wb-region"
        data-region="record-claim-busy-while-the-request-and-the-two-quotes-run"
        data-req="BUSY-1"
      >
        <h2 className="s-wb-heading">Record the claim</h2>
        <div className="s-wb-actions">
          <Button variant="primary" icon={<Receipt aria-hidden="true" />}>
            Record this claim
          </Button>
        </div>
        <p className="s-wb-note">
          Sends the claim, then asks for the quote again. While the request and the two quotes run, this button is busy and
          disabled.
        </p>
      </section>
    </div>
  );
}
