import type { JSX } from 'react';
import { TopBar } from './TopBar';

// The app name "Docket" is from docs/ui/concept.md. The search placeholder follows NAV-4 (rule ID, node,
// SHA or file path). The query "GET-1" is a rule ID from the rule mockup.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: <TopBar appName="Docket" defaultQuery="GET-1" defaultTheme="system" />,
  },
];
