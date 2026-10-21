import { Search } from 'lucide-react';
import { Button, PageHeader, RecentPolicies, TextInput } from '../../../kit';
import '../workbench.css';

// Stub: the canned content of docs/ui/derived/W1/wb-home/populated.html. The loader and the client replace it.
const RECENT = [
  { reference: 'F2-MVFJQA9DQG', href: '#/workbench/policies/F2-MVFJQA9DQG', how: 'sold' },
  { reference: 'F1-MVFJOFJ8IS', href: '#/workbench/policies/F1-MVFJOFJ8IS', how: 'sold' },
] as const;

export function WorkbenchHome() {
  return (
    <div className="s-wb-home">
      <section className="s-wb-region s-wb-span" data-region="open-a-policy-by-reference" data-req="WB-2">
        <PageHeader
          mode="live"
          title="Workbench"
          eyebrow="Workbench · Home"
          question="Which policy do you want to work on?"
          answer="Open one by its reference, sell a new one, or come back to a recent one."
          liveNote="answered by the API when a request is sent; nothing has been requested yet"
        />
        <h2>Open a policy by reference</h2>
        <p>Type the policy reference, for example F2-MVFJQA9DQG, then open it.</p>
        <div className="s-wb-row">
          <div className="s-wb-field">
            <TextInput aria-label="Policy reference" />
          </div>
          <Button variant="primary" icon={<Search aria-hidden="true" />}>
            Open policy
          </Button>
        </div>
      </section>
      <section
        className="s-wb-region s-wb-span"
        data-region="open-by-reference-busy-while-the-policy-loads"
        data-req="BUSY-1"
        aria-labelledby="s-wb-status-heading"
      >
        <h2 id="s-wb-status-heading">Request status</h2>
        <p role="status">
          Idle. No request sent. Opening a reference sends one GET /policies/‹reference›, and the Open policy button shows
          Opening… and is disabled until the API answers.
        </p>
      </section>
      <section className="s-wb-region" data-region="sell-a-new-policy-entry" data-req="WB-1" aria-labelledby="s-wb-sell-heading">
        <h2 id="s-wb-sell-heading">Sell a new policy</h2>
        <p>Start a new policy. Its reference appears under recent policies once it is sold.</p>
        <p>
          <a href="#/workbench/sell">Sell a new policy</a>
        </p>
      </section>
      <section className="s-wb-region" data-region="recent-policies-kept-in-this-browser" data-req="WB-9">
        <RecentPolicies policies={RECENT} />
      </section>
    </div>
  );
}
