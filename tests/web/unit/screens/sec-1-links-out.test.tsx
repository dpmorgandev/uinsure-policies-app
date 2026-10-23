// SEC-1 · Safe rendering. A link out of the app carries rel="noreferrer", so the page's URL never reaches GitHub
// (react-web's safe rendering; U4 security A2 S3, carried to U10). The footer and ShaLink already do; these are the
// four kit links U4's review found without it: FileLineLink, ReceiptFigure's source, PageHeader's id link and
// RuleEvidence's QA and PR links. Each is rendered from the kit barrel, as a screen uses it, with a GitHub href.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { FileLineLink, PageHeader, ReceiptFigure, RuleEvidence } from '../../../../src/web/kit';

const REPO = 'https://github.com/dpmorgandev/uinsure-policies-api';
const SHA = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';

/** The rel tokens of the one link with this accessible name. */
function relOf(name: string | RegExp): string[] {
  return (screen.getByRole('link', { name }).getAttribute('rel') ?? '').split(/\s+/).filter(Boolean);
}

afterEach(() => {
  cleanup();
});

test('SEC-1 · FileLineLink opens the file on GitHub with rel="noreferrer"', () => {
  render(<FileLineLink path="src/Uinsure.Policies.Domain/StartDate.cs" line={12} href={`${REPO}/blob/${SHA}/src/Uinsure.Policies.Domain/StartDate.cs#L12`} />);
  expect(relOf('src/Uinsure.Policies.Domain/StartDate.cs:12 on GitHub')).toContain('noreferrer');
});

test("SEC-1 · ReceiptFigure's external source link carries rel=\"noreferrer\"", () => {
  render(<ReceiptFigure value="41 of 41" unit="tests passing" source={{ label: 'docs/qa/build-F2.md', href: `${REPO}/blob/${SHA}/docs/qa/build-F2.md`, external: true }} />);
  expect(relOf(/docs\/qa\/build-F2\.md/)).toContain('noreferrer');
});

test("SEC-1 · PageHeader's id link to GitHub carries rel=\"noreferrer\"", () => {
  render(<PageHeader title="Commit" ids={[{ label: 'SHA', value: SHA.slice(0, 7), href: `${REPO}/commit/${SHA}` }]} />);
  expect(relOf(SHA.slice(0, 7))).toContain('noreferrer');
});

test("SEC-1 · RuleEvidence's QA step link carries rel=\"noreferrer\"", () => {
  render(<RuleEvidence ruleId="SELL-1" commits={[]} qa={{ ref: 'docs/qa/build-F1.md#1', href: `${REPO}/blob/${SHA}/docs/qa/build-F1.md#1`, result: 'pass' }} />);
  expect(relOf('docs/qa/build-F1.md#1')).toContain('noreferrer');
});

test("SEC-1 · RuleEvidence's PR link carries rel=\"noreferrer\"", () => {
  render(<RuleEvidence ruleId="SELL-1" commits={[]} pr={{ number: 10, href: `${REPO}/pull/10`, state: 'merged' }} />);
  expect(relOf('PR #10')).toContain('noreferrer');
});
