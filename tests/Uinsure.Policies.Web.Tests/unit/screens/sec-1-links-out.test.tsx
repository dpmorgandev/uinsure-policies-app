// SEC-1 · Safe rendering. A link out of the app never sends the page's URL to GitHub (react-web's safe rendering;
// U4 security A2 S3, carried to U10). U10's acceptance takes its stated alternative (orchestrator ruling, 2026-10-23):
// U7's document referrer policy covers the four kit links U4's review found without rel="noreferrer" (FileLineLink,
// ReceiptFigure's source, PageHeader's id link and RuleEvidence's QA and PR links), so the kit is not changed. These
// tests prove the cover: the shipped index.html sets no-referrer, the static host's Referrer-Policy header sets it
// too, and none of the four links overrides it with a weaker referrerpolicy attribute. Each link is rendered from the
// kit barrel, as a screen uses it, with a GitHub href.
import { readFileSync } from 'node:fs';
import { URL as NodeURL, fileURLToPath } from 'node:url';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { FileLineLink, PageHeader, ReceiptFigure, RuleEvidence } from '../../../../src/Uinsure.Policies.Web/kit';

const REPO = 'https://github.com/dpmorgandev/uinsure-policies-api';
const SHA = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';

/**
 * The app entry the build ships, and the static host's config (the Referrer-Policy header it sends). jsdom replaces the
 * global URL, which node's fs refuses, so each path is built with node's own URL (as support/app.tsx does).
 */
const INDEX_HTML = fileURLToPath(new NodeURL('../../../../src/Uinsure.Policies.Web/index.html', import.meta.url));
const HOST_CONFIG = fileURLToPath(new NodeURL('../../../../infrastructure/web/staticwebapp.config.json', import.meta.url));

/**
 * The link with this accessible name: its href, and its own referrerpolicy attribute (null when it sets none, so the
 * document's policy applies).
 */
function linkOut(name: string | RegExp): { href: string; policy: string | null } {
  const a = screen.getByRole('link', { name });
  const policy = a.getAttribute('referrerpolicy');
  return { href: a.getAttribute('href') ?? '', policy: policy === null ? null : policy.trim().toLowerCase() };
}

/** A link leaves the document's no-referrer policy in force: it sets no referrerpolicy, or sets no-referrer itself. */
function expectCovered(link: { href: string; policy: string | null }): void {
  expect(link.href, 'the link goes out to GitHub').toMatch(/^https:\/\/github\.com\//);
  expect([null, 'no-referrer'], `referrerpolicy=${String(link.policy)} keeps no-referrer`).toContain(link.policy);
}

afterEach(() => {
  cleanup();
});

test('SEC-1 · the shipped index.html sets the document referrer policy to no-referrer, and nothing later in it overrides that', () => {
  const doc = new DOMParser().parseFromString(readFileSync(INDEX_HTML, 'utf8'), 'text/html');
  const metas = [...doc.querySelectorAll('meta[name="referrer" i]')].map((m) => (m.getAttribute('content') ?? '').trim().toLowerCase());
  // The last referrer meta is the one in force; there is exactly one, and it is no-referrer.
  expect(metas, '<meta name="referrer" content="no-referrer"> in the head, once').toEqual(['no-referrer']);
  expect(doc.head.querySelector('meta[name="referrer" i]'), 'the referrer meta is in the head').not.toBeNull();
});

test('SEC-1 · the static host sends Referrer-Policy: no-referrer on every response', () => {
  const config = JSON.parse(readFileSync(HOST_CONFIG, 'utf8')) as { globalHeaders?: Record<string, string> };
  const header = Object.entries(config.globalHeaders ?? {}).find(([name]) => name.toLowerCase() === 'referrer-policy')?.[1];
  // A Referrer-Policy header is a comma-separated list whose last token wins.
  const policy = (header ?? '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0)
    .at(-1);
  expect(policy ?? null, 'globalHeaders["Referrer-Policy"] in staticwebapp.config.json').toBe('no-referrer');
});

test("SEC-1 · FileLineLink's link to GitHub sets no referrerpolicy weaker than the document's no-referrer", () => {
  render(<FileLineLink path="src/Uinsure.Policies.Domain/StartDate.cs" line={12} href={`${REPO}/blob/${SHA}/src/Uinsure.Policies.Domain/StartDate.cs#L12`} />);
  expectCovered(linkOut('src/Uinsure.Policies.Domain/StartDate.cs:12 on GitHub'));
});

test("SEC-1 · ReceiptFigure's external source link sets no referrerpolicy weaker than the document's no-referrer", () => {
  render(<ReceiptFigure value="41 of 41" unit="tests passing" source={{ label: 'docs/qa/build-F2.md', href: `${REPO}/blob/${SHA}/docs/qa/build-F2.md`, external: true }} />);
  expectCovered(linkOut(/docs\/qa\/build-F2\.md/));
});

test("SEC-1 · PageHeader's id link to GitHub sets no referrerpolicy weaker than the document's no-referrer", () => {
  render(<PageHeader title="Commit" ids={[{ label: 'SHA', value: SHA.slice(0, 7), href: `${REPO}/commit/${SHA}` }]} />);
  expectCovered(linkOut(SHA.slice(0, 7)));
});

test("SEC-1 · RuleEvidence's QA step link sets no referrerpolicy weaker than the document's no-referrer", () => {
  render(<RuleEvidence ruleId="SELL-1" commits={[]} qa={{ ref: 'docs/qa/build-F1.md#1', href: `${REPO}/blob/${SHA}/docs/qa/build-F1.md#1`, result: 'pass' }} />);
  expectCovered(linkOut('docs/qa/build-F1.md#1'));
});

test("SEC-1 · RuleEvidence's PR link sets no referrerpolicy weaker than the document's no-referrer", () => {
  render(<RuleEvidence ruleId="SELL-1" commits={[]} pr={{ number: 10, href: `${REPO}/pull/10`, state: 'merged' }} />);
  expectCovered(linkOut('PR #10'));
});
