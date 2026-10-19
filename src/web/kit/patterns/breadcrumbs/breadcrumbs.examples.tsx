import type { JSX } from 'react';
import { Breadcrumbs } from './Breadcrumbs';

// The path is the one in the rule mockup header: Overview / build / F2 Retrieve / GET-1.
// The mockup's links are "#", so the hrefs here are "#" too.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <Breadcrumbs
        items={[
          { label: 'Overview', href: '#' },
          { label: 'build', href: '#' },
          { label: 'F2 Retrieve', href: '#' },
          { label: 'GET-1', href: '#', mono: true },
        ]}
      />
    ),
  },
];
