import type { JSX } from 'react';
import { DiffViewer } from './DiffViewer';
import type { DiffFile } from './DiffViewer';

// What is observed (rule mockup): rungs #5 94a7473 (red, tester, tests), #17 92ede9e (green, builder, api) and
// #19 80d3ee2 (refactor, builder, api, "make TwoDecimalPlacesConverter comment true to the code"; the gate says
// the diff is TwoDecimalPlacesConverter.cs, comment only), the load and busy labels, and the error line.
// What is NOT observed: the mockup says "the diff lines are not part of this page's data excerpt". Every diff
// line and line number below is therefore a placeholder, and each line says so in its own text.
const COMMIT = 'https://github.com/dpmorgandev/uinsure-policies-api/commit/';

const POP_FILES: DiffFile[] = [
  {
    path: 'TwoDecimalPlacesConverter.cs (placeholder lines)',
    lines: [
      { kind: 'ctx', oldNo: 1, newNo: 1, text: '// placeholder: a context line above the change' },
      { kind: 'del', oldNo: 2, text: '// placeholder: the comment before the commit' },
      { kind: 'add', newNo: 2, text: '// placeholder: the comment after the commit, true to the code' },
      { kind: 'ctx', oldNo: 3, newNo: 3, text: '// placeholder: a context line below the change' },
    ],
  },
];

// A long diff: 24 placeholder lines, and one line with the long test names from the gate.stub detail (observed).
const LONG_FILES: DiffFile[] = [
  {
    path: 'placeholder/LongDiff.cs (placeholder lines)',
    lines: [
      ...Array.from({ length: 24 }, (_, index): DiffFile['lines'][number] => ({
        kind: index % 6 === 3 ? 'add' : index % 6 === 4 ? 'del' : 'ctx',
        oldNo: index % 6 === 3 ? undefined : index + 1,
        newNo: index % 6 === 4 ? undefined : index + 1,
        text: `// placeholder: line ${index + 1} of a long diff`,
      })),
      {
        kind: 'add',
        newNo: 25,
        text: '// Policy_sold_to_start_today_reads_back_Active, Status_on_the_start_date_is_Active, Status_on_the_end_date_is_Active, Status_at_23_30_UTC_on_an_end_date_in_GMT_is_Active, Status_at_22_59_UTC_on_an_end_date_in_BST_is_Active',
      },
    ],
  },
];

export const examples: { state: string; element: JSX.Element }[] = [
  {
    // Both halves of loading on demand: asked for nothing yet (the green diff), and asked and waiting (the red diff).
    state: 'load',
    element: (
      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <DiffViewer
          status="loading"
          rung="#5"
          sha="94a7473"
          githubHref={`${COMMIT}94a7473`}
          tdd="red"
          layer="tests"
          agent="tester"
          loadLabel="Load red diff, #5 94a7473"
          busyLabel="Loading red diff…"
          loadingStatus="Loading the diff chunk for #5 94a7473."
        />
        <DiffViewer
          status="idle"
          rung="#17"
          sha="92ede9e"
          githubHref={`${COMMIT}92ede9e`}
          tdd="green"
          layer="api"
          agent="builder"
          loadLabel="Load green diff, #17 92ede9e"
          busyLabel="Loading green diff…"
          onLoad={() => undefined}
        />
      </div>
    ),
  },
  {
    state: 'pop',
    element: (
      <DiffViewer
        status="loaded"
        rung="#19"
        sha="80d3ee2"
        githubHref={`${COMMIT}80d3ee2`}
        tdd="refactor"
        layer="api"
        agent="builder"
        files={POP_FILES}
      />
    ),
  },
  {
    state: 'err',
    element: (
      <DiffViewer
        status="error"
        rung="#5"
        sha="94a7473"
        githubHref={`${COMMIT}94a7473`}
        tdd="red"
        layer="tests"
        agent="tester"
        error="The diff for #5 94a7473 did not load. The commit page on GitHub still opens."
        onRetry={() => undefined}
      />
    ),
  },
  {
    state: 'long',
    element: (
      <div style={{ maxWidth: '26rem' }}>
        <DiffViewer
          status="loaded"
          rung="#17"
          sha="92ede9e"
          githubHref={`${COMMIT}92ede9e`}
          tdd="green"
          layer="api"
          agent="builder"
          files={LONG_FILES}
          maxHeight="18rem"
        />
      </div>
    ),
  },
];
