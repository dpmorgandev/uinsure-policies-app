import type { JSX } from 'react';
import { FindingCard } from './FindingCard';

// Observed: the reviewer's A2 and A3 findings and the fix commits rule.html lists for build/F2 (#26 to #34).
// Not observed, so the cards say "not recorded in the excerpt" instead of showing a value: every finding's cause,
// files, fix direction and suggested test. The finding-to-reviewer pairing (A2/I1 with R1, A2/I2 with R2) is by
// number only; the excerpt does not state it. Each caption says what is a placeholder.

const GITHUB = 'https://github.com/dpmorgandev/uinsure-policies-api/commit/';
const frame = { maxWidth: '44rem' } as const;
const note = {
  margin: 'var(--space-2) 0 0',
  fontSize: 'var(--text-14)',
  color: 'var(--color-text-secondary)',
} as const;

const LONG =
  '(a) 5 pass by the canned status Active coinciding: Policy_sold_to_start_today_reads_back_Active, Status_on_the_start_date_is_Active, Status_on_the_end_date_is_Active, Status_at_23_30_UTC_on_an_end_date_in_GMT_is_Active, Status_at_22_59_UTC_on_an_end_date_in_BST_is_Active. (b) 7 pass on behaviour already delivered by F1/F1b: the four RetrieveNotFoundTests 404 rows; Today_inside_the_first_of_two_terms_shows_the_first_term, Last_day_of_the_first_term_still_shows_the_first_term, Unpaid_second_term_reads_back_with_no_payment_reference_and_no_payment. David: fix (a), accept (b) as pinned.';

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'testable',
    element: (
      <div style={frame}>
        <FindingCard
          id="A2/I1"
          severity="P1"
          symptom="hasClaims hard-coded false though stored, no test seeds true."
          testable
          fixedBy={{
            sha: '8be3aed',
            githubHref: `${GITHUB}8be3aed`,
            trailer: 'Fixes-Finding: A2/I1',
            subject: 'map stored HasClaims, make comments true',
          }}
        />
        <p style={note}>
          Its failing test is rung #26 (357e108, "fix A2/I1"), before the fix at #31. Paired with the reviewer's R1 by
          number only.
        </p>
      </div>
    ),
  },
  {
    state: 'untestable',
    element: (
      <div style={frame}>
        <FindingCard
          id="A2/I2"
          severity="P2"
          symptom="stale PolicyResponse comment"
          testable={false}
          untestableReason="Placeholder: the excerpt records no reason."
          fixedBy={{
            sha: '8be3aed',
            githubHref: `${GITHUB}8be3aed`,
            trailer: 'Fixes: A2/I1+I2',
            subject: 'map stored HasClaims, make comments true',
          }}
        />
        <p style={note}>
          Placeholder: no finding in the excerpt is marked untestable. A2/I2 is shown because rung #31 fixes it together
          with A2/I1 and the commit says "make comments true"; its pairing with the reviewer's R2 is by number only.
        </p>
      </div>
    ),
  },
  {
    state: 'unfixed',
    element: (
      <div style={frame}>
        <FindingCard
          id="A3/R1"
          severity="P2"
          symptom="Postman decimal.MinValue SELL-7 check is a prefix match that passes with or without .00."
          testable
          fixedBy={null}
        />
        <p style={note}>
          Its failing test is rung #34 (143e5ba). No green row follows #34 in the excerpt, so no fix commit is shown; the
          A3.2 reviewer verdict says A3 R1 is closed.
        </p>
      </div>
    ),
  },
  {
    state: 'long',
    element: (
      <div style={{ maxWidth: '28rem' }}>
        <FindingCard id="A1/I1" symptom={LONG} testable fixedBy={null} />
        <p style={note}>
          Placeholder text: the excerpt holds no long finding. This is the gate.stub 1·2 detail that round A1 answers, used
          to show a long symptom wrapping inside a narrow card.
        </p>
      </div>
    ),
  },
];
