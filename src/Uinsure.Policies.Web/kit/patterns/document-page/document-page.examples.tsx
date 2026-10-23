import type { JSX } from 'react';
import { DocumentCallout, DocumentFigure, DocumentPage, DocumentSection } from './DocumentPage';

// All prose is the repository's own: docs/ui/concept.md (the concept, the T5 licence check and what is
// still open) and the territory's fields in docs/ui/directions.json (excludes, layout, tone, proposition).
// No text is invented; the section ids are the only thing written for the example.

const GOVERNING_IDEA =
  'Order is the proof: every story the app tells (a rule going red then green, an attempt failing then being fixed, a quote leading to a cancel) is a numbered sequence read top to bottom, and nothing can be read out of turn.';

const TYPE_TABLE = (
  <DocumentFigure caption="The T5 pair, both OFL-1.1 in their Google Fonts builds (docs/ui/concept.md).">
    <table>
      <caption>Faces in the kit</caption>
      <thead>
        <tr>
          <th scope="col">Face</th>
          <th scope="col">Role</th>
          <th scope="col">Licence</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Atkinson Hyperlegible Next</th>
          <td>Sans</td>
          <td>OFL-1.1</td>
        </tr>
        <tr>
          <th scope="row">Atkinson Hyperlegible Mono</th>
          <td>Mono</td>
          <td>OFL-1.1</td>
        </tr>
      </tbody>
    </table>
  </DocumentFigure>
);

const OPEN = (
  <DocumentCallout tone="warning" title="Still open before G3">
    <p>
      Tabular figures in both faces: neither page states them. The kit&apos;s specimen test settles it.
    </p>
  </DocumentCallout>
);

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <DocumentPage
        eyebrow="Chosen at G2 (round 2), 2026-10-19"
        title="Docket: concept"
        lede="David adopted the territory's governing idea unchanged as the concept."
      >
        <DocumentSection id="pop-concept" heading="Concept">
          <blockquote>
            <p>{GOVERNING_IDEA}</p>
          </blockquote>
          <p>
            The governing idea was written by the creative-director agent, and David adopted it as his concept. It was
            not written by him; this is recorded for EFF-9.
          </p>
        </DocumentSection>
        <DocumentSection id="pop-type" heading="Type: T5, licence checked">
          <p>
            Both faces are OFL-1.1 in their Google Fonts builds, so they can be self-hosted from a public repo.
          </p>
          {TYPE_TABLE}
          {OPEN}
        </DocumentSection>
      </DocumentPage>
    ),
  },
  {
    state: 'long',
    element: (
      <DocumentPage
        eyebrow="Chosen at G2 (round 2), 2026-10-19"
        title="Docket: concept"
        lede="David adopted the territory's governing idea unchanged as the concept. What the territory refuses and the category default it departs from are its excludes and categoryDeparture in docs/ui/directions.json."
        contents={[
          { id: 'long-concept', label: 'Concept' },
          { id: 'long-proposition', label: 'The proposition' },
          { id: 'long-refuses', label: 'What the territory refuses' },
          { id: 'long-layout', label: 'Layout' },
          { id: 'long-tone', label: 'Tone' },
          { id: 'long-type', label: 'Type: T5, licence checked' },
        ]}
      >
        <DocumentSection id="long-concept" heading="Concept">
          <blockquote>
            <p>{GOVERNING_IDEA}</p>
          </blockquote>
          <p>
            The governing idea was written by the creative-director agent, and David adopted it as his concept. It was
            not written by him; this is recorded for EFF-9.
          </p>
        </DocumentSection>
        <DocumentSection id="long-proposition" heading="The proposition">
          <DocumentFigure caption="The single-minded proposition, from docs/ui/directions.json.">
            <blockquote>
              <p>It happened in the order shown: test before code, every failure before its fix, quote before cancel.</p>
            </blockquote>
          </DocumentFigure>
        </DocumentSection>
        <DocumentSection id="long-refuses" heading="What the territory refuses">
          <ol>
            <li>
              A two-axis matrix as the way into a story: the rule page and the cancel screen read down one spine, and
              the matrix is only an index.
            </li>
            <li>
              Wall-clock time axes, waterfalls and duration bars: position is ordinal (#1, #2, ...), because the
              walkthrough and matrix carry commit order, not commit dates, and API responses carry no timestamps.
            </li>
            <li>Side-by-side panes and tabs that let a story&apos;s steps be read out of order.</li>
            <li>Folding retries into a counter or a passing summary: every attempt keeps its own rung.</li>
            <li>
              Asking the user to re-enter a value a later step depends on: the quoted date is carried down, not typed
              again.
            </li>
          </ol>
        </DocumentSection>
        <DocumentSection id="long-layout" heading="Layout">
          <p>
            Single vertical spine of numbered rungs: an ordinal rail down the page with each step&apos;s label to its
            left and its receipt to its right; retries step off to the side and rejoin the spine; the keyboard moves
            rung to rung with the keys shown; at 390 wide the rail moves to the left edge and receipts stack under
            their labels.
          </p>
        </DocumentSection>
        <DocumentSection id="long-tone" heading="Tone">
          <p>
            Procedural and stepwise: a numbered protocol with short imperative step labels, one thing at a time.
          </p>
        </DocumentSection>
        <DocumentSection id="long-type" heading="Type: T5, licence checked">
          <p>
            Both faces are OFL-1.1 in their Google Fonts builds, so they can be self-hosted from a public repo. The
            research&apos;s &quot;EULA&quot; was the Braille Institute&apos;s own download; the kit uses the Google
            Fonts OFL builds, and their <code>OFL.txt</code> ships beside the font files.
          </p>
          {TYPE_TABLE}
          {OPEN}
        </DocumentSection>
      </DocumentPage>
    ),
  },
];
