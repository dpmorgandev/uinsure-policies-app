import { Receipt } from 'lucide-react';
import {
  Button,
  ConstraintHint,
  DateInput,
  Field,
  FormSection,
  MoneyInput,
  PageHeader,
  RadioGroup,
  ReferencePreview,
  RepeatableGroup,
  SendAnywayToggle,
  Select,
  Switch,
  TextInput,
} from '../../../kit';
import { NotBuiltRegion } from '../../shell/Rung';
import '../workbench.css';

// Stub: the canned content of docs/ui/derived/W1/wb-sell/populated.html. The client replaces it.
const REFERENCE = 'F1-MVFJOFJ8IS';

const PAYMENT_METHODS = [
  { value: 'Card', label: 'Card' },
  { value: 'DirectDebit', label: 'Direct Debit' },
  { value: 'Cheque', label: 'Cheque' },
];

// The canned form is fixed at the reference's two policyholders: it cannot add or remove one until the client does.
const HOLDERS = [
  { id: 'ph-1', first: 'Grace', last: 'Hopper', dateOfBirth: '1990-04-12' },
  { id: 'ph-2', first: 'Alan', last: 'Turing', dateOfBirth: '1992-06-23' },
];

export function SellPolicy() {
  return (
    <>
      <PageHeader
        mode="live"
        title="Sell a policy"
        eyebrow={`Workbench · Sell a policy · policy ${REFERENCE}`}
        question="If I send this request, what does the API store?"
        answer="Sent as filled in, the request was answered 201: F1-MVFJOFJ8IS is stored as Pending, term 1 from 2026-11-18 to 2027-11-17, paid by Card for 412.34."
        ids={[{ label: 'Policy', value: REFERENCE }]}
        liveNote="item SELL-1, new reference → 201, recorded 2026-10-19T17:45:08Z; not a live call"
      />

      <section className="s-wb-form-region" data-region="error-summary-every-problem-each-linked-to-its-field-and-its-rule" data-req="WB-3" aria-labelledby="s-wb-problems-title">
        <h2 id="s-wb-problems-title">Problems</h2>
        <p className="s-wb-note">
          None. The API answered 201 and returned no problems. Each problem it does return is listed here, linked to its field
          and its rule. <a href={`#/workbench/policies/${REFERENCE}`}>Open policy {REFERENCE}</a>
        </p>
      </section>

      <div className="s-wb-form-region" data-region="policy-fields-reference-type-start-date-amount-payment-method-auto-renew" data-req="WB-1">
        <FormSection
          number={1}
          title="Name the policy"
          description="Reference, type, start date, amount, payment method and auto-renew."
        >
          <Field id="reference" label="Policy reference" constraint={<ConstraintHint constraint="^[A-Z0-9-]{3,20}$" />}>
            {(control) => <TextInput {...control} mono defaultValue={REFERENCE} />}
          </Field>
          <RadioGroup
            legend="Type"
            defaultValue="BuyToLet"
            options={[
              { value: 'BuyToLet', label: 'Buy to let' },
              { value: 'Household', label: 'Household' },
            ]}
          />
          <Field
            id="startDate"
            label="Start date"
            hint="Format yyyy-MM-dd."
            constraint={<ConstraintHint constraint="today … today + 60" />}
          >
            {(control) => <DateInput {...control} defaultValue="2026-11-18" />}
          </Field>
          <Field id="amount" label="Amount" constraint={<ConstraintHint constraint="≤ 2 dp" />}>
            {(control) => <MoneyInput {...control} defaultValue="412.34" />}
          </Field>
          <Field id="paymentMethod" label="Payment method">
            {(control) => <Select {...control} options={PAYMENT_METHODS} defaultValue="Card" />}
          </Field>
          <Switch label="Auto-renew" />
        </FormSection>
      </div>

      <div className="s-wb-aside" data-region="reference-as-stored-normalisation-preview" data-req="WB-1">
        <ReferencePreview value={REFERENCE} forId="reference" />
      </div>

      <div className="s-wb-form-region" data-region="policyholders-1-to-3" data-req="WB-1">
        <FormSection
          number={2}
          title="Add the policyholders"
          description="1 to 3 policyholders, each with a first name, last name and date of birth."
        >
          <RepeatableGroup
            legend="Policyholders"
            itemLabel="Policyholder"
            max={HOLDERS.length}
            members={HOLDERS.map((holder) => ({
              id: holder.id,
              children: (
                <>
                  <Field id={`${holder.id}-first`} label="First name">
                    {(control) => <TextInput {...control} defaultValue={holder.first} />}
                  </Field>
                  <Field id={`${holder.id}-last`} label="Last name">
                    {(control) => <TextInput {...control} defaultValue={holder.last} />}
                  </Field>
                  <Field id={`${holder.id}-dob`} label="Date of birth (yyyy-MM-dd)">
                    {(control) => <TextInput {...control} defaultValue={holder.dateOfBirth} />}
                  </Field>
                </>
              ),
            }))}
          />
        </FormSection>
      </div>

      <div className="s-wb-form-region" data-region="property" data-req="WB-1">
        <FormSection number={3} title="Describe the property" description="Address lines 1 to 3 and a postcode.">
          <Field id="addressLine1" label="Address line 1">
            {(control) => <TextInput {...control} mono defaultValue="7 Canal St" />}
          </Field>
          <Field id="addressLine2" label="Address line 2">
            {(control) => <TextInput {...control} mono defaultValue="Flat 3" />}
          </Field>
          <Field id="addressLine3" label="Address line 3">
            {(control) => <TextInput {...control} mono defaultValue="Ancoats" />}
          </Field>
          <Field id="postcode" label="Postcode">
            {(control) => <TextInput {...control} mono defaultValue="M4 6BX" />}
          </Field>
        </FormSection>
      </div>

      <div className="s-wb-aside" data-region="send-it-anyway-client-checks-off" data-req="WB-6">
        <SendAnywayToggle />
      </div>

      <div className="s-wb-form-region" data-region="submit-busy-while-the-sell-request-runs-spinner-disabled" data-req="BUSY-1">
        <FormSection number={4} title="Send the request" description="Sends POST /policies with the values above.">
          <Button variant="primary" icon={<Receipt aria-hidden="true" />}>
            Sell this policy
          </Button>
        </FormSection>
      </div>

      <NotBuiltRegion region="the-request-as-sent-inspector" name="the request as sent (inspector)" />
    </>
  );
}
