import type { JSX } from 'react';
import { ErrorSummary } from './ErrorSummary';

const note = {
  margin: 'var(--space-2) 0 0',
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--text-14)',
} as const;

const FORMAT = 'The cancellation date must be a date in the form yyyy-MM-dd.';

// Messages, keys, rule IDs and the extension value are from the wb-cancel mockup: 400 at QA step 48,
// 422 CANCEL-3 at QA step 16 (today 2026-10-19), the required message at QA step 22, CANCEL-7 at step 21.
// The mockup draws no 422 with several violations, so the multi example is labelled a placeholder.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'one',
    element: <ErrorSummary focusOnMount={false} items={[{ message: FORMAT, fieldId: 'cancellationDate' }]} />,
  },
  {
    state: 'several',
    element: (
      <div>
        <ErrorSummary
          focusOnMount={false}
          items={[
            { message: FORMAT, fieldId: 'cancellationDate' },
            { message: 'The cancellationDate field is required.', fieldId: 'cancellationDate' },
          ]}
        />
        <p style={note}>Placeholder: two recorded messages joined; the trail holds no response with two.</p>
      </div>
    ),
  },
  {
    state: '400 (field keys)',
    element: (
      <ErrorSummary
        focusOnMount={false}
        items={[{ message: FORMAT, fieldId: 'cancellationDate', fieldKey: 'cancellationDate' }]}
      />
    ),
  },
  {
    state: '422 single (extensions)',
    element: (
      <ErrorSummary
        focusOnMount={false}
        items={[
          {
            message: 'Cancellation date in the past',
            fieldId: 'cancellationDate',
            ruleId: 'CANCEL-3',
            extensions: [{ name: 'today', value: '2026-10-19' }],
          },
        ]}
      />
    ),
  },
  {
    state: '422 multi (no field path: listed, not placed)',
    element: (
      <div>
        <ErrorSummary
          focusOnMount={false}
          items={[
            { message: 'Cancellation date in the past', ruleId: 'CANCEL-3' },
            { message: 'Cancellation date after the end of cover', ruleId: 'CANCEL-7' },
          ]}
        />
        <p style={note}>Placeholder: two recorded 422 messages joined; the trail holds no 422 with several violations.</p>
      </div>
    ),
  },
];
