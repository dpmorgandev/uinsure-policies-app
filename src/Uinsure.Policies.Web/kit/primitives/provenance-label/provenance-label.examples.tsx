import type { JSX } from 'react';
import { ProvenanceLabel } from './ProvenanceLabel';
import type { Provenance } from './ProvenanceLabel';

const VALUES: Provenance[] = ['generated', 'recorded', 'written'];

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'each value',
    element: (
      <div style={{ display: 'grid', gap: 'var(--space-2)', justifyItems: 'start' }}>
        {VALUES.map((provenance) => (
          <ProvenanceLabel key={provenance} provenance={provenance} />
        ))}
      </div>
    ),
  },
];
