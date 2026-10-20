import { Search, ThemeToggle } from '../../../kit';
import { NotBuiltRegion, Rung } from '../../shell/Rung';

// Canned for the stub: the loader replaces the snapshot values with trace.json's.
export function Overview() {
  return (
    <>
      <NotBuiltRegion region="headline-answer" name="headline answer" />
      <NotBuiltRegion
        region="receipt-figures-rules-built-total-tests-passing-nodes-done-attempts-and-fails-human-decisions"
        name="receipt figures (rules built/total, tests passing, nodes done, attempts and FAILs, human decisions)"
      />
      <NotBuiltRegion region="build-plan-at-a-glance" name="build plan at a glance" />
      <NotBuiltRegion region="latest-human-decisions" name="latest human decisions" />
      <Rung region="compiled-at-stamp" req="DATA-3" ordinal="Step 5" heading="Check the snapshot">
        <p className="s-text">
          Every count on this page was made from one snapshot: <code>origin/main</code> at <code>b394466</code>,
          compiled <code>2026-10-19T17:45:08Z</code>.
        </p>
        <p className="s-text">
          The ui plan was read from <code>origin/ui</code> at <code>64e52cf</code>, not from origin/main.
        </p>
      </Rung>
      <Rung
        region="top-bar-search-and-theme-toggle-global-tagged-here-once"
        req="NAV-4 THEME-1"
        ordinal="Step 6"
        heading="Find anything"
      >
        <p className="s-text">
          Global: the same two controls sit in the top bar on every page. This region tags them once for this screen.
        </p>
        <Search label="Jump to a rule, node, SHA or path" />
        <ThemeToggle defaultValue="system" />
      </Rung>
      <NotBuiltRegion
        region="trail-completeness-trail-incomplete-reasons-verbatim-not-built-yet-and-f0a-as-git-only"
        name={'trail completeness: TRAIL INCOMPLETE reasons verbatim, "not built yet", and F0a as git-only'}
      />
    </>
  );
}
