import type { JSX } from 'react';
import { Switch } from './Switch';

// "Auto-renew" is the setting named in the catalog row (autoRenew, A1).
export const examples: { state: string; element: JSX.Element }[] = [
  { state: 'on', element: <Switch label="Auto-renew" defaultChecked /> },
  { state: 'off', element: <Switch label="Auto-renew" /> },
  { state: 'focus', element: <Switch label="Auto-renew" defaultChecked data-show-focus /> },
];
