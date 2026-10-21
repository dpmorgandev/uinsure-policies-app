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
  refunds: unknown[];
  claims: unknown[];
  cancellation: unknown;
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

export function prepareSale(form: SellForm, options: SellOptions): PreparedSale {
  throw new Error('not implemented');
}

export function readProblem(status: number, body: unknown): Problem {
  throw new Error('not implemented');
}

export async function sellPolicy(deps: ApiDeps, body: SellRequest): Promise<ApiAnswer<Policy>> {
  throw new Error('not implemented');
}

export async function getPolicy(deps: ApiDeps, reference: string): Promise<ApiAnswer<Policy>> {
  throw new Error('not implemented');
}

export function readRecent(storage: RecentStore | null): RecentRead {
  throw new Error('not implemented');
}
