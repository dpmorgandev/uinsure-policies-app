import type { JSX } from 'react';
import { Search } from '../../patterns/search/Search';
import { TopBar } from './TopBar';

// The app name "Docket" is from docs/ui/concept.md. The search placeholder follows NAV-4 (rule ID, node,
// SHA or file path). The query "GET-1" is a rule ID from the rule mockup. The catalog row has one state,
// "pop", so both bars sit in that one example: the first with the kit Search combobox in the search slot
// (the bar as the app draws it), the second with the bar's own plain input (used only when no slot is
// given). The combobox is given the node and the files the rule mockup names for build/F2 (as in the
// Search examples); its shortcut key is off here because the sink holds many bars.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 0 }}>
        <TopBar
          appName="Docket"
          defaultTheme="system"
          search={
            <Search
              shortcut={null}
              defaultValue="F2"
              results={[
                { id: 'node-build-f2', kind: 'node', label: 'build/F2', detail: 'F2 Retrieve', href: '#' },
                { id: 'path-qa', kind: 'path', label: 'docs/qa/build-F2.md', detail: 'QA step and sign-off', href: '#' },
              ]}
            />
          }
        />
        <TopBar appName="Docket" defaultQuery="GET-1" defaultTheme="system" />
      </div>
    ),
  },
];
