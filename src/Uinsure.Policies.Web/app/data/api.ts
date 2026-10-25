export type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

export interface RecentStore {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export interface ApiDeps {
  fetch: Fetch;
  storage: RecentStore | null;
}

export type PolicyType = 'BuyToLet' | 'Household';

export type PaymentMethod = 'Card' | 'DirectDebit' | 'Cheque';

export interface Policyholder {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export interface Property {
  addressLine1: string;
  addressLine2: string | null;
  addressLine3: string | null;
  postcode: string;
}

export interface SellRequest {
  reference: string;
  type: PolicyType;
  startDate: string;
  amount: number;
  autoRenew: boolean;
  paymentMethod: PaymentMethod;
  policyholders: Policyholder[];
  property: Property;
}

export interface Term {
  termNumber: number;
  startDate: string;
  endDate: string;
  amount: number;
  paymentReference: string;
}

export interface Payment {
  reference: string;
  type: string;
  amount: number;
}

export interface Refund {
  reference: string;
  type: string;
  amount: number;
  paymentReference: string;
}

export interface Claim {
  reference: string;
  claimDate: string;
  description: string;
}

export interface Cancellation {
  cancellationDate: string;
  ruleApplied: string;
  totalRefund: number;
}

export interface Policy {
  reference: string;
  type: PolicyType;
  status: string;
  currentTermNumber: number;
  startDate: string;
  endDate: string;
  amount: number;
  hasClaims: boolean;
  autoRenew: boolean;
  policyholders: Policyholder[];
  property: Property;
  terms: Term[];
  payments: Payment[];
  refunds: Refund[];
  claims: Claim[];
  cancellation: Cancellation | null;
}

export interface SellFormProperty {
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  postcode: string;
}

export interface SellForm {
  reference: string;
  type: PolicyType;
  startDate: string;
  amount: string;
  paymentMethod: PaymentMethod;
  autoRenew: boolean;
  policyholders: Policyholder[];
  property: SellFormProperty;
}

export interface SellOptions {
  sendAnyway: boolean;
  today: string;
}

export interface FieldError {
  field: string;
  ruleId: string | null;
  message: string;
}

export type PreparedSale = { kind: 'send'; body: SellRequest } | { kind: 'caught'; errors: FieldError[] };

export interface ProblemItem {
  message: string;
  field: string | null;
  fieldKey: string | null;
  ruleId: string | null;
}

export interface Problem {
  status: number;
  title: string | null;
  detail: string | null;
  ruleId: string | null;
  items: ProblemItem[];
}

export type ApiAnswer<T> = { kind: 'ok'; status: number; value: T } | { kind: 'problem'; status: number; problem: Problem } | { kind: 'unreachable'; reason: string };

export interface RecentEntry {
  reference: string;
  how: 'sold' | 'opened';
}

export type RecentRead = { state: 'available'; entries: RecentEntry[] } | { state: 'unavailable' };

const RECENT_SLOT = 'workbench.recent';

// SELL-1: the API trims and upper-cases the reference, then matches this pattern.
const REFERENCE_PATTERN = /^[A-Z0-9-]{3,20}$/;

// SELL-2: a start date from today to today + 60, inclusive.
const SALE_WINDOW_DAYS = 60;

// SELL-4: 1 to 3 policyholders.
const MAX_POLICYHOLDERS = 3;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const FORM_FIELD =
  /^(reference|type|startDate|amount|paymentMethod|autoRenew|policyholders|property\.(addressLine1|addressLine2|addressLine3|postcode)|policyholders\[\d+\]\.(firstName|lastName|dateOfBirth))$/;

function addDays(day: string, days: number): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year as number, (month as number) - 1, (date as number) + days)).toISOString().slice(0, 10);
}

function orNull(line: string): string | null {
  return line.trim() === '' ? null : line;
}

function toRequest(form: SellForm): SellRequest {
  return {
    reference: form.reference,
    type: form.type,
    startDate: form.startDate,
    amount: Number(form.amount),
    autoRenew: form.autoRenew,
    paymentMethod: form.paymentMethod,
    policyholders: form.policyholders,
    property: {
      addressLine1: form.property.addressLine1,
      addressLine2: orNull(form.property.addressLine2),
      addressLine3: orNull(form.property.addressLine3),
      postcode: form.property.postcode,
    },
  };
}

function checkForm(form: SellForm, today: string): FieldError[] {
  const errors: FieldError[] = [];
  if (!REFERENCE_PATTERN.test(form.reference.trim().toUpperCase())) {
    errors.push({ field: 'reference', ruleId: 'SELL-1', message: 'A reference is 3 to 20 letters, digits or hyphens.' });
  }
  if (!DATE_PATTERN.test(form.startDate)) {
    errors.push({ field: 'startDate', ruleId: null, message: 'Enter a start date as yyyy-MM-dd.' });
  } else if (form.startDate < today || form.startDate > addDays(today, SALE_WINDOW_DAYS)) {
    errors.push({ field: 'startDate', ruleId: 'SELL-2', message: 'The start date is from today to 60 days ahead.' });
  }
  if (form.policyholders.length < 1 || form.policyholders.length > MAX_POLICYHOLDERS) {
    errors.push({ field: 'policyholders', ruleId: 'SELL-4', message: 'A policy has 1 to 3 policyholders.' });
  }
  const amount = Number(form.amount);
  if (form.amount.trim() === '' || !(amount > 0)) {
    errors.push({ field: 'amount', ruleId: 'SELL-7', message: 'The amount must be above 0.' });
  }
  return errors;
}

export function prepareSale(form: SellForm, options: SellOptions): PreparedSale {
  if (!options.sendAnyway) {
    const errors = checkForm(form, options.today);
    if (errors.length > 0) return { kind: 'caught', errors };
  }
  return { kind: 'send', body: toRequest(form) };
}

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fieldOf(key: string): string | null {
  const name = key.startsWith('$.') ? key.slice(2) : key;
  return FORM_FIELD.test(name) ? name : null;
}

function violationItems(violations: unknown): ProblemItem[] {
  if (!Array.isArray(violations)) return [];
  return violations.filter(isRecord).map((v) => ({
    message: text(v['detail']) ?? '',
    field: null,
    fieldKey: null,
    ruleId: text(v['ruleId']),
  }));
}

function errorItems(errors: unknown): ProblemItem[] {
  if (!isRecord(errors)) return [];
  return Object.entries(errors).flatMap(([key, messages]) =>
    (Array.isArray(messages) ? messages : []).map((message) => ({
      message: String(message),
      field: fieldOf(key),
      fieldKey: key,
      ruleId: null,
    })),
  );
}

export function readProblem(status: number, body: unknown): Problem {
  const sent = isRecord(body) ? body : {};
  return {
    status,
    title: text(sent['title']),
    detail: text(sent['detail']),
    ruleId: text(sent['ruleId']),
    items: [...violationItems(sent['violations']), ...errorItems(sent['errors'])],
  };
}

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function ask<T = Policy>(deps: ApiDeps, url: string, init?: RequestInit): Promise<ApiAnswer<T>> {
  let response: Response;
  try {
    response = await deps.fetch(url, init);
  } catch (error) {
    return { kind: 'unreachable', reason: reasonOf(error) };
  }
  // WB-3: an answer came. A body that is not JSON (a proxy's page) leaves no body, and the status stays.
  const body: unknown = await response.json().catch(() => undefined);
  if (response.ok) return { kind: 'ok', status: response.status, value: body as T };
  return { kind: 'problem', status: response.status, problem: readProblem(response.status, body) };
}

export async function sellPolicy(deps: ApiDeps, body: SellRequest): Promise<ApiAnswer<Policy>> {
  const answer = await ask<Policy>(deps, '/api/policies', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (answer.kind === 'ok' && answer.status === 201) remember(deps.storage, answer.value.reference, 'sold');
  return answer;
}

export async function getPolicy(deps: ApiDeps, reference: string): Promise<ApiAnswer<Policy>> {
  const answer = await ask<Policy>(deps, `/api/policies/${encodeURIComponent(reference)}`);
  if (answer.kind === 'ok' && answer.status === 200) remember(deps.storage, answer.value.reference, 'opened');
  return answer;
}

function isEntry(value: unknown): value is RecentEntry {
  return isRecord(value) && typeof value['reference'] === 'string' && (value['how'] === 'sold' || value['how'] === 'opened');
}

export function readRecent(storage: RecentStore | null): RecentRead {
  if (storage === null) return { state: 'unavailable' };
  let stored: string | null;
  try {
    stored = storage.getItem(RECENT_SLOT);
  } catch {
    return { state: 'unavailable' };
  }
  if (stored === null) return { state: 'available', entries: [] };
  try {
    const parsed: unknown = JSON.parse(stored);
    return { state: 'available', entries: Array.isArray(parsed) ? parsed.filter(isEntry) : [] };
  } catch {
    return { state: 'available', entries: [] };
  }
}

// WB-9: the list is a convenience; a browser that withholds or fills its storage must not fail the sale or the read.
function remember(storage: RecentStore | null, reference: string, how: RecentEntry['how']): void {
  const recent = readRecent(storage);
  if (storage === null || recent.state === 'unavailable') return;
  const entries = [{ reference, how }, ...recent.entries.filter((e) => e.reference !== reference)];
  try {
    storage.setItem(RECENT_SLOT, JSON.stringify(entries));
  } catch {
    // storage full or refused: the list just doesn't grow.
  }
}

export interface ClaimRequest {
  claimDate: string;
  description?: string;
}

export interface RecordedClaim {
  reference: string;
  policyReference: string;
  claimDate: string;
  description: string | null;
  hasClaims: boolean;
}

export interface CancellationTerm {
  termNumber: number;
  ruleApplied: string;
  daysInTerm: number;
  daysUsed: number;
  unusedDays: number;
  refundAmount: number;
}

export interface QuotedRefund {
  type: string;
  amount: number;
  paymentReference: string;
}

export interface CancellationQuote {
  reference: string;
  cancellationDate: string;
  ruleApplied: string;
  totalRefund: number;
  terms: CancellationTerm[];
  refunds: QuotedRefund[];
  quotedOn: string;
}

export interface CancellationResult {
  reference: string;
  cancellationDate: string;
  ruleApplied: string;
  totalRefund: number;
  terms: CancellationTerm[];
  refunds: Refund[];
}

export async function quoteCancellation(deps: ApiDeps, reference: string, cancellationDate: string): Promise<ApiAnswer<CancellationQuote>> {
  return ask<CancellationQuote>(
    deps,
    `/api/policies/${encodeURIComponent(reference)}/cancellation-quote?cancellationDate=${encodeURIComponent(cancellationDate)}`,
  );
}

export async function cancelPolicy(deps: ApiDeps, reference: string, cancellationDate: string): Promise<ApiAnswer<CancellationResult>> {
  return ask<CancellationResult>(deps, `/api/policies/${encodeURIComponent(reference)}/cancellation`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ cancellationDate }),
  });
}

export interface RenewalRequest {
  /** A number when the typed text is one; otherwise the text as typed, so the API's 400 answers it. */
  amount: number | string;
  paymentMethod?: PaymentMethod;
}

export interface LoggedExchange {
  method: string;
  path: string;
  /** The headers the page set, by lower-case name. */
  requestHeaders: Record<string, string>;
  /** The body as the exact text sent. */
  requestBody: string | null;
  status: number | null;
  /** The headers the page received, by lower-case name. Null until an answer comes. */
  responseHeaders: Record<string, string> | null;
  /** The body as the exact text received. */
  responseBody: string | null;
  /** Set when fetch rejected: the request never got an answer, so it is not still waiting for one. */
  failed?: true;
}

function postJson(body: unknown): RequestInit {
  return { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}

export function recordClaim(deps: ApiDeps, reference: string, body: ClaimRequest): Promise<ApiAnswer<RecordedClaim>> {
  return ask<RecordedClaim>(deps, `/api/policies/${encodeURIComponent(reference)}/claims`, postJson(body));
}

export function renewPolicy(deps: ApiDeps, reference: string, body: RenewalRequest): Promise<ApiAnswer<Policy>> {
  return ask<Policy>(deps, `/api/policies/${encodeURIComponent(reference)}/renewals`, postJson(body));
}

const headersOf = (headers: Headers | HeadersInit | undefined): Record<string, string> => Object.fromEntries(new Headers(headers).entries());

/** WB-7: keeps each exchange as it went over the wire, in send order, and hands the response on unread. */
export function loggingFetch(fetch: Fetch, log: LoggedExchange[]): Fetch {
  return async (input, init) => {
    const entry: LoggedExchange = {
      method: init?.method ?? 'GET',
      path: input,
      requestHeaders: headersOf(init?.headers),
      requestBody: typeof init?.body === 'string' ? init.body : null,
      status: null,
      responseHeaders: null,
      responseBody: null,
    };
    log.push(entry);
    let response: Response;
    try {
      response = await fetch(input, init);
    } catch (error) {
      entry.failed = true;
      throw error;
    }
    // The entry is completed in one step after the body is read, so a snapshot never holds a status without its body.
    const body = await response.clone().text();
    entry.status = response.status;
    entry.responseHeaders = headersOf(response.headers);
    entry.responseBody = body;
    return response;
  };
}
