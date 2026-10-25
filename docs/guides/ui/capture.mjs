// Captures the screenshots of the UI user guide from the running app (feat-001/N1, LRN-6 amended, LRN-12, LRN-13).
//
// Usage:  PLAYWRIGHT_MODULE=<the playwright package directory> node docs/guides/ui/capture.mjs <app-url>
//         (the app URL may also be DOCKET_APP_URL; PLAYWRIGHT_MODULE defaults to the web project's own install).
//         The app must be serving a static build with its /api proxy pointing at a running API.
//         Output: docs/guides/ui/shots/<id>.png and shots/manifest.json.
//
// One shot frames what a journey step gives the user: the result at the end of the page, the response panel, the
// plan picture. A shot that serves a step's actions carries red boxes. Each box is the measured rectangle of an
// element the step drives from: a [data-region] tag, or the control inside a region that the step names. Where the
// shell has no region tag (the header, the confirmation dialog) the element is found by its accessible name and the
// manifest records the nearest tagged ancestor, if any. No box is ever placed by hand; a target that is not on the
// page stops the run.
//
// Manifest (shots/manifest.json), per shot:
//   id, step (the journey step id, e.g. SJ2), title, hash, theme, width, height, scrollY,
//   boxes:   [{ n, label: "Step n", target, region, left, top, width, height, labelLeft, labelTop }]  (labelTop is above the box, or below it at the top edge; labelLeft puts the label over the box's right end)
//            n numbers the boxes within the figure, in the order of the steps beneath it; every value is a percentage
//            of the image (left and width of its width; top and height of its height).
//   regions: the data-region tags visible in the shot, with their data-req rule ids
//   exchanges: the API calls made while the shot was prepared
// The workflow shots sell, quote, cancel, claim and renew run against the live API through the workbench itself, with
// references of their own (a run suffix), so a re-run never meets the last run's data.
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..", "..");
const shotsDir = join(here, "shots");
const app = (process.argv[2] ?? process.env.DOCKET_APP_URL ?? "").replace(/\/$/, "");
if (!app) {
  console.error("Usage: PLAYWRIGHT_MODULE=<playwright dir> node docs/guides/ui/capture.mjs <app-url>");
  process.exit(2);
}
const candidates = [
  process.env.PLAYWRIGHT_MODULE && resolve(process.env.PLAYWRIGHT_MODULE),
  join(root, "src/Uinsure.Policies.Web/node_modules/playwright"),
].filter(Boolean);
const found = candidates.find((dir) => existsSync(join(dir, "package.json")));
if (!found) {
  console.error("Playwright not found. Set PLAYWRIGHT_MODULE.");
  process.exit(2);
}
const { chromium } = createRequire(join(found, "package.json"))(found);
mkdirSync(shotsDir, { recursive: true });
// Replace stale shots: this run writes every shot the guide uses, and nothing else is kept.
for (const f of readdirSync(shotsDir)) if (f.endsWith(".png") || f === "manifest.json") rmSync(join(shotsDir, f));

const WIDTH = 1024;
const HEIGHT = 768;
const PAGE_CAP = 2400; // height: "page" shows the whole page up to this, else its last screenful of that height
const LABEL_PX = 24; // the height the "Step n" label takes above or below its box
const LABEL_W_PX = 58; // the width the "Step n" label takes
const PAD = 4; // a box sits this far outside its element so the outline never covers the text

const run = Date.now().toString(36).toUpperCase().slice(-5);
const ref = { sold: `UIG-${run}-A`, claim: `UIG-${run}-B`, renew: `UIG-${run}-C`, late: `UIG-${run}-D` };
const iso = (days) => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days)).toISOString().slice(0, 10);
};

const trace = await (await fetch(`${app}/trace.json`)).json();
const node = { plan: "build", node: "F1" };
const nodeCommit = trace.commits.find((c) => c.plan === node.plan && c.node === node.node && c.tdd === "green" && c.rule.includes("SELL-2"));
const failed = trace.verdicts.find((v) => v.plan === node.plan && v.node === node.node && v.verdict === "FAIL");
const session = trace.sessions[5].file;
const manifest = {
  viewport: { width: WIDTH, height: HEIGHT },
  run,
  refs: ref,
  trace: { ...node, commit: nodeCommit.short, round: failed.round, agent: failed.agent, session },
  shots: [],
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, colorScheme: "light" });
const page = await context.newPage();
let exchanges = [];
page.on("response", (r) => {
  const u = new URL(r.url());
  if (u.pathname.startsWith("/api/")) exchanges.push({ method: r.request().method(), path: u.pathname.slice(4), status: r.status() });
});

const settle = async () => {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
};
const go = async (hash) => {
  if (!page.url().startsWith(app)) await page.goto(`${app}/#${hash}`);
  else await page.evaluate((h) => { location.hash = h; }, hash);
  await settle();
};
const main = () => page.getByRole("main");
const field = (label) => main().getByLabel(label, { exact: true });
const press = async (button, method, pathPart) => {
  const answer = page.waitForResponse((r) => r.request().method() === method && new URL(r.url()).pathname.includes(pathPart), { timeout: 20000 });
  await button.click();
  const response = await answer;
  await settle();
  return response.status();
};

// Box targets. R(slug) is the region itself; R(slug, inner) is the element inside it that the step names; Q(fn) is
// an element with no region tag, found by its accessible name.
const R = (slug, inner) => ({ region: slug, inner });
const Q = (name, locate) => ({ name, locate });
const regionLoc = (slug) => page.locator(`[data-region^="${slug}"]`).first();
const locatorOf = (t) => (t.locate ? t.locate() : t.inner ? t.inner(regionLoc(t.region)) : regionLoc(t.region));
const targetName = (t) => (t.locate ? t.name : t.inner ? `${t.region} > ${t.name ?? "inner"}` : t.region);
const inRegion = (slug, inner, name) => ({ region: slug, inner, name });

/**
 * Frame one outcome. at: "top" | "end" | { y } | { to: () => Locator, pad }.
 * height: a number of px, or "page" for the whole page up to PAGE_CAP.
 */
async function shot({ id, step, title, hash, at = "top", height: want = HEIGHT, theme, boxes = [] }) {
  if (theme) await page.emulateMedia({ colorScheme: theme });
  await page.setViewportSize({ width: WIDTH, height: HEIGHT });
  const full = await page.evaluate(() => document.documentElement.scrollHeight);
  const wanted = want === "page" ? Math.min(full, PAGE_CAP) : want;
  const height = Math.min(wanted, full);
  await page.setViewportSize({ width: WIDTH, height });
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  let y = 0;
  if (at === "end" || (want === "page" && full > PAGE_CAP && at === "top")) y = Math.max(0, total - height);
  else if (at.y !== undefined) y = at.y;
  else if (at.to) {
    const top = await at.to().evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    y = Math.max(0, Math.min(total - height, Math.round(top - (at.pad ?? 120))));
  }
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(250);

  const measured = [];
  for (const [i, t] of boxes.entries()) {
    const loc = locatorOf(t);
    if ((await loc.count()) === 0) throw new Error(`${id}: box target not on the page: ${targetName(t)}`);
    const m = await loc.first().evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height, region: el.closest("[data-region]")?.getAttribute("data-region") ?? null };
    });
    if (m.width < 2 || m.height < 2) throw new Error(`${id}: box target has no size: ${targetName(t)}`);
    const left = Math.max(0, m.left - PAD);
    const top = m.top - PAD;
    const right = Math.min(WIDTH, m.left + m.width + PAD);
    const bottom = m.top + m.height + PAD;
    if (top < 0 || bottom > height) throw new Error(`${id}: box target is outside the frame (${Math.round(top)}..${Math.round(bottom)} of ${height}): ${targetName(t)}`);
    const above = top >= LABEL_PX + 2;
    const labelTop = above ? top - LABEL_PX : bottom + 2;
    measured.push({
      n: i + 1,
      label: `Step ${i + 1}`,
      target: targetName(t),
      region: m.region,
      left: pct(left, WIDTH),
      top: pct(top, height),
      width: pct(right - left, WIDTH),
      height: pct(bottom - top, height),
      // The label sits over the box's right end, so it covers a field's own caption as little as it can.
      labelLeft: pct(Math.max(left, right - LABEL_W_PX), WIDTH),
      labelTop: pct(labelTop, height),
    });
  }
  const regions = await page.evaluate(
    ({ h }) =>
      [...document.querySelectorAll("[data-region]")]
        .map((el) => ({ slug: el.getAttribute("data-region"), req: el.getAttribute("data-req"), r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 40 && r.height > 20 && r.top < h - 40 && r.bottom > 40)
        .map(({ slug, req }) => ({ slug, req })),
    { h: height },
  );
  await page.screenshot({ path: join(shotsDir, `${id}.png`) });
  manifest.shots.push({ id, step, title, hash, theme: theme ?? "light", width: WIDTH, height, scrollY: y, boxes: measured, regions, exchanges });
  exchanges = [];
  console.log(`${id}: ${measured.length} boxes, ${regions.length} regions in view`);
  if (theme) await page.emulateMedia({ colorScheme: "light" });
}
const pct = (v, of) => +((v / of) * 100).toFixed(2);

const header = () => page.getByRole("banner");
const themeToggle = () => header().getByRole("radiogroup");
const themeRadio = (name) => themeToggle().getByRole("radio", { name, exact: true });

// ── SJ1: open the workbench ──────────────────────────────────────────────────────────────────────────────────
await go("/workbench");
await shot({
  id: "sj1-home", step: "SJ1", title: "Workbench home: open a policy by reference, with the request status under it", hash: "#/workbench", height: 900,
  boxes: [inRegion("open-a-policy-by-reference", (r) => r.getByLabel("Policy reference", { exact: true }), "Policy reference"), inRegion("open-a-policy-by-reference", (r) => r.getByRole("button", { name: "Open policy" }), "Open policy button")],
});

// ── SJ7, SJ8: the empty states come first, on a context with nothing in it ──────────────────────────────────
await go("/workbench/requests");
await shot({ id: "sj8-empty-log", step: "SJ8", title: "Request log before any request: an empty state", hash: "#/workbench/requests", boxes: [R("request-log")] });

// ── SJ2: sell. Stopped by the form, refused by the API, then sold ────────────────────────────────────────────
const sendAnyway = main().getByRole("switch", { name: "Send anyway" });
const sellButton = main().getByRole("button", { name: /^(Sell this policy|Selling…)$/ });
async function fillSell(reference, { start, amount, method, holders, auto = true }) {
  await go("/workbench/sell");
  await field("Policy reference").fill(reference);
  await main().getByRole("radio", { name: "Household", exact: true }).check();
  await field("Start date").fill(start);
  await field("Amount").fill(amount);
  await field("Payment method").selectOption(method);
  await main().getByRole("switch", { name: "Auto-renew" }).setChecked(auto);
  for (let n = 1; n < holders.length; n += 1) await main().getByRole("button", { name: "Add another policyholder" }).click();
  for (const [i, h] of holders.entries()) {
    const group = main().getByRole("group", { name: `Policyholder ${i + 1}`, exact: true });
    await group.getByLabel("First name", { exact: true }).fill(h[0]);
    await group.getByLabel("Last name", { exact: true }).fill(h[1]);
    await group.getByLabel(/^Date of birth/).fill(h[2]);
  }
  await field("Address line 1").fill("12 Mill Lane");
  await field("Address line 2").fill("Floor 2");
  await field("Address line 3").fill("Castlefield");
  await field("Postcode").fill("M15 4PS");
}
const ADA = ["Ada", "Lovelace", "1985-12-10"];
const EDSGER = ["Edsger", "Dijkstra", "1979-05-11"];
const fieldsRegion = "policy-fields-";

await fillSell(ref.sold, { start: iso(10), amount: "587.31", method: "Card", holders: [ADA, EDSGER] });
await shot({
  id: "sj2-form", step: "SJ2", title: "Sell form, filled in", hash: "#/workbench/sell", height: 1250,
  boxes: [
    inRegion(fieldsRegion, (r) => r.getByLabel("Policy reference", { exact: true }), "Policy reference"),
    inRegion(fieldsRegion, (r) => r.getByLabel("Start date", { exact: true }), "Start date"),
    inRegion(fieldsRegion, (r) => r.getByLabel("Amount", { exact: true }), "Amount"),
  ],
});
await shot({
  id: "sj2-people", step: "SJ2", title: "Sell form, two policyholders", hash: "#/workbench/sell", at: { to: () => regionLoc("policyholders-1-to-3"), pad: 24 }, height: 900,
  boxes: [
    inRegion("policyholders-1-to-3", (r) => r.getByRole("group", { name: "Policyholder 1", exact: true }), "Policyholder 1"),
    inRegion("policyholders-1-to-3", (r) => r.getByRole("group", { name: "Policyholder 2", exact: true }), "Policyholder 2"),
  ],
});
await shot({ id: "sj2-submit", step: "SJ2", title: "Sell form, ready to send", hash: "#/workbench/sell", at: "end", height: 420, boxes: [inRegion("submit-busy", (r) => r.getByRole("button", { name: /^Sell this policy/ }), "Sell this policy")] });
manifest.soldStatus = await press(sellButton, "POST", "/policies");
await shot({ id: "sj2-sent", step: "SJ2", title: "Sell form, the API accepted the policy: the request as sent and the 201", hash: "#/workbench/sell", at: "end", height: 900 });

await fillSell("ab", { start: iso(10), amount: "587.31", method: "Card", holders: [ADA] });
await sellButton.click();
await settle();
await shot({
  id: "sj2-client-error", step: "SJ2", title: "Sell form, its own check stops a bad reference before anything is sent", hash: "#/workbench/sell", height: 900,
  boxes: [inRegion(fieldsRegion, (r) => r.getByLabel("Policy reference", { exact: true }), "Policy reference")],
});

await fillSell(ref.sold, { start: iso(10), amount: "587.31", method: "Card", holders: [ADA] });
manifest.duplicateStatus = await press(sellButton, "POST", "/policies");
await shot({ id: "sj2-conflict", step: "SJ2", title: "Sell form, the same reference again is refused (SELL-1, 409)", hash: "#/workbench/sell", height: 700, boxes: [R("error-summary")] });

// SJ8: send anyway, the API refuses a backdated start
await fillSell(ref.late, { start: iso(-5), amount: "587.31", method: "Card", holders: [ADA] });
await sendAnyway.setChecked(true);
await shot({
  id: "sj8-send-anyway", step: "SJ8", title: "Sell form, Send anyway on, ready to send a backdated start", hash: "#/workbench/sell", at: { to: () => regionLoc("send-it-anyway"), pad: 60 }, height: 420,
  boxes: [R("send-it-anyway"), inRegion("submit-busy", (r) => r.getByRole("button", { name: /^Sell this policy/ }), "Sell this policy")],
});
manifest.refusedSellStatus = await press(sellButton, "POST", "/policies");
await shot({ id: "sj8-problem", step: "SJ8", title: "The API refuses a backdated start (SELL-2, 422): status, rule id, each violation", hash: "#/workbench/sell", height: 900 });

// ── SJ3: read the policy ─────────────────────────────────────────────────────────────────────────────────────
await go("/workbench");
await field("Policy reference").fill(ref.sold);
await press(main().getByRole("button", { name: /^(Open policy|Opening…)$/ }), "GET", `/policies/${ref.sold}`);
await shot({
  id: "sj3-policy", step: "SJ3", title: "Policy view: status, current term and payments, then the actions", hash: `#/workbench/policies/${ref.sold}`, height: 1100,
  boxes: [R("status-and-current-term")],
});
await shot({
  id: "sj3-policy-end", step: "SJ3", title: "Policy view, down to its last section: the requests that touched this policy", hash: `#/workbench/policies/${ref.sold}`, at: "end", height: 900,
  boxes: [R("actions-quote-and-cancel"), R("requests-that-touched-this-policy")],
});
await go("/workbench");
await shot({
  id: "sj3-recent", step: "SJ3", title: "Workbench home, with a recent policy to open again", hash: "#/workbench", at: { to: () => regionLoc("recent-policies-kept-in-this-browser"), pad: 100 }, height: 440,
  boxes: [R("recent-policies-kept-in-this-browser", (r) => r.getByRole("link", { name: ref.sold }).first())],
});

// ── SJ8: a policy that is not there (GET-1, 404) ─────────────────────────────────────────────────────────────
await field("Policy reference").fill("NO-SUCH-1");
manifest.notFoundStatus = await press(main().getByRole("button", { name: /^(Open policy|Opening…)$/ }), "GET", "/policies/NO-SUCH-1");
await shot({
  id: "sj8-404", step: "SJ8", title: "Workbench home, opening a policy that does not exist (GET-1, 404)", hash: "#/workbench", height: 900,
  boxes: [inRegion("open-a-policy-by-reference", (r) => r.getByLabel("Policy reference", { exact: true }), "Policy reference")],
});

// ── SJ4: quote and cancel ────────────────────────────────────────────────────────────────────────────────────
const cancelDate = iso(40);
manifest.cancelDate = cancelDate;
await go(`/workbench/policies/${ref.sold}/cancel`);
await field("Cancellation date").fill(cancelDate);
manifest.quoteStatus = await press(main().getByRole("button", { name: /^(Quote this date|Quote again|Quoting…)$/ }), "GET", "/cancellation-quote");
await shot({
  id: "sj4-quote", step: "SJ4", title: "Cancel screen, the quote for the date: the refund per term and the rule behind it", hash: `#/workbench/policies/${ref.sold}/cancel`, height: 1400,
  boxes: [
    inRegion("cancellation-date-and-quote", (r) => r.getByLabel("Cancellation date", { exact: true }), "Cancellation date"),
    inRegion("quote-and-cancel-actions", (r) => r.getByRole("button", { name: /^(Quote this date|Quote again)$/ }), "Quote button"),
  ],
});
await main().getByRole("button", { name: `Cancel on ${cancelDate}`, exact: true }).click();
await page.getByRole("dialog").waitFor();
await page.waitForTimeout(300);
await shot({
  id: "sj4-confirm", step: "SJ4", title: "Cancel screen, the confirmation dialog", hash: `#/workbench/policies/${ref.sold}/cancel`,
  boxes: [Q("Cancel policy button in the dialog", () => page.getByRole("dialog").getByRole("button", { name: /^Cancel policy/ }))],
});
manifest.cancelStatus = await press(page.getByRole("dialog").getByRole("button", { name: /^Cancel policy/ }), "POST", "/cancellation");
await shot({ id: "sj4-done", step: "SJ4", title: "Cancel screen, cancelled: the status and the refund", hash: `#/workbench/policies/${ref.sold}/cancel`, height: 900 });
await shot({ id: "sj4-compare", step: "SJ4", title: "Cancel screen, the end of the page: the quote and the cancellation compared, field by field", hash: `#/workbench/policies/${ref.sold}/cancel`, at: "end", height: 900 });

// ── SJ5: claim. A policy starting today, a claim dated tomorrow, then today ──────────────────────────────────
await fillSell(ref.claim, { start: iso(0), amount: "412.50", method: "DirectDebit", holders: [EDSGER] });
await press(sellButton, "POST", "/policies");
await go(`/workbench/policies/${ref.claim}/claims/new`);
await field("Claim date").fill(iso(1));
await field("Claim description").fill("Escape of water in the kitchen");
await shot({
  id: "sj5-form", step: "SJ5", title: "Record a claim, filled in", hash: `#/workbench/policies/${ref.claim}/claims/new`, height: 900,
  boxes: [
    inRegion("claim-date-and-description", (r) => r.getByLabel("Claim date", { exact: true }), "Claim date"),
    inRegion("claim-date-and-description", (r) => r.getByLabel("Claim description", { exact: true }), "Claim description"),
  ],
});
await shot({
  id: "sj5-submit", step: "SJ5", title: "Record a claim, ready to send", hash: `#/workbench/policies/${ref.claim}/claims/new`, at: { to: () => regionLoc("record-claim-busy"), pad: 120 }, height: 400,
  boxes: [inRegion("record-claim-busy", (r) => r.getByRole("button", { name: "Record this claim" }), "Record this claim")],
});
manifest.claimRefusedStatus = await press(main().getByRole("button", { name: "Record this claim" }), "POST", "/claims");
await shot({
  id: "sj5-refused", step: "SJ5", title: "Record a claim, a future date is refused (COULD-2a, 422)", hash: `#/workbench/policies/${ref.claim}/claims/new`,
  at: { to: () => regionLoc("problems-could-2a"), pad: 120 }, height: 600, boxes: [R("problems-could-2a")],
});
await field("Claim date").fill(iso(0));
manifest.claimStatus = await press(main().getByRole("button", { name: "Record this claim" }), "POST", "/claims");
await shot({ id: "sj5-done", step: "SJ5", title: "Record a claim, recorded: the refund before and after", hash: `#/workbench/policies/${ref.claim}/claims/new`, at: { to: () => regionLoc("refund-before-and-after"), pad: 40 }, height: 800 });

// ── SJ6: renew. A new policy cannot renew yet, so the window rule answers ────────────────────────────────────
await fillSell(ref.renew, { start: iso(0), amount: "300.00", method: "Card", holders: [ADA] });
await press(sellButton, "POST", "/policies");
await go(`/workbench/policies/${ref.renew}/renew`);
await shot({
  id: "sj6-form", step: "SJ6", title: "Renew screen, before pressing Renew policy", hash: `#/workbench/policies/${ref.renew}/renew`,
  at: { to: () => main().getByRole("button", { name: "Renew policy" }), pad: 300 }, height: 500,
  boxes: [Q("Renew policy button", () => main().getByRole("button", { name: "Renew policy" }))],
});
manifest.renewStatus = await press(main().getByRole("button", { name: "Renew policy" }), "POST", "/renewals");
await shot({ id: "sj6-refused", step: "SJ6", title: "Renew screen, the API refuses (RENEW-1 and RENEW-2, 422) and gives the window", hash: `#/workbench/policies/${ref.renew}/renew`, at: { to: () => regionLoc("problems-renew"), pad: 100 }, height: 700 });

// ── SJ7: the request log, populated, with one exchange ───────────────────────────────────────────────────────
await go("/workbench/requests");
await shot({
  id: "sj7-log", step: "SJ7", title: "Request log, newest first: the exchange to open", hash: "#/workbench/requests", height: 1100,
  boxes: [R("request-log", (r) => r.getByRole("button", { name: /^Open request #/ }).first(), "first exchange")],
});
await main().getByRole("button", { name: /^Open request #/ }).first().click();
await settle();
await shot({
  id: "sj7-exchange", step: "SJ7", title: "One exchange open: request, response, status line and the curl to repeat it", hash: "#/workbench/requests",
  at: { to: () => regionLoc("one-exchange"), pad: 40 }, height: 900,
});

// ── SJ8: API unreachable. The connection is refused, as if the API were not running ──────────────────────────
await page.route("**/api/**", (route) => route.abort("connectionrefused"));
await go("/workbench");
await field("Policy reference").fill(ref.sold);
await main().getByRole("button", { name: /^(Open policy|Opening…)$/ }).click();
await page.waitForTimeout(1500);
await shot({
  id: "sj8-unreachable", step: "SJ8", title: "Workbench home, the API unreachable: the page says no request was completed", hash: "#/workbench", at: { to: () => regionLoc("open-by-reference-busy"), pad: 60 }, height: 520,
  boxes: [R("open-by-reference-busy", (r) => r.getByRole("button", { name: "Try again" }).first(), "Try again")],
});
await page.unroute("**/api/**");

// ── SJ8: a page that does not exist ──────────────────────────────────────────────────────────────────────────
await go("/no/such/page");
await shot({
  id: "sj8-not-found", step: "SJ8", title: "Not found: nothing is guessed, and there is a way home", hash: "#/no/such/page", height: 700,
  boxes: [Q("Go to the requirements matrix link", () => main().getByRole("link", { name: "Go to the requirements matrix" }))],
});

// ── SJ9: themes, with the header toggle ──────────────────────────────────────────────────────────────────────
await go("/");
await shot({ id: "sj9-light", step: "SJ9", title: "Overview, light theme", hash: "#/", height: 700, boxes: [Q("Theme toggle", themeToggle)] });
await themeRadio("Dark").check();
await page.waitForTimeout(300);
await shot({ id: "sj9-dark", step: "SJ9", title: "Overview, dark theme", hash: "#/", height: 700, boxes: [Q("Theme toggle", themeToggle)] });
await themeRadio("System").check();

// ── AJ1: what Docket is ──────────────────────────────────────────────────────────────────────────────────────
await go("/");
await shot({
  id: "aj1-overview", step: "AJ1", title: "Overview: the answer and the counts", hash: "#/", height: 1620,
  boxes: [R("headline-answer"), R("receipt-figures")],
});
await go("/about");
await shot({ id: "aj1-about", step: "AJ1", title: "How to read this: the labels, the glossary, re-verify with git", hash: "#/about", height: 1000, boxes: [R("provenance-labels")] });

// ── AJ2: is every rule evidenced? ────────────────────────────────────────────────────────────────────────────
await go("/rules");
await shot({
  id: "aj2-matrix", step: "AJ2", title: "Requirements matrix: filters, then the table of rules against requirement, tests and commits", hash: "#/rules", height: 1000,
  boxes: [R("filters-status-feature"), R("matrix-table", (r) => r.getByRole("row").nth(1), "first rule row")],
});
await shot({ id: "aj2-matrix-end", step: "AJ2", title: "Requirements matrix, to its last row and the scope note", hash: "#/rules", at: "end", height: 900 });

// ── AJ3: follow one rule ─────────────────────────────────────────────────────────────────────────────────────
await shot({
  id: "aj3-matrix-link", step: "AJ3", title: "Requirements matrix, the CANCEL-1b row", hash: "#/rules", height: 560,
  at: { to: () => main().getByRole("link", { name: "CANCEL-1b", exact: true }).first(), pad: 160 },
  boxes: [Q("CANCEL-1b link", () => main().getByRole("link", { name: "CANCEL-1b", exact: true }).first())],
});
await go("/rules/CANCEL-1b");
await shot({
  id: "aj3-rule", step: "AJ3", title: "One rule: the requirement and its interpretation, then red before green", hash: "#/rules/CANCEL-1b", height: 1620,
  boxes: [R("rule-text-and-agreed-interpretation"), R("signature-red-before-green")],
});
await shot({ id: "aj3-rule-end", step: "AJ3", title: "One rule, the end of the page: verify it yourself, and the links out", hash: "#/rules/CANCEL-1b", at: "end", height: 700, boxes: [R("verify-it-yourself")] });
await go(`/commits/${nodeCommit.sha}`);
await shot({
  id: "aj3-commit", step: "AJ3", title: "One commit: header and trailers, the agent, the diff, the links out", hash: `#/commits/${nodeCommit.sha}`, height: "page",
  boxes: [R("commit-header-and-trailers"), R("trailer-agent-vs-hook-agent")],
});

// ── AJ4: was it built test-first? ────────────────────────────────────────────────────────────────────────────
await go(`/plans/${node.plan}`);
await shot({
  id: "aj4-plan", step: "AJ4", title: "A plan: the picture of its nodes", hash: `#/plans/${node.plan}`, height: 1100,
  boxes: [R("plan-header-status-approval-requirements-rev"), R("node-graph-and-its-table", (r) => r.getByRole("link", { name: /\bF1\b/ }).first(), "node F1")],
});
await go(`/plans/${node.plan}/${node.node}`);
await shot({
  id: "aj4-node", step: "AJ4", title: "A node: the rules it covers, its tasks and its attempts", hash: `#/plans/${node.plan}/${node.node}`, height: 1240,
  boxes: [R("completeness-banner"), R("rules")],
});
await go(`/plans/${node.plan}/${node.node}/commits`);
await shot({
  id: "aj4-walkthrough", step: "AJ4", title: "A node's walkthrough: the commits in order", hash: `#/plans/${node.plan}/${node.node}/commits`, height: 900,
  boxes: [R("commit-sequence", (r) => r.getByRole("row").filter({ hasText: "red" }).first().getByRole("link").first(), "first red commit")],
});
await shot({ id: "aj4-walkthrough-end", step: "AJ4", title: "A node's walkthrough, the end: the green commits", hash: `#/plans/${node.plan}/${node.node}/commits`, at: "end", height: 900 });
await go(`/plans/${node.plan}/${node.node}/loop`);
await shot({
  id: "aj4-loop", step: "AJ4", title: "A node's loop: attempt by attempt", hash: `#/plans/${node.plan}/${node.node}/loop`, height: 900,
  boxes: [R("attempt-ladder", (r) => r.getByRole("heading", { name: "Attempt 1" }), "Attempt 1")],
});
await go(`/plans/${node.plan}/${node.node}/activity`);
await shot({
  id: "aj4-activity", step: "AJ4", title: "A node's activity: one lane per agent", hash: `#/plans/${node.plan}/${node.node}/activity`, height: 900,
  boxes: [R("agent-lanes", (r) => r.getByLabel("Agent", { exact: true }).first(), "Agent filter")],
});

// ── AJ5: a verdict and its findings ──────────────────────────────────────────────────────────────────────────
const verdictHash = `/plans/${node.plan}/${node.node}/verdicts/${failed.round}/${failed.agent}`;
await go(verdictHash);
await shot({ id: "aj5-verdict", step: "AJ5", title: "A verdict: the summary, then each finding", hash: `#${verdictHash}`, height: 1100, boxes: [R("verdict-summary", (r) => r.getByRole("heading").first(), "verdict heading")] });
await shot({
  id: "aj5-verdict-findings", step: "AJ5", title: "A verdict, its findings", hash: `#${verdictHash}`, height: 900, at: { to: () => regionLoc("findings"), pad: 24 },
  boxes: [R("findings", (r) => r.getByRole("heading").first(), "Findings")],
});
const findingHash = `/plans/${node.plan}/${node.node}/findings/${failed.round}`;
await go(findingHash);
await shot({ id: "aj5-finding", step: "AJ5", title: "A findings round", hash: `#${findingHash}`, height: 900, boxes: [R("findings", (r) => r.getByRole("heading").first(), "Findings")] });
await shot({ id: "aj5-finding-end", step: "AJ5", title: "A findings round, the end: the commit that fixed it", hash: `#${findingHash}`, at: "end", height: 700, boxes: [R("fixed-by")] });

// ── AJ6: the wider story, each screen at its end ─────────────────────────────────────────────────────────────
await go("/sessions");
await shot({ id: "aj6-sessions", step: "AJ6", title: "Sessions, the end: one snapshot open", hash: "#/sessions", at: "end", height: 1000, boxes: [R("one-snapshot-open")] });
await go("/harness");
await shot({ id: "aj6-harness", step: "AJ6", title: "The harness, the end: the hooks and what each guards", hash: "#/harness", at: "end", height: 1000, boxes: [R("hooks")] });
await go("/decisions");
await shot({ id: "aj6-decisions", step: "AJ6", title: "Human decisions, by plan", hash: "#/decisions", height: 900, boxes: [R("decision-list", (r) => r.getByRole("heading").first(), "first plan")] });
await go("/stats");
await shot({ id: "aj6-stats", step: "AJ6", title: "Stats, the end: what is not in the page's data", hash: "#/stats", at: "end", height: 900 });

// ── AJ8: keyboard and themes: the focus ring on the focused element in each theme ────────────────────────────
await go("/rules");
await themeRadio("System").focus();
await shot({ id: "aj8-focus-light", step: "AJ8", title: "Keyboard focus on the theme control, light theme", hash: "#/rules", height: 560, boxes: [Q("The focused element", () => page.locator(":focus"))] });
await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(300);
await shot({ id: "aj8-focus-dark", step: "AJ8", title: "Keyboard focus on the theme control, dark theme", hash: "#/rules", height: 560, boxes: [Q("The focused element", () => page.locator(":focus"))] });
await page.keyboard.press("ArrowRight");

writeFileSync(join(shotsDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
await browser.close();
console.log(`Wrote ${manifest.shots.length} shots to docs/guides/ui/shots`);
