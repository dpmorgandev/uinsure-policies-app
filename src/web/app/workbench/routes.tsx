import type { ReactElement } from 'react';
import { QuoteCancel } from './cancel/QuoteCancel';
import { RecordClaim } from './claim/RecordClaim';
import { WorkbenchHome } from './home/WorkbenchHome';
import { PolicyView } from './policy/PolicyView';
import { Renew } from './renew/Renew';
import { SellPolicy } from './sell/SellPolicy';

export interface WorkbenchRoute {
  /** Relative to the root, in the router's own syntax. */
  path: string;
  /** The route decides the page title; the shell sets it. */
  title: string;
  element: ReactElement;
}

/** W1's routes, registered by the router root. Each route is one screen in docs/ui/screens/. */
export const workbenchRoutes: WorkbenchRoute[] = [
  { path: 'workbench', title: 'Workbench', element: <WorkbenchHome /> },
  { path: 'workbench/sell', title: 'Sell a policy', element: <SellPolicy /> },
  { path: 'workbench/policies/:reference', title: 'Policy', element: <PolicyView /> },
  { path: 'workbench/policies/:reference/cancel', title: 'Quote and cancel', element: <QuoteCancel /> },
  { path: 'workbench/policies/:reference/renew', title: 'Renew', element: <Renew /> },
  { path: 'workbench/policies/:reference/claims/new', title: 'Record a claim', element: <RecordClaim /> },
];
