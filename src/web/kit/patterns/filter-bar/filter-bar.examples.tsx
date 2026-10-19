import type { JSX } from 'react';
import { FilterBar } from './FilterBar';
import type { FilterDefinition } from './FilterBar';

// The options are the values the rule mockup shows: step results Pass, Fail and Pending (Gate held and
// Gate failed ride on Pass and Fail), features F2 and F3 (F2 Retrieve is named, F3 is shown as "F3"),
// the agents tester, builder, reviewer and security, and attempts 1, 2 and 3.
// Counts come from the mockup's own table of 17 commit rungs: 9 are by the tester (#5, #12, #14, #26 to #30,
// #34) and none is by security, because the security verdicts are not commit rungs.
function filters(values: { status?: string; feature?: string; agent?: string; attempt?: string }): FilterDefinition[] {
  return [
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: 'pass', label: 'Pass' },
        { value: 'fail', label: 'Fail' },
        { value: 'pending', label: 'Pending' },
      ],
      value: values.status ?? '',
    },
    {
      id: 'feature',
      label: 'Feature',
      options: [
        { value: 'F2', label: 'F2 Retrieve' },
        { value: 'F3', label: 'F3' },
      ],
      value: values.feature ?? '',
    },
    {
      id: 'agent',
      label: 'Agent',
      options: [
        { value: 'tester', label: 'tester' },
        { value: 'builder', label: 'builder' },
        { value: 'reviewer', label: 'reviewer' },
        { value: 'security', label: 'security' },
      ],
      value: values.agent ?? '',
    },
    {
      id: 'attempt',
      label: 'Attempt',
      options: [
        { value: '1', label: 'Attempt 1' },
        { value: '2', label: 'Attempt 2' },
        { value: '3', label: 'Attempt 3' },
      ],
      value: values.attempt ?? '',
    },
  ];
}

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'none set',
    element: <FilterBar filters={filters({})} matchCount={17} totalCount={17} noun="rungs" />,
  },
  {
    state: 'set',
    element: <FilterBar filters={filters({ agent: 'tester' })} matchCount={9} totalCount={17} noun="rungs" />,
  },
  {
    state: 'no matches',
    element: <FilterBar filters={filters({ agent: 'security' })} matchCount={0} totalCount={17} noun="rungs" />,
  },
];
