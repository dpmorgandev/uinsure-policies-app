import type { ReactElement } from 'react';
import { CancelPolicy } from './cancel/CancelPolicy';
import { WorkbenchHome } from './home/WorkbenchHome';
import { PolicyView } from './policy/PolicyView';
import { SellPolicy } from './sell/SellPolicy';

export interface WorkbenchRoute {
  /** Relative to the root, in the router's own syntax. */
  path: string;
  /** The route decides the page title; the shell sets it. */
  title: string;
  element: ReactElement;
}

/** W1's routes, registered by the router root. Cancel, renew and record-a-claim are W2's and W3's: until then they fall to the not-built page. */
export const workbenchRoutes: WorkbenchRoute[] = [
  { path: 'workbench', title: 'Workbench', element: <WorkbenchHome /> },
  { path: 'workbench/sell', title: 'Sell a policy', element: <SellPolicy /> },
  { path: 'workbench/policies/:reference', title: 'Policy', element: <PolicyView /> },
  { path: 'workbench/policies/:reference/cancel', title: 'Quote and cancel', element: <CancelPolicy /> },
];
