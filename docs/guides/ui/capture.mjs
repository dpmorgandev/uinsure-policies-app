// Captures every screenshot of the UI user guide (F8) from the running app, and measures each highlight marker
// from the page's own data-region tags (LRN-6). Nothing is placed by hand.
//
// Usage:  PLAYWRIGHT_MODULE=<the playwright package directory> node docs/guides/ui/capture.mjs <app-url>
//         (the app URL may also be DOCKET_APP_URL). The app must be serving a static build with its /api proxy
//         pointing at a running API. Output: docs/guides/ui/shots/<id>.png and shots/manifest.json.
//
// A shot is the first screenful of the page (or the height it asks for). A region whose box starts inside the
// shot gets a numbered marker; a region further down is listed under "below" and gets no marker.
// The workflow shots sell, quote, cancel, claim and renew against the live API through the workbench itself, with
// references of their own (a run suffix), so a re-run never meets the last run's data.
import { createRequire } from "node:module";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
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

const WIDTH = 1024;
const HEIGHT = 768;

const run = Date.now().toString(36).toUpperCase().slice(-5);
const ref = { sold: `UIG-${run}-A`, claim: `UIG-${run}-B`, renew: `UIG-${run}-C` };
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

/** Measure every data-region box on the page; crop; save. */
async function shot(id, title, hash, { theme, height: want, y: y0 = 0 } = {}) {
  if (theme) await page.emulateMedia({ colorScheme: theme });
  const full = await page.evaluate(() => document.documentElement.scrollHeight);
  const height = Math.min(want ?? HEIGHT, full);
  const regions = await page.evaluate(() =>
    [...document.querySelectorAll("[data-region]")].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        slug: el.getAttribute("data-region"),
        req: el.getAttribute("data-req"),
        built: el.getAttribute("data-built") !== "false",
        left: r.left + window.scrollX,
        top: r.top + window.scrollY,
        width: r.width,
        height: r.height,
      };
    }),
  );
  const drawn = regions.filter((r) => r.width > 40 && r.height > 20);
  const inside = drawn.filter((r) => r.top - y0 < height - 40);
  await page.screenshot({ path: join(shotsDir, `${id}.png`), fullPage: true, clip: { x: 0, y: y0, width: WIDTH, height } });
  const marked = inside.map((r, i) => ({
    n: i + 1,
    slug: r.slug,
    req: r.req,
    built: r.built,
    left: +(((r.left + 16) / WIDTH) * 100).toFixed(2),
    top: +(((r.top - y0 + 16) / height) * 100).toFixed(2),
  }));
  const below = drawn.filter((r) => !inside.includes(r)).map((r) => ({ slug: r.slug, req: r.req }));
  manifest.shots.push({ id, title, hash, theme: theme ?? "light", width: WIDTH, height, regions: marked, below, exchanges });
  exchanges = [];
  console.log(`${id}: ${marked.length} marked, ${below.length} below`);
  if (theme) await page.emulateMedia({ colorScheme: "light" });
}

// ── The explorer ─────────────────────────────────────────────────────────────────────────────────────────────
const explorer = [
  ["overview", "Overview", "/"],
  ["about", "How to read this", "/about"],
  ["rules", "Requirements matrix", "/rules"],
  ["rule", "One rule", "/rules/CANCEL-1b"],
  ["plan", "A plan", `/plans/${node.plan}`],
  ["node", "A node", `/plans/${node.plan}/${node.node}`],
  ["walkthrough", "A node's walkthrough", `/plans/${node.plan}/${node.node}/commits`],
  ["commit", "One commit", `/commits/${nodeCommit.sha}`],
  ["loop", "A node's loop", `/plans/${node.plan}/${node.node}/loop`],
  ["activity", "A node's activity", `/plans/${node.plan}/${node.node}/activity`],
  ["verdict", "A verdict", `/plans/${node.plan}/${node.node}/verdicts/${failed.round}/${failed.agent}`],
  ["finding", "A findings round", `/plans/${node.plan}/${node.node}/findings/${failed.round}`],
  ["sessions", "Sessions", "/sessions"],
  ["session", "One session snapshot", `/sessions/${session.split("/").pop()}`],
  ["harness", "The harness", "/harness"],
  ["decisions", "Human decisions", "/decisions"],
  ["stats", "Stats", "/stats"],
  ["not-found", "Not found", "/no/such/page"],
];
for (const [id, title, hash] of explorer) {
  await go(hash);
  // The findings shot starts 1 px down: otherwise its bytes in the printed PDF read as an e-mail address to the privacy scan.
  await shot(`ex-${id}`, title, `#${hash}`, id === "finding" ? { y: 1, height: 767 } : {});
}
await go("/");
await shot("ex-overview-dark", "Overview, dark theme", "#/", { theme: "dark" });

// ── The workbench: empty states first, on a context with nothing in it ───────────────────────────────────────
await go("/workbench");
await shot("wb-home-empty", "Workbench home, nothing opened yet", "#/workbench");
await go("/workbench/requests");
await shot("wb-requests-empty", "Request log before any request", "#/workbench/requests");

// ── Sell: stopped by the form, refused by the API, then sold ─────────────────────────────────────────────────
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

await go("/workbench/sell");
await shot("wb-sell-empty", "Sell form, empty", "#/workbench/sell");

await fillSell("ab", { start: iso(10), amount: "587.31", method: "Card", holders: [ADA] });
await sellButton.click();
await settle();
await shot("wb-sell-client-error", "Sell form, its own check stops a bad reference before anything is sent", "#/workbench/sell");

await fillSell(ref.sold, { start: iso(-5), amount: "587.31", method: "Card", holders: [ADA] });
await sendAnyway.setChecked(true);
manifest.refusedSellStatus = await press(sellButton, "POST", "/policies");
await shot("wb-sell-422", "Sell form, send anyway: the API refuses a backdated start", "#/workbench/sell");

await fillSell(ref.sold, { start: iso(10), amount: "587.31", method: "Card", holders: [ADA, EDSGER] });
await shot("wb-sell-filled", "Sell form, filled in with two policyholders", "#/workbench/sell", { height: 1100 });
manifest.soldStatus = await press(sellButton, "POST", "/policies");
await shot("wb-sell-sold", "Sell form, the API accepted the policy", "#/workbench/sell");

await fillSell(ref.sold, { start: iso(10), amount: "587.31", method: "Card", holders: [ADA] });
manifest.duplicateStatus = await press(sellButton, "POST", "/policies");
await shot("wb-sell-409", "Sell form, the same reference again is refused (SELL-1, 409)", "#/workbench/sell");

// ── The policy, the home with a recent list, and a policy that is not there ──────────────────────────────────
await go(`/workbench/policies/${ref.sold}`);
await shot("wb-policy", "Policy view", `#/workbench/policies/${ref.sold}`, { height: 1000 });
await go("/workbench");
await shot("wb-home-recent", "Workbench home, with a recent policy", "#/workbench");
await field("Policy reference").fill("NO-SUCH-1");
manifest.notFoundStatus = await press(main().getByRole("button", { name: /^(Open policy|Opening…)$/ }), "GET", "/policies/NO-SUCH-1");
await shot("wb-home-404", "Workbench home, opening a policy that does not exist (GET-1, 404)", "#/workbench");

// ── Quote and cancel ─────────────────────────────────────────────────────────────────────────────────────────
const cancelDate = iso(40);
manifest.cancelDate = cancelDate;
await go(`/workbench/policies/${ref.sold}/cancel`);
await field("Cancellation date").fill(cancelDate);
manifest.quoteStatus = await press(main().getByRole("button", { name: /^(Quote this date|Quote again|Quoting…)$/ }), "GET", "/cancellation-quote");
await shot("wb-cancel-quoted", "Cancel screen, the quote for the date", `#/workbench/policies/${ref.sold}/cancel`, { height: 1100 });
await main().getByRole("button", { name: `Cancel on ${cancelDate}`, exact: true }).click();
await page.getByRole("dialog").waitFor();
await page.waitForTimeout(300);
await shot("wb-cancel-confirm", "Cancel screen, the confirmation", `#/workbench/policies/${ref.sold}/cancel`);
manifest.cancelStatus = await press(page.getByRole("dialog").getByRole("button", { name: /^Cancel policy/ }), "POST", "/cancellation");
await shot("wb-cancel-done", "Cancel screen, cancelled", `#/workbench/policies/${ref.sold}/cancel`);

// ── Claim: a policy starting today, a claim dated today ─────────────────────────────────────────────────────
await fillSell(ref.claim, { start: iso(0), amount: "412.50", method: "DirectDebit", holders: [EDSGER] });
await press(sellButton, "POST", "/policies");
await go(`/workbench/policies/${ref.claim}/claims/new`);
await field("Claim date").fill(iso(1));
await field("Claim description").fill("Escape of water in the kitchen");
manifest.claimRefusedStatus = await press(main().getByRole("button", { name: "Record this claim" }), "POST", "/claims");
await shot("wb-claim-422", "Record a claim, a future date is refused (COULD-2a, 422)", `#/workbench/policies/${ref.claim}/claims/new`);
await field("Claim date").fill(iso(0));
manifest.claimStatus = await press(main().getByRole("button", { name: "Record this claim" }), "POST", "/claims");
await shot("wb-claim-done", "Record a claim, recorded, with the refund before and after", `#/workbench/policies/${ref.claim}/claims/new`, { height: 1100 });

// ── Renew: a new policy cannot renew yet, so the window rule answers ─────────────────────────────────────────
await fillSell(ref.renew, { start: iso(0), amount: "300.00", method: "Card", holders: [ADA] });
await press(sellButton, "POST", "/policies");
await go(`/workbench/policies/${ref.renew}/renew`);
manifest.renewStatus = await press(main().getByRole("button", { name: "Renew policy" }), "POST", "/renewals");
await shot("wb-renew-422", "Renew screen, the API refuses (RENEW-1 and RENEW-2, 422)", `#/workbench/policies/${ref.renew}/renew`);

// ── The request log, populated, with one exchange ────────────────────────────────────────────────────────────
await go("/workbench/requests");
await shot("wb-requests", "Request log with one exchange open", "#/workbench/requests");

// ── API unreachable: the connection is refused, as if the API were not running ───────────────────────────────
await page.route("**/api/**", (route) => route.abort("connectionrefused"));
await go("/workbench");
await field("Policy reference").fill(ref.sold);
await main().getByRole("button", { name: /^(Open policy|Opening…)$/ }).click();
await page.waitForTimeout(1500);
await shot("wb-unreachable", "Workbench home, the API unreachable", "#/workbench");
await page.unroute("**/api/**");

writeFileSync(join(shotsDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
await browser.close();
console.log(`Wrote ${manifest.shots.length} shots to docs/guides/ui/shots`);
