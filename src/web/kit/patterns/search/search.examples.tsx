import type { JSX } from 'react';
import { Search } from './Search';
import type { SearchResult } from './Search';

// Matches for the query "F2" are the node and the three files the rule mockup names for build/F2:
// the QA document, the loop log and the generated README. The SHA result is rung #5 of GET-1.
const MATCHES_FOR_F2: SearchResult[] = [
  { id: 'node-build-f2', kind: 'node', label: 'build/F2', detail: 'F2 Retrieve', href: '#' },
  { id: 'path-qa', kind: 'path', label: 'docs/qa/build-F2.md', detail: 'QA step and sign-off', href: '#' },
  { id: 'path-loop', kind: 'path', label: 'docs/trace/build/F2/loop.jsonl', detail: 'loop log', href: '#' },
  { id: 'path-readme', kind: 'path', label: 'docs/trace/build/F2/README.md', detail: 'generated README', href: '#' },
];

const MATCHES_FOR_SHA: SearchResult[] = [
  { id: 'sha-94a7473', kind: 'sha', label: '94a7473', detail: '#5 red tester, GET-1', href: '#' },
];

// The "shortcut" key is turned off in these examples: the sink holds many searches, and the key
// belongs to the one search in the page shell.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'empty',
    element: <Search shortcut={null} />,
  },
  {
    state: 'results',
    element: (
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <Search shortcut={null} defaultValue="F2" results={MATCHES_FOR_F2} />
        <Search shortcut={null} defaultValue="94a7473" results={MATCHES_FOR_SHA} />
      </div>
    ),
  },
  {
    // "ZZ-99" is a placeholder query: no rule, node, SHA or path in the data has that name.
    state: 'no results',
    element: <Search shortcut={null} defaultValue="ZZ-99" results={[]} />,
  },
];
