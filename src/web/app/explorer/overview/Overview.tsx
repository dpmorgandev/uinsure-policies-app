import {
  CompletenessBanner,
  NotBuiltYet,
  PageHeader,
  ReceiptFigure,
  RuleChip,
  Search,
  StatusTag,
  ThemeToggle,
  VerifyCommand,
} from '../../../kit';
import { DataNotice } from '../../shell/DataNotice';
import { NotBuiltRegion, Rung } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';

export function Overview() {
  const { trace, theme, setTheme } = useShell();
  return (
    <>
      {trace.state === 'ready' ? null : <DataNotice trace={trace} />}
      <Rung region="headline-answer" req="NAV-1" ordinal="Step 1" heading="Read the answer">
        <PageHeader eyebrow="Overview" title="Overview" />
      </Rung>
      <Rung
        region="receipt-figures-rules-built-total-tests-passing-nodes-done-attempts-and-fails-human-decisions"
        req="NAV-1 VERIFY-1"
        ordinal="Step 2"
        heading="Check the figures"
      >
        <ReceiptFigure unit="rules built" />
        <VerifyCommand command="git log --oneline" intro="Run this in a clone." />
      </Rung>
      <NotBuiltRegion region="build-plan-at-a-glance" name="build plan at a glance" />
      <NotBuiltRegion region="latest-human-decisions" name="latest human decisions" />
      {trace.state === 'ready' ? (
        <Rung region="compiled-at-stamp" req="DATA-3" ordinal="Step 5" heading="Check the snapshot">
          <p className="s-text">
            This page is a snapshot, not live. It was compiled from <code>{trace.snapshot.ref}</code> at{' '}
            <code>{trace.snapshot.short}</code>, on <code>{trace.snapshot.utc}</code>.
          </p>
        </Rung>
      ) : null}
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
        <ThemeToggle value={theme} onChange={setTheme} />
      </Rung>
      <Rung
        region="trail-completeness-trail-incomplete-reasons-verbatim-not-built-yet-and-f0a-as-git-only"
        req="DATA-4"
        ordinal="Step 7"
        heading="Is every trail complete?"
      >
        <CompletenessBanner value="OK" />
        <StatusTag status="not-built" />
        <RuleChip ruleId="GET-1" href="#/rules/GET-1" />
        <NotBuiltYet kind="region" name="trail completeness" />
      </Rung>
    </>
  );
}
