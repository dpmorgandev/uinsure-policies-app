import type { JSX } from 'react';

import { examples as statusTag } from '../primitives/status-tag/status-tag.examples';
import { examples as tddStepTag } from '../primitives/tdd-step-tag/tdd-step-tag.examples';
import { examples as agentBadge } from '../primitives/agent-badge/agent-badge.examples';
import { examples as ruleChip } from '../primitives/rule-chip/rule-chip.examples';
import { examples as shaLink } from '../primitives/sha-link/sha-link.examples';
import { examples as fileLineLink } from '../primitives/file-line-link/file-line-link.examples';
import { examples as redactionToken } from '../primitives/redaction-token/redaction-token.examples';
import { examples as timestamp } from '../primitives/timestamp/timestamp.examples';
import { examples as provenanceLabel } from '../primitives/provenance-label/provenance-label.examples';
import { examples as disclosure } from '../primitives/disclosure/disclosure.examples';
import { examples as tabs } from '../primitives/tabs/tabs.examples';
import { examples as codeBlock } from '../primitives/code-block/code-block.examples';
import { examples as themeToggle } from '../primitives/theme-toggle/theme-toggle.examples';
import { examples as button } from '../primitives/button/button.examples';
import { examples as spinner } from '../primitives/spinner/spinner.examples';
import { examples as textInput } from '../primitives/text-input/text-input.examples';
import { examples as textArea } from '../primitives/text-area/text-area.examples';
import { examples as dateInput } from '../primitives/date-input/date-input.examples';
import { examples as moneyInput } from '../primitives/money-input/money-input.examples';
import { examples as select } from '../primitives/select/select.examples';
import { examples as radioGroup } from '../primitives/radio-group/radio-group.examples';
import { examples as switchControl } from '../primitives/switch/switch.examples';
import { examples as money } from '../primitives/money/money.examples';

import { examples as pageHeader } from '../patterns/page-header/page-header.examples';
import { examples as breadcrumbs } from '../patterns/breadcrumbs/breadcrumbs.examples';
import { examples as search } from '../patterns/search/search.examples';
import { examples as filterBar } from '../patterns/filter-bar/filter-bar.examples';
import { examples as dataTable } from '../patterns/data-table/data-table.examples';
import { examples as keyValueList } from '../patterns/key-value-list/key-value-list.examples';
import { examples as markdownText } from '../patterns/markdown-text/markdown-text.examples';
import { examples as jsonViewer } from '../patterns/json-viewer/json-viewer.examples';
import { examples as diffViewer } from '../patterns/diff-viewer/diff-viewer.examples';
import { examples as verifyCommand } from '../patterns/verify-command/verify-command.examples';
import { examples as emptyState } from '../patterns/empty-state/empty-state.examples';
import { examples as receiptFigure } from '../patterns/receipt-figure/receipt-figure.examples';
import { examples as field } from '../patterns/field/field.examples';
import { examples as formSection } from '../patterns/form-section/form-section.examples';
import { examples as repeatableGroup } from '../patterns/repeatable-group/repeatable-group.examples';
import { examples as constraintHint } from '../patterns/constraint-hint/constraint-hint.examples';
import { examples as errorSummary } from '../patterns/error-summary/error-summary.examples';
import { examples as inlineError } from '../patterns/inline-error/inline-error.examples';
import { examples as problemBanner } from '../patterns/problem-banner/problem-banner.examples';
import { examples as requestLog } from '../patterns/request-log/request-log.examples';
import { examples as httpExchange } from '../patterns/http-exchange/http-exchange.examples';
import { examples as confirmDialog } from '../patterns/confirm-dialog/confirm-dialog.examples';
import { examples as documentPage } from '../patterns/document-page/document-page.examples';

import { examples as appShell } from '../layouts/app-shell/app-shell.examples';
import { examples as topBar } from '../layouts/top-bar/top-bar.examples';
import { examples as primaryNav } from '../layouts/primary-nav/primary-nav.examples';
import { examples as footer } from '../layouts/footer/footer.examples';
import { examples as compiledAtStamp } from '../layouts/compiled-at-stamp/compiled-at-stamp.examples';
import { examples as inspectorDrawer } from '../layouts/inspector-drawer/inspector-drawer.examples';

import { examples as rungSpine } from '../project/rung-spine/rung-spine.examples';
import { examples as ruleEvidence } from '../project/rule-evidence/rule-evidence.examples';
import { examples as completenessBanner } from '../project/completeness-banner/completeness-banner.examples';
import { examples as notBuiltYet } from '../project/not-built-yet/not-built-yet.examples';
import { examples as sourcesDisagree } from '../project/sources-disagree/sources-disagree.examples';
import { examples as gateRow } from '../project/gate-row/gate-row.examples';
import { examples as attemptLadder } from '../project/attempt-ladder/attempt-ladder.examples';
import { examples as verdictCard } from '../project/verdict-card/verdict-card.examples';
import { examples as findingCard } from '../project/finding-card/finding-card.examples';
import { examples as agentLanes } from '../project/agent-lanes/agent-lanes.examples';
import { examples as humanDecisionRow } from '../project/human-decision-row/human-decision-row.examples';
import { examples as dagGraph } from '../project/dag-graph/dag-graph.examples';
import { examples as dagTable } from '../project/dag-table/dag-table.examples';
import { examples as termTimeline } from '../project/term-timeline/term-timeline.examples';
import { examples as refundWorkedSum } from '../project/refund-worked-sum/refund-worked-sum.examples';
import { examples as quoteCancelCompare } from '../project/quote-cancel-compare/quote-cancel-compare.examples';
import { examples as referencePreview } from '../project/reference-preview/reference-preview.examples';
import { examples as sendAnywayToggle } from '../project/send-anyway-toggle/send-anyway-toggle.examples';
import { examples as recentPolicies } from '../project/recent-policies/recent-policies.examples';

export type Tier = 'primitive' | 'pattern' | 'layout' | 'project';

export type Example = { state: string; element: JSX.Element };

export type CatalogEntry = { id: string; examples: Example[] };

export type TierGroup = { tier: Tier; title: string; entries: CatalogEntry[] };

// Catalog order: primitives, patterns, layout, project. The data-comp tier word is the singular `tier`.
export const TIERS: TierGroup[] = [
  {
    tier: 'primitive',
    title: 'Primitives',
    entries: [
      { id: 'status-tag', examples: statusTag },
      { id: 'tdd-step-tag', examples: tddStepTag },
      { id: 'agent-badge', examples: agentBadge },
      { id: 'rule-chip', examples: ruleChip },
      { id: 'sha-link', examples: shaLink },
      { id: 'file-line-link', examples: fileLineLink },
      { id: 'redaction-token', examples: redactionToken },
      { id: 'timestamp', examples: timestamp },
      { id: 'provenance-label', examples: provenanceLabel },
      { id: 'disclosure', examples: disclosure },
      { id: 'tabs', examples: tabs },
      { id: 'code-block', examples: codeBlock },
      { id: 'theme-toggle', examples: themeToggle },
      { id: 'button', examples: button },
      { id: 'spinner', examples: spinner },
      { id: 'text-input', examples: textInput },
      { id: 'text-area', examples: textArea },
      { id: 'date-input', examples: dateInput },
      { id: 'money-input', examples: moneyInput },
      { id: 'select', examples: select },
      { id: 'radio-group', examples: radioGroup },
      { id: 'switch', examples: switchControl },
      { id: 'money', examples: money },
    ],
  },
  {
    tier: 'pattern',
    title: 'Patterns',
    entries: [
      { id: 'page-header', examples: pageHeader },
      { id: 'breadcrumbs', examples: breadcrumbs },
      { id: 'search', examples: search },
      { id: 'filter-bar', examples: filterBar },
      { id: 'data-table', examples: dataTable },
      { id: 'key-value-list', examples: keyValueList },
      { id: 'markdown-text', examples: markdownText },
      { id: 'json-viewer', examples: jsonViewer },
      { id: 'diff-viewer', examples: diffViewer },
      { id: 'verify-command', examples: verifyCommand },
      { id: 'empty-state', examples: emptyState },
      { id: 'receipt-figure', examples: receiptFigure },
      { id: 'field', examples: field },
      { id: 'form-section', examples: formSection },
      { id: 'repeatable-group', examples: repeatableGroup },
      { id: 'constraint-hint', examples: constraintHint },
      { id: 'error-summary', examples: errorSummary },
      { id: 'inline-error', examples: inlineError },
      { id: 'problem-banner', examples: problemBanner },
      { id: 'request-log', examples: requestLog },
      { id: 'http-exchange', examples: httpExchange },
      { id: 'confirm-dialog', examples: confirmDialog },
      { id: 'document-page', examples: documentPage },
    ],
  },
  {
    tier: 'layout',
    title: 'Layout',
    entries: [
      { id: 'app-shell', examples: appShell },
      { id: 'top-bar', examples: topBar },
      { id: 'primary-nav', examples: primaryNav },
      { id: 'footer', examples: footer },
      { id: 'compiled-at-stamp', examples: compiledAtStamp },
      { id: 'inspector-drawer', examples: inspectorDrawer },
    ],
  },
  {
    tier: 'project',
    title: 'Project',
    entries: [
      { id: 'rung-spine', examples: rungSpine },
      { id: 'rule-evidence', examples: ruleEvidence },
      { id: 'completeness-banner', examples: completenessBanner },
      { id: 'not-built-yet', examples: notBuiltYet },
      { id: 'sources-disagree', examples: sourcesDisagree },
      { id: 'gate-row', examples: gateRow },
      { id: 'attempt-ladder', examples: attemptLadder },
      { id: 'verdict-card', examples: verdictCard },
      { id: 'finding-card', examples: findingCard },
      { id: 'agent-lanes', examples: agentLanes },
      { id: 'human-decision-row', examples: humanDecisionRow },
      { id: 'dag-graph', examples: dagGraph },
      { id: 'dag-table', examples: dagTable },
      { id: 'term-timeline', examples: termTimeline },
      { id: 'refund-worked-sum', examples: refundWorkedSum },
      { id: 'quote-cancel-compare', examples: quoteCancelCompare },
      { id: 'reference-preview', examples: referencePreview },
      { id: 'send-anyway-toggle', examples: sendAnywayToggle },
      { id: 'recent-policies', examples: recentPolicies },
    ],
  },
];
