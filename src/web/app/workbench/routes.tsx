import type { ReactElement } from 'react';
import { CancelPolicy } from './cancel/CancelPolicy';
import { RecordClaim } from './claim/RecordClaim';
import { WorkbenchHome } from './home/WorkbenchHome';
import { PolicyView } from './policy/PolicyView';
import { RenewPolicy } from './renew/RenewPolicy';
import { RequestLogPage } from './requests/RequestLogPage';
import { SellPolicy } from './sell/SellPolicy';

export interface WorkbenchRoute {
  /** Relative to the root, in the router's own syntax. */
  path: string;
  /** The route decides the page title; the shell sets it. */
  title: string;
  element: ReactElement;
}

/** The workbench's routes, registered by the router root. */
export const workbenchRoutes: WorkbenchRoute[] = [
  { path: 'workbench', title: 'Workbench', element: <WorkbenchHome /> },
  { path: 'workbench/sell', title: 'Sell a policy', element: <SellPolicy /> },
  { path: 'workbench/policies/:reference', title: 'Policy', element: <PolicyView /> },
  { path: 'workbench/policies/:reference/cancel', title: 'Quote and cancel', element: <CancelPolicy /> },
  { path: 'workbench/policies/:reference/claims/new', title: 'Record a claim', element: <RecordClaim /> },
  { path: 'workbench/policies/:reference/renew', title: 'Renew', element: <RenewPolicy /> },
  { path: 'workbench/requests', title: 'Requests', element: <RequestLogPage /> },
];
