import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Receipt } from 'lucide-react';
import {
  Button,
  ConstraintHint,
  DateInput,
  ErrorSummary,
  Field,
  FormSection,
  MoneyInput,
  PageHeader,
  ProblemBanner,
  RadioGroup,
  ReferencePreview,
  RepeatableGroup,
  SendAnywayToggle,
  Select,
  Switch,
  TextInput,
} from '../../../kit';
import { prepareSale, sellPolicy } from '../../data/api';
import type { PaymentMethod, Policy, PolicyType, Problem, SellForm, SellFormProperty } from '../../data/api';
import { RequestsDrawer } from '../RequestsDrawer';
import { browserDeps, todayInLondon } from '../browser';
import { ProblemView } from '../ProblemView';
import '../workbench.css';

const PAYMENT_METHODS = [
  { value: 'Card', label: 'Card' },
  { value: 'DirectDebit', label: 'Direct Debit' },
  { value: 'Cheque', label: 'Cheque' },
];

const POLICY_TYPES = [
  { value: 'BuyToLet', label: 'Buy to let' },
  { value: 'Household', label: 'Household' },
];

// SELL-4: the API takes 1 to 3 policyholders. With send anyway on, one more can be added so its refusal shows (WB-6).
const SELL_4_LIMIT = 3;

const PROPERTY_LINES = [
  { key: 'addressLine1', label: 'Address line 1' },
  { key: 'addressLine2', label: 'Address line 2' },
  { key: 'addressLine3', label: 'Address line 3' },
  { key: 'postcode', label: 'Postcode' },
] as const;

const PLAIN_CONTROLS = new Set(['reference', 'startDate', 'amount', 'paymentMethod']);
const HOLDER_FIELD = /^policyholders\[(\d+)\]\.(firstName|lastName|dateOfBirth)$/;
const PROPERTY_FIELD = /^property\.(addressLine[123]|postcode)$/;

interface Holder {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

type Values = Omit<SellForm, 'policyholders'>;

type Outcome =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'caught'; errors: { field: string; ruleId: string | null; message: string }[] }
  | { kind: 'sold'; status: number; policy: Policy }
  | { kind: 'problem'; problem: Problem; clientChecks: Record<string, string> }
  | { kind: 'unreachable'; reason: string };

const INITIAL: Values = {
  reference: '',
  type: 'BuyToLet',
  startDate: '',
  amount: '',
  paymentMethod: 'Card',
  autoRenew: false,
  property: { addressLine1: '', addressLine2: '', addressLine3: '', postcode: '' },
};

const blankHolder = (id: string): Holder => ({ id, firstName: '', lastName: '', dateOfBirth: '' });

function messagesByField(entries: { field: string | null; message: string }[]): Record<string, string[]> {
  const byField: Record<string, string[]> = {};
  for (const entry of entries) {
    if (entry.field !== null) byField[entry.field] = [...(byField[entry.field] ?? []), entry.message];
  }
  return byField;
}

function liveNoteOf(outcome: Outcome): string {
  switch (outcome.kind) {
    case 'busy':
      return 'answered by the API; one request is in flight and no answer has come back yet';
    case 'sold':
      return `POST /policies answered ${outcome.status}`;
    case 'problem':
      return `POST /policies answered ${outcome.problem.status}`;
    case 'unreachable':
      return 'no response: nothing to record';
    case 'caught':
      return "not sent: the form's own checks stopped the request";
    default:
      return 'answered by the API when a request is sent; nothing has been requested yet';
  }
}

function answerOf(outcome: Outcome): string {
  switch (outcome.kind) {
    case 'busy':
      return 'Not known yet. POST /policies is in flight, so nothing is stored until the API answers.';
    case 'sold': {
      const { policy } = outcome;
      const payment = policy.payments[0];
      const paid = payment ? `, paid by ${payment.type} for ${payment.amount.toFixed(2)}` : '';
      return `The API answered ${outcome.status}: ${policy.reference} is stored as ${policy.status}, term ${policy.currentTermNumber} from ${policy.startDate} to ${policy.endDate}${paid}.`;
    }
    case 'problem':
      return `Nothing was stored. The API answered ${outcome.problem.status}${outcome.problem.title ? `, ${outcome.problem.title}` : ''}.`;
    case 'unreachable':
      return 'Nothing yet. The API did not answer, so no request was completed and no status came back.';
    case 'caught':
      return "Nothing was sent. The form's own checks caught a problem: fix it, or turn send anyway on.";
    default:
      return 'Nothing has been sent yet. Fill in the form and send it to see what the API stores.';
  }
}

export function SellPolicy() {
  const [values, setValues] = useState<Values>(INITIAL);
  const [holders, setHolders] = useState<Holder[]>([blankHolder('holder-1')]);
  const [sendAnyway, setSendAnyway] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' });
  const [attempt, setAttempt] = useState(0);
  const nextHolder = useRef(2);
  const inFlight = useRef(false);
  const busy = outcome.kind === 'busy';

  const form: SellForm = {
    ...values,
    policyholders: holders.map((h) => ({ firstName: h.firstName, lastName: h.lastName, dateOfBirth: h.dateOfBirth })),
  };

  function set<K extends keyof Values>(key: K, value: Values[K]): void {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function setProperty(key: keyof SellFormProperty, value: string): void {
    setValues((current) => ({ ...current, property: { ...current.property, [key]: value } }));
  }

  function setHolder(id: string, key: 'firstName' | 'lastName' | 'dateOfBirth', value: string): void {
    setHolders((current) => current.map((h) => (h.id === id ? { ...h, [key]: value } : h)));
  }

  function addHolder(): void {
    const id = `holder-${nextHolder.current}`;
    nextHolder.current += 1;
    setHolders((current) => [...current, blankHolder(id)]);
  }

  function controlId(field: string): string | undefined {
    const holder = HOLDER_FIELD.exec(field);
    if (holder) {
      const member = holders[Number(holder[1])];
      return member ? `${member.id}-${holder[2]}` : undefined;
    }
    const property = PROPERTY_FIELD.exec(field);
    if (property) return property[1];
    return PLAIN_CONTROLS.has(field) ? field : undefined;
  }

  async function send(): Promise<void> {
    if (inFlight.current) return;
    setAttempt((n) => n + 1);
    const today = todayInLondon();
    const prepared = prepareSale(form, { sendAnyway, today });
    if (prepared.kind === 'caught') {
      setOutcome({ kind: 'caught', errors: prepared.errors });
      return;
    }
    inFlight.current = true;
    setOutcome({ kind: 'busy' });
    const answer = await sellPolicy(browserDeps(), prepared.body);
    inFlight.current = false;
    if (answer.kind === 'ok') {
      setOutcome({ kind: 'sold', status: answer.status, policy: answer.value });
    } else if (answer.kind === 'problem') {
      // The check this form would have run on the same values, to line up beside each violation the API gave (WB-6).
      const own = prepareSale(form, { sendAnyway: false, today });
      const clientChecks: Record<string, string> = {};
      if (own.kind === 'caught') {
        for (const error of own.errors) if (error.ruleId !== null) clientChecks[error.ruleId] = error.message;
      }
      setOutcome({ kind: 'problem', problem: answer.problem, clientChecks });
    } else {
      setOutcome({ kind: 'unreachable', reason: answer.reason });
    }
  }

  function submit(event: FormEvent): void {
    event.preventDefault();
    void send();
  }

  const fieldErrors =
    outcome.kind === 'caught'
      ? messagesByField(outcome.errors.map((e) => ({ field: e.field, message: e.message })))
      : outcome.kind === 'problem'
        ? messagesByField(outcome.problem.items.map((i) => ({ field: i.field, message: i.message })))
        : {};
  const errorsOn = (field: string): string[] | undefined => fieldErrors[field];

  const violations = outcome.kind === 'problem' ? outcome.problem.items.filter((i) => i.ruleId !== null) : [];
  const answeredWith =
    outcome.kind === 'problem' && violations.length > 0
      ? {
          status: outcome.problem.status,
          violations: violations.map((v) => ({
            ruleId: v.ruleId as string,
            detail: v.message,
            clientCheck: outcome.clientChecks[v.ruleId as string] ?? null,
          })),
        }
      : null;

  const sold = outcome.kind === 'sold' ? outcome : null;

  return (
    <form noValidate onSubmit={submit}>
      <PageHeader
        mode="live"
        title="Sell a policy"
        eyebrow={sold ? `Workbench · Sell a policy · policy ${sold.policy.reference}` : 'Workbench · Sell a policy'}
        question="If I send this request, what does the API store?"
        answer={answerOf(outcome)}
        ids={sold ? [{ label: 'Policy', value: sold.policy.reference }] : undefined}
        liveNote={liveNoteOf(outcome)}
      />

      <section
        className="s-wb-form-region"
        data-region="error-summary-every-problem-each-linked-to-its-field-and-its-rule"
        data-req="WB-3"
        aria-labelledby="s-wb-problems-title"
      >
        <h2 id="s-wb-problems-title">Problems</h2>
        {outcome.kind === 'caught' ? (
          <ErrorSummary
            focusKey={attempt}
            ruleHref={(ruleId) => '#/rules/' + ruleId}
            items={outcome.errors.map((error) => ({
              message: error.message,
              fieldId: controlId(error.field),
              ruleId: error.ruleId ?? undefined,
            }))}
          />
        ) : outcome.kind === 'problem' ? (
          <ProblemView problem={outcome.problem} controlId={controlId} focusKey={attempt} headingLevel={2} />
        ) : outcome.kind === 'unreachable' ? (
          <ProblemBanner
            headingLevel={2}
            unreachable
            title="The API did not answer"
            detail="No request was completed. Nothing was changed by this screen."
            extensions={[{ name: 'error', value: outcome.reason }]}
            onRetry={() => void send()}
          />
        ) : sold ? (
          <p className="s-wb-note">
            None. The API answered {sold.status} and returned no problems.{' '}
            <a href={`#/workbench/policies/${encodeURIComponent(sold.policy.reference)}`}>Open policy {sold.policy.reference}</a>
          </p>
        ) : (
          <p className="s-wb-note">
            {busy ? 'None yet. The request is in flight, so the API has not answered. ' : 'None yet. '}
            Each problem the API returns is listed here, linked to its field and its rule.
          </p>
        )}
      </section>

      <div className="s-wb-form-region" data-region="policy-fields-reference-type-start-date-amount-payment-method-auto-renew" data-req="WB-1">
        <FormSection
          number={1}
          title="Name the policy"
          description="Reference, type, start date, amount, payment method and auto-renew."
        >
          <Field
            id="reference"
            label="Policy reference"
            error={errorsOn('reference')}
            constraint={<ConstraintHint constraint="^[A-Z0-9-]{3,20}$" />}
          >
            {(control) => <TextInput {...control} mono value={values.reference} onChange={(e) => set('reference', e.target.value)} />}
          </Field>
          <RadioGroup
            legend="Type"
            value={values.type}
            options={POLICY_TYPES}
            onChange={(value) => set('type', value as PolicyType)}
          />
          <Field
            id="startDate"
            label="Start date"
            hint="Format yyyy-MM-dd."
            error={errorsOn('startDate')}
            constraint={<ConstraintHint constraint="today … today + 60" />}
          >
            {(control) => <DateInput {...control} value={values.startDate} onChange={(e) => set('startDate', e.target.value)} />}
          </Field>
          <Field id="amount" label="Amount" error={errorsOn('amount')} constraint={<ConstraintHint constraint="≤ 2 dp" />}>
            {(control) => <MoneyInput {...control} value={values.amount} onChange={(e) => set('amount', e.target.value)} />}
          </Field>
          <Field id="paymentMethod" label="Payment method" error={errorsOn('paymentMethod')}>
            {(control) => (
              <Select
                {...control}
                options={PAYMENT_METHODS}
                value={values.paymentMethod}
                onChange={(e) => set('paymentMethod', e.target.value as PaymentMethod)}
              />
            )}
          </Field>
          <Switch label="Auto-renew" checked={values.autoRenew} onChange={(e) => set('autoRenew', e.target.checked)} />
        </FormSection>
      </div>

      <div className="s-wb-aside" data-region="reference-as-stored-normalisation-preview" data-req="WB-1">
        <ReferencePreview value={values.reference} forId="reference" />
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
            max={sendAnyway ? SELL_4_LIMIT + 1 : SELL_4_LIMIT}
            onAdd={addHolder}
            onRemove={(id) => setHolders((current) => current.filter((h) => h.id !== id))}
            members={holders.map((holder, position) => ({
              id: holder.id,
              children: (
                <>
                  <Field
                    id={`${holder.id}-firstName`}
                    label="First name"
                    error={errorsOn(`policyholders[${position}].firstName`)}
                  >
                    {(control) => (
                      <TextInput {...control} value={holder.firstName} onChange={(e) => setHolder(holder.id, 'firstName', e.target.value)} />
                    )}
                  </Field>
                  <Field id={`${holder.id}-lastName`} label="Last name" error={errorsOn(`policyholders[${position}].lastName`)}>
                    {(control) => (
                      <TextInput {...control} value={holder.lastName} onChange={(e) => setHolder(holder.id, 'lastName', e.target.value)} />
                    )}
                  </Field>
                  <Field
                    id={`${holder.id}-dateOfBirth`}
                    label="Date of birth (yyyy-MM-dd)"
                    error={errorsOn(`policyholders[${position}].dateOfBirth`)}
                  >
                    {(control) => (
                      <DateInput {...control} value={holder.dateOfBirth} onChange={(e) => setHolder(holder.id, 'dateOfBirth', e.target.value)} />
                    )}
                  </Field>
                </>
              ),
            }))}
          />
        </FormSection>
      </div>

      <div className="s-wb-form-region" data-region="property" data-req="WB-1">
        <FormSection number={3} title="Describe the property" description="Address lines 1 to 3 and a postcode.">
          {PROPERTY_LINES.map(({ key, label }) => (
            <Field key={key} id={key} label={label} error={errorsOn(`property.${key}`)}>
              {(control) => <TextInput {...control} mono value={values.property[key]} onChange={(e) => setProperty(key, e.target.value)} />}
            </Field>
          ))}
        </FormSection>
      </div>

      <div className="s-wb-aside" data-region="send-it-anyway-client-checks-off" data-req="WB-6">
        <SendAnywayToggle
          checked={sendAnyway}
          onChange={setSendAnyway}
          response={answeredWith}
          ruleHref={(ruleId) => '#/rules/' + ruleId}
        />
      </div>

      <div className="s-wb-form-region" data-region="submit-busy-while-the-sell-request-runs-spinner-disabled" data-req="BUSY-1">
        <FormSection number={4} title="Send the request" description="Sends POST /policies with the values above.">
          <Button type="submit" variant="primary" busy={busy} busyLabel="Selling…" icon={<Receipt aria-hidden="true" />}>
            Sell this policy
          </Button>
          {busy ? <p role="status">In flight: POST /policies. Waiting for the API to answer.</p> : null}
        </FormSection>
      </div>

      <section className="s-wb-region" data-region="the-request-as-sent-inspector" data-req="WB-7">
        <RequestsDrawer />
      </section>
    </form>
  );
}
