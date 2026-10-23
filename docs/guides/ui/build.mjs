// Builds docs/guides/ui/index.html from the spec (docs/specs/ui-guide.spec.md), the shots manifest and the web app's source.
// Usage: WEB_SRC=<the web project directory> node docs/guides/ui/build.mjs
// WEB_SRC is read only, to copy the real lines of each code extract; it is never written into the guide.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const web = process.env.WEB_SRC;
if (!web) {
  console.error("Set WEB_SRC to the web project directory (src/Uinsure.Policies.Web of a ui checkout).");
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(join(here, "shots", "manifest.json"), "utf8"));
const shots = Object.fromEntries(manifest.shots.map((s) => [s.id, s]));
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const WEBDIR = "src/Uinsure.Policies.Web";
const { refs, trace } = manifest;

// A code extract: the real lines of a file in the web project, with a repo-relative path:line link.
function extract(rel, line, count = 4, base = WEBDIR) {
  const file = base === WEBDIR ? join(web, rel) : null;
  const lines = readFileSync(file, "utf8").replace(/\r\n/g, "\n").split("\n").slice(line - 1, line - 1 + count);
  const path = `${base}/${rel}`;
  return `<div class="extract"><a class="ref" href="../../../${path}#L${line}">${path}:${line}</a><pre>${esc(lines.join("\n"))}</pre></div>`;
}

const chips = (reqs) =>
  [...new Set(reqs.flatMap((r) => (r ?? "").split(/\s+/)).filter(Boolean))].map((r) => `<span class="chip">${esc(r)}</span>`).join(" ");
const humanise = (slug) => {
  const t = slug.replace(/-/g, " ");
  return (t.length > 90 ? `${t.slice(0, 88)}…` : t).replace(/^./, (c) => c.toUpperCase());
};

// A screenshot with markers measured from data-region tags, its key, and the regions below the crop.
function figure(id, caption, width = 460) {
  const s = shots[id];
  const w = width ? ` width="${width}"` : "";
  const markers = s.regions.map((r) => `<span class="marker" style="left: ${r.left}%; top: ${r.top}%">${r.n}</span>`).join("");
  const key = s.regions.map((r) => `<tr><td>${r.n}</td><td>${esc(humanise(r.slug))}</td><td>${chips([r.req])}</td></tr>`).join("");
  const below = s.below.length
    ? `<p class="summary">Below this view: ${s.below.map((r) => esc(humanise(r.slug))).join("; ")}.</p>`
    : "";
  return `<figure><div class="shot"><img src="shots/${id}.png" alt="${esc(s.title)}"${w}>${markers}</div>
<figcaption>${esc(caption ?? s.title)} (${s.theme} theme, ${s.width} px wide, <code>${esc(s.hash)}</code>)</figcaption></figure>
<table><thead><tr><th>#</th><th>Region (its data-region tag)</th><th>Proves</th></tr></thead><tbody>${key}</tbody></table>${below}`;
}

const steps = (items) =>
  `<ol class="steps">${items
    .map(([action, see, out]) => `<li class="step">${action}${out ? `<pre>${esc(out[0])}</pre>` : ""}<div class="see">${see}</div>${out ? `<pre class="output">${esc(out[1])}</pre>` : ""}</li>`)
    .join("")}</ol>`;

const check = (rows) =>
  `<h3>Check your understanding</h3><table class="check"><thead><tr><th>Question</th><th>Answer</th></tr></thead><tbody>${rows
    .map(([q, a]) => `<tr><td>${q}</td><td>${a}</td></tr>`)
    .join("")}</tbody></table>`;

const section = (id, title, headline, summary, body, checks) =>
  `<section id="${id}"><h2>${title}</h2><p class="headline">${headline}</p><p class="summary">${summary}</p><details class="depth" open><summary>In depth</summary>${body}</details>${checks ? check(checks) : ""}</section>`;

const svg = (label, boxes, arrows = true) => {
  const w = 160;
  const items = boxes
    .map((b, i) => {
      const x = 4 + i * (w + 30);
      const arrow = arrows && i < boxes.length - 1 ? `<path d="M${x + w} 35h30" stroke="var(--color-primary)" stroke-width="2"/>` : "";
      return `<rect x="${x}" y="8" width="${w}" height="54" fill="var(--color-accent)" stroke="var(--color-primary)"/><text x="${x + w / 2}" y="30" text-anchor="middle" font-size="11" fill="var(--color-text-primary)">${esc(b[0])}</text><text x="${x + w / 2}" y="48" text-anchor="middle" font-size="9" fill="var(--color-text-secondary)">${esc(b[1])}</text>${arrow}`;
    })
    .join("");
  const total = 4 + boxes.length * (w + 30);
  return `<figure><svg viewBox="0 0 ${total} 70" role="img" aria-label="${esc(label)}">${items}</svg><figcaption>${esc(label)}</figcaption></figure>`;
};

// ── The tour ─────────────────────────────────────────────────────────────────────────────────────────────────
const R = "app/explorer";
const W = "app/workbench";
const explorer = [
  ["overview", "Overview", "#/", `${R}/overview/Overview.tsx`, 134, "Was this really test-driven, and was the AI really checked?",
    "The front door: one answer in a sentence, with a link to the proof.",
    [["Open <code>#/</code>.", "The answer sentence (marker 1) and its status."], ["Read the figures under the answer.", "Each figure names what it was counted from and links to it."], ["Press the proof link.", "The requirements matrix opens."]]],
  ["about", "How to read this", "#/about", `${R}/about/About.tsx`, 156, "How do I read these pages?",
    "The glossary and the provenance labels (generated, live, not returned).",
    [["Open <code>#/about</code> from the nav.", "The provenance labels (marker 1)."], ["Scan the glossary and status legend.", "Each status word with its colour and meaning."], ["Return to the Overview.", "The labels you learnt appear on every page."]]],
  ["rules", "Requirements matrix", "#/rules", `${R}/matrix/Matrix.tsx`, 152, "Which rules have red and green evidence?",
    "Every rule with its red and green commits, filterable.",
    [["Open <code>#/rules</code>.", "Filters (marker 1) above the matrix table (marker 2)."], ["Filter by status or feature.", "The table narrows."], ["Select a rule chip.", "The rule page opens."]]],
  ["rule", "One rule", "#/rules/CANCEL-1b", `${R}/rule/Rule.tsx`, 309, "What did this rule say, and what proves it?",
    "A rule from its agreed text to its tests, commits and verdicts: the rule's evidence.",
    [["Open <code>#/rules/CANCEL-1b</code>, or type the id in the search box.", "The rule text and agreed interpretation (marker 1)."], ["Read the red-before-green evidence.", "The red commit comes before the green one."], ["Follow a commit link.", "The commit page opens."]]],
  ["plan", "A plan", "#/plans/build", `${R}/plan/Plan.tsx`, 32, "What was built, in what order?",
    "A plan's header, approval and node graph with its table.",
    [["Open <code>#/plans/build</code> through the Plan nav item.", "Plan header, status and approval (marker 1)."], ["Read the node graph.", "Dependencies between nodes."], ["Select a node.", "The node page opens."]]],
  ["node", "A node", `#/plans/${trace.plan}/${trace.node}`, `${R}/node/Node.tsx`, 27, "Was the node witnessed by the trail, and what did it cover?",
    "One node: completeness, the rules it covers and its tasks.",
    [[`Open the node, <code>#/plans/${trace.plan}/${trace.node}</code>.`, "Completeness banner (marker 1)."], ["Read the rules and tasks.", "Each rule is a chip that links to its page."], ["Use the tabs: Walkthrough, Loop, Activity.", "Each tab is its own screen below."]]],
  ["walkthrough", "A node's walkthrough", `#/plans/${trace.plan}/${trace.node}/commits`, `${R}/walkthrough/Walkthrough.tsx`, 43, "In what order did the commits land?",
    "The node's commits in sequence, tagged red, stub, green or refactor.",
    [["Open the Walkthrough tab of a node.", "The commit sequence (marker 1)."], ["Read the TDD tag of each commit.", "Red precedes green."], ["Open a commit.", "The commit page opens."]]],
  ["commit", "One commit", `#/commits/${trace.commit}`, `${R}/commit/Commit.tsx`, 83, "What did this commit change, and who made it?",
    "A commit's header and trailers, whether the trailer's agent matches the hook's, and its lazy diff.",
    [["Open a commit from the walkthrough.", "Header and trailers (marker 1)."], ["Compare trailer agent with hook agent.", "The two agree or the page says they do not."], ["Open the diff.", "The diff loads on demand."]]],
  ["loop", "A node's loop", `#/plans/${trace.plan}/${trace.node}/loop`, `${R}/loop/Loop.tsx`, 63, "How many attempts did the node take?",
    "The attempt ladder: red, green, review, fix.",
    [["Open the Loop tab.", "The attempt ladder (marker 1)."], ["Read a rung.", "Each attempt and its outcome."], ["Follow a verdict link.", "The verdict page opens."]]],
  ["activity", "A node's activity", `#/plans/${trace.plan}/${trace.node}/activity`, `${R}/activity/Activity.tsx`, 123, "Which agent did what, when?",
    "Agent lanes over time, with a text equivalent table.",
    [["Open the Activity tab.", "The agent lanes (marker 1)."], ["Read the event table.", "The same events as text, for keyboard and screen-reader users."], ["Pick an event.", "It links to its commit."]]],
  ["verdict", "A verdict", `#/plans/${trace.plan}/${trace.node}/verdicts/${trace.round}/${trace.agent}`, `${R}/verdict/Verdict.tsx`, 182, "What did the reviewer decide, and why?",
    "One verdict, FAIL here, with the findings behind it.",
    [["Open a verdict from the loop.", "The verdict summary (marker 1)."], ["Read its findings.", "Each finding with its rule and file."], ["Open the findings round.", "The findings screen opens."]]],
  ["finding", "A findings round", `#/plans/${trace.plan}/${trace.node}/findings/${trace.round}`, `${R}/finding/Finding.tsx`, 124, "What was wrong, and how was it fixed?",
    "A findings round: each finding, its cause and the fixing commit.",
    [["Open the findings of a round.", "The findings list (marker 1)."], ["Read one finding.", "Its source and the layer it was in."], ["Follow the fix commit.", "The commit carries a Fixes-Finding trailer."]]],
  ["sessions", "Sessions", "#/sessions", `${R}/sessions/Sessions.tsx`, 52, "What did each working session decide?",
    "The timeline of context snapshots.",
    [["Open <code>#/sessions</code>.", "Snapshot timeline (marker 1)."], ["Pick a snapshot.", "It opens at its own URL."], ["Copy the URL.", "It is a deep link."]]],
  ["session", "One session snapshot", "#/sessions/&lt;file&gt;", `${R}/sessions/Sessions.tsx`, 121, "What was asked, and where did it stop?",
    "One snapshot open at its own URL.",
    [["Open a snapshot from the timeline.", "What was asked for and where it stopped (marker 1)."], ["Read the next action.", "The hand-off for the next session."], ["Return to the timeline.", "The browser's back button works."]]],
  ["harness", "The harness", "#/harness", `${R}/harness/Harness.tsx`, 30, "Which agents, hooks and rules governed the build?",
    "The agents and hooks, as compiled from the harness files.",
    [["Open <code>#/harness</code>.", "Agents (marker 1)."], ["Scroll to hooks.", "Each hook and what it guards."], ["Cross-check with a commit's hook agent.", "The names match."]]],
  ["decisions", "Human decisions", "#/decisions", `${R}/decisions/Decisions.tsx`, 42, "Where did a human decide?",
    "Every human decision (pauses, rulings) in time order, with its evidence line.",
    [["Open <code>#/decisions</code>.", "The decision list (marker 1)."], ["Read a row.", "Kind, node, time and the file and line it came from."], ["Follow its evidence link.", "The source opens."]]],
  ["stats", "Stats", "#/stats", `${R}/stats/Stats.tsx`, 161, "How much did each agent do?",
    "Facts per agent and node, never summed across rules.",
    [["Open <code>#/stats</code>.", "Facts per agent and node (marker 1)."], ["Sort or scan a column.", "Counts come from the trail."], ["Return to the Overview.", "The figures there use the same source."]]],
  ["not-found", "Not found", "#/no/such/page", "app/shell/NotFound.tsx", 9, "What if the address is wrong?",
    "An honest empty page: what was asked for and where to go.",
    [["Open any address that does not exist, for example <code>#/no/such/page</code>.", "A not-found page naming what was asked for (marker 1)."], ["Use the nav.", "Any other screen opens."], ["Fix the address.", "Deep links are case-sensitive for ids."]]],
];

const workbench = [
  ["wb-home-empty", "Workbench home", "#/workbench", [W, "ho" + "me", "WorkbenchHome.tsx"].join("/"), 32, "Which policy do I want to work on?",
    "Open a policy by reference, start a sale, or pick a recent one kept in this browser.",
    [["Open <code>#/workbench</code>.", "The open-by-reference field (marker 1); nothing has been sent, so no request exists."], ["Type a reference and press Open policy.", "One GET <code>/policies/&lt;reference&gt;</code> is sent."], ["Or choose Sell a policy.", "The sell form opens."]]],
  ["wb-sell-filled", "Sell a policy", "#/workbench/sell", `${W}/sell/SellPolicy.tsx`, 129, "If I send this request, what does the API store?",
    "The sell request as a form: policy fields, one to three policyholders, the property, and a send-anyway switch.",
    [["Open <code>#/workbench/sell</code> and fill the policy fields.", "The reference preview shows it as the API will store it (trimmed, upper case)."], ["Fill each policyholder and the property.", "Add another policyholder up to three."], ["Press Sell this policy.", "The API answers 201 and the page says so, with a link to the policy."], ["Switch Send anyway on to test a rule.", "The form's own checks are off and the API's answer is shown."]]],
  ["wb-policy", "Policy view", `#/workbench/policies/${refs.sold}`, `${W}/policy/PolicyView.tsx`, 325, "What does the API hold for this policy?",
    "Status and current term, the term timeline, holders and property, the actions, and the requests that touched it.",
    [["Open the policy from the sell answer or the home.", "Status and current term (marker 1)."], ["Read the timeline and payments.", "Each term with its payment."], ["Use an action button.", "Quote and cancel, Record a claim, Renew."]]],
  ["wb-cancel-quoted", "Quote and cancel", `#/workbench/policies/${refs.sold}/cancel`, `${W}/cancel/CancelPolicy.tsx`, 64, "If I cancel on the date I quoted, is the refund the one I was quoted?",
    "Quote a date, read the refund term by term, then cancel on that date after a confirmation.",
    [["Open Quote and cancel and type a cancellation date.", "Format yyyy-MM-dd, shown as typed."], ["Press Quote this date.", "The refund as a worked sum per term, with the rule applied (CANCEL-1a, 1b or 1c)."], ["Press Cancel on that date and confirm.", "A confirmation dialog, then the API's 201 and a re-read policy status."]]],
  ["wb-claim-done", "Record a claim", `#/workbench/policies/${refs.claim}/claims/new`, `${W}/claim/RecordClaim.tsx`, 84, "What does a claim do to my refund?",
    "Quote, record the claim, quote again: the refund before and after.",
    [["Open Record a claim and fill the date and description.", "A date after today is refused (COULD-2a)."], ["Press Record this claim.", "The claim is recorded (201)."], ["Read the two quotes.", "Any claim makes the later refund 0.00 (COULD-2)."]]],
  ["wb-renew-422", "Renew", `#/workbench/policies/${refs.renew}/renew`, `${W}/renew/RenewPolicy.tsx`, 61, "Will the API take the renewal?",
    "Renewal amount and payment method, and the problems the API may answer.",
    [["Open Renew for a policy.", "Amount and payment method default from the current term."], ["Press Renew policy.", "On a new policy the API answers 422: renewal opens 30 days before the end date (RENEW-1, RENEW-2)."], ["Read the problem list.", "Every violation is listed, none hidden."]]],
  ["wb-requests", "Requests", "#/workbench/requests", `${W}/requests/RequestLogPage.tsx`, 23, "What did this browser send, and what came back?",
    "The request log, newest first, and one exchange as it went over the wire, with a curl.",
    [["Open <code>#/workbench/requests</code>.", "The request log (marker 1)."], ["Select a row.", "One exchange: request, response, status line and a curl."], ["Copy the curl.", "It repeats the request against this origin."]]],
];

const tourFigures = (list, sectionPrefix) =>
  list
    .map(([id, name, route, file, line, question, summary, stepList]) => {
      const shotId = id.startsWith("wb-") ? id : `ex-${id}`;
      const regions = [...shots[shotId].regions.map((r) => r.req), ...shots[shotId].below.map((r) => r.req)];
      return `<h3 id="${sectionPrefix}-${id}">${esc(name)}</h3><p class="headline">${esc(question)}</p><p class="summary">${esc(summary)} <code>${route}</code> Rules and requirements it proves: ${chips(regions) || "none claimed"}</p>
${figure(shotId, name)}${steps(stepList)}${extract(file, line)}`;
    })
    .join("\n");

// ── Real output copied from this run ─────────────────────────────────────────────────────────────────────────
const outputs = JSON.parse(readFileSync(join(here, "run-output.json"), "utf8"));

const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Docket UI User Guide: explorer and workbench</title>
<link rel="stylesheet" href="../assets/guide.css">
</head>
<body>
<section class="cover">
  <h1>Docket UI User Guide</h1>
  <p>The explorer and the workbench: every screen, every workflow, with screenshots, numbered steps and highlighted regions. For assessors, developers and users of the Uinsure Policies build.</p>
  <p>Short form: cut to a short form on 2026-10-23 for time. The web app is not on this guide's branch yet (F8). Every <code>src/Uinsure.Policies.Web</code> path resolves on <code>feature/ui/U10</code>, and on <code>main</code> once the ui plan merges.</p>
</section>
<section class="front">
  <h2>The big ideas</h2>
  <ol>
    <li><strong>Two halves.</strong> The explorer reads the build trail (<code>trace.json</code>); the workbench drives the API with real requests.</li>
    <li><strong>Evidence.</strong> Every rule, node, commit, verdict and finding has a page and a deep link, from the requirement to its tests and commits.</li>
    <li><strong>Honest.</strong> A missing value is drawn as missing, an API answer is shown with the status the page received, and nothing is invented.</li>
    <li><strong>Regions.</strong> Each section of a screen carries a <code>data-region</code> tag; the numbered markers in this guide are measured from those tags.</li>
    <li><strong>Contracts.</strong> Screens were agreed as static HTML first and the app is tested against them: unit, end to end, axe, parity and visual regression.</li>
    <li><strong>Run it yourself.</strong> Every test collection can be run by hand: Postman, Playwright, Vitest.</li>
  </ol>
</section>`;

const s1 = section("s1", "1. What Docket is", "Docket is one app with two halves: an explorer for the build trail and a workbench for the API.",
  "The explorer reads <code>trace.json</code>, compiled from git and the trail files, and shows rules, plans, nodes, commits, verdicts and findings. The workbench sends sell, quote, cancel, claim and renew requests to the running API and shows the answers. Both are static pages with hash routes.",
  svg("Docket's two halves", [["Explorer", "reads trace.json"], ["Docket app", "static build, hash routes"], ["Workbench", "calls /api → the API"]]) +
  `<table><thead><tr><th>Half</th><th>For whom</th><th>Reads</th><th>Needs</th></tr></thead><tbody>
<tr><td>Explorer (18 screens)</td><td>Assessors and developers checking how it was built</td><td><code>trace.json</code></td><td>Nothing running</td></tr>
<tr><td>Workbench (7 screens)</td><td>Users and testers trying the API</td><td>The live API</td><td>The API on its port</td></tr></tbody></table>`,
  [["Which half needs the API?", "Only the workbench."], ["Where does the explorer's data come from?", "<code>trace.json</code>, compiled by <code>npm run trace</code>."]]);

const s2 = section("s2", "2. Run it", "Build once, preview it, and point <code>/api</code> at the API.",
  "The static build is served by <code>vite preview</code>; the workbench calls <code>/api/...</code> and the app proxies it to the API port in <code>DOCKET_API_PORT</code> (default 5080). The dev server does the same on port 4170, which is what the Visual Studio launch profile starts beside the API.",
  steps([
    ["Install and build the app.", "A <code>dist</code> folder.", ["npm --prefix src/Uinsure.Policies.Web ci\nnpm --prefix src/Uinsure.Policies.Web run trace\nnpm --prefix src/Uinsure.Policies.Web run build", "(not captured in this short form)"]],
    ["Start the API (its http profile is port 5080), then preview the app.", "The preview serves the app.", ["dotnet run --project src/Uinsure.Policies.Api --launch-profile http\nDOCKET_API_PORT=5080 npm --prefix src/Uinsure.Policies.Web run preview -- --port 4170", "(not captured: the guide's screenshots came from a copy already running with the app on port 4186 and the API on 5096)"]],
    ["Check both answer.", "HTTP 200 from each, captured from that running copy.", [`curl -s -o /dev/null -w "%{http_code}\\n" http://localhost:4170/\ncurl -s -o /dev/null -w "%{http_code}\\n" http://localhost:5080/health/live`, outputs.health]],
    ["Open <code>http://localhost:4170/#/</code>.", "The Overview. The workbench is at <code>#/workbench</code>."],
    ["Or use Visual Studio: open <code>Uinsure.Policies.slnx</code> and start the \"API and web\" profile.", "Both start; the dev server's <code>/api</code> proxy defaults to port 5080."],
  ]) +
  `<p>Deep links are plain hashes, so any screen can be bookmarked or shared: <code>#/rules/CANCEL-1b</code>, <code>#/commits/&lt;sha&gt;</code>, <code>#/workbench/policies/&lt;reference&gt;</code>. The theme follows the system unless the header's Light or Dark button is pressed.</p>` +
  figure("ex-overview-dark", "The same Overview in the dark theme") +
  extract("vite.config.ts", 21, 6) + extract("Docket.Web.esproj", 4, 1) +
  `<div class="callout"><span class="label">Static Web Apps</span> The hosting config is <a href="../../../infrastructure/web/staticwebapp.config.json#L1">infrastructure/web/staticwebapp.config.json:1</a> and the pipeline's web stage deploys it. It is evidence only: it was validated locally and never deployed.</div>`,
  [["Which port does the workbench's API call go to?", "<code>DOCKET_API_PORT</code>, default 5080."], ["Is the Static Web App live?", "No. Evidence only, never deployed."]]);

const s3 = section("s3", "3. Explorer tour", "Eighteen screens that answer one question each about how the API was built.",
  "Each screen below has a screenshot with numbered markers, a key of the regions the app tags, the rules it proves, numbered steps and the code that draws it. Regions starting below the first screenful are listed under the figure.",
  `<div class="callout"><span class="label">Why</span> Each region carries <code>data-region</code> and <code>data-req</code>. Choice: measure markers from the tags. Alternative: place them by hand. Reason: a hand-placed marker drifts when the layout changes; a measured one cannot lie about where a tagged region is.</div>` +
  tourFigures(explorer, "ex"),
  [["What does a marker number refer to?", "The region in the key beneath the figure, read from its <code>data-region</code> tag."], ["Where do I start to check a rule?", "The Requirements matrix, then the rule page."]]);

const s4 = section("s4", "4. Workbench tour", "Seven screens that drive the API: sell, view, quote and cancel, claim, renew and inspect.",
  "The workbench shows the status the API answered, never a status it did not receive. Each form can send what a user types, and an optional switch lets a request go to the API even when the form's own checks would stop it.",
  tourFigures(workbench, "wb"),
  [["Which screen sends a request to sell a policy?", "Sell a policy, <code>#/workbench/sell</code>."], ["What is Send anyway for?", "Skip the form's own checks so the API's rule answer can be seen."]]);

const ex = (id) => `<a href="#${id}">${id.replace(/^(ex|wb)-/, "")}</a>`;
const s5 = section("s5", "5. Workflows, end to end", "Eight tasks, each from first click to last, run against the live API.",
  `The screenshots in this section were taken during one run with references <code>${refs.sold}</code>, <code>${refs.claim}</code> and <code>${refs.renew}</code>. Statuses seen: sell ${manifest.soldStatus}, duplicate ${manifest.duplicateStatus}, quote ${manifest.quoteStatus}, cancel ${manifest.cancelStatus}, claim ${manifest.claimStatus}, renew ${manifest.renewStatus}.`,
  `<h3>Sell a policy, then view it</h3>` +
  steps([
    ["Open the sell form and fill it in.", "The form as filled, with two policyholders."],
    ["Press Sell this policy.", `The API answers ${manifest.soldStatus}; the page links the policy.`],
    ["Follow Open policy.", "The policy view with status and term (see the Policy view above)."],
  ]) + figure("wb-sell-sold", "The sell form after the API accepted the policy", 340) +
  `<h3>Cancel with a quote</h3>` +
  steps([
    ["From the policy view press Quote and cancel, then type a date and press Quote this date.", `The quote answers ${manifest.quoteStatus} for ${manifest.cancelDate}.`],
    ["Press Cancel on that date.", "A confirmation dialog first."],
    ["Confirm.", `The API answers ${manifest.cancelStatus} and the policy status is re-read as Cancelled.`],
  ]) + figure("wb-cancel-confirm", "The confirmation dialog (no data-region tag; see the spec's audit)", 340) + figure("wb-cancel-done", "The cancel screen after the cancellation", 340) +
  `<h3>Make a claim</h3>` +
  steps([
    ["Open Record a claim from a policy that has started.", "The claim form."],
    ["Enter a date after today and press Record this claim.", `The API answers ${manifest.claimRefusedStatus} (COULD-2a).`],
    ["Enter today's date and record again.", `The API answers ${manifest.claimStatus}; the refund after the claim is shown beside the refund before it.`],
  ]) + figure("wb-claim-422", "A claim dated tomorrow, refused", 340) +
  `<h3>Renew</h3>` +
  steps([
    ["Open Renew on a policy and press Renew policy.", `A new policy answers ${manifest.renewStatus}: renewal opens 30 days before the end date.`],
    ["Read the problems list.", "RENEW-1 and RENEW-2 name the window."],
    ["Renew a policy inside its window.", "Not shown: on the real clock a policy sold today is a year from its window."],
  ]) +
  `<h3>Read a rule's evidence from the requirement to its tests and commits</h3>` +
  steps([
    ["Type <code>CANCEL-1b</code> in the jump-to-search box and press Enter.", "The rule page: the requirement and its agreed interpretation."],
    ["Read the red and green evidence.", "The red commit precedes the green commit."],
    ["Open a commit.", "Its trailers, its TDD step and its diff."],
  ]) +
  `<h3>Follow a node's walkthrough</h3>` +
  steps([
    ["Open Plan, then a node.", "Completeness and the rules it covers."],
    ["Open its Walkthrough tab.", "Commits in order, tagged red, stub, green."],
    ["Open the Loop tab.", "The attempt ladder."],
  ]) +
  `<h3>Read a verdict and its findings</h3>` +
  steps([
    ["On the Loop tab choose a FAIL verdict.", "The verdict page."],
    ["Open its findings round.", "Each finding with its cause."],
    ["Follow the fix commit.", "It carries a Fixes-Finding trailer."],
  ]) +
  `<h3>Inspect a request</h3>` +
  steps([
    ["Press any workbench action, then open <code>#/workbench/requests</code>.", "The log lists the request."],
    ["Select it.", "The exchange as it went, with its status line."],
    ["Copy its curl and run it.", "The same answer comes back."],
  ]),
  [["Which statuses did the sell, duplicate and renew attempts get?", `${manifest.soldStatus}, ${manifest.duplicateStatus} and ${manifest.renewStatus}.`], ["Why can't a new policy be renewed?", "RENEW-1 and RENEW-2: the window opens 30 days before the end date."]]);

const s6 = section("s6", "6. Error and edge states", "Every failure is shown as the API or the browser reported it.",
  "A 4xx or 422 is a Problem banner with the status, rule id and each violation. When the API cannot be reached the page says no answer was read. Empty states say so and send no request.",
  `<table><thead><tr><th>State</th><th>What you see</th><th>Shot</th></tr></thead><tbody>
<tr><td>Form check (client)</td><td>The form stops a bad reference before anything is sent</td><td>below</td></tr>
<tr><td>422, SELL-2</td><td>"Nothing was stored. The API answered 422"</td><td>below</td></tr>
<tr><td>409, SELL-1</td><td>A duplicate reference is refused</td><td>below</td></tr>
<tr><td>404, GET-1</td><td>Opening a policy that does not exist</td><td>below</td></tr>
<tr><td>API unreachable</td><td>No response was read</td><td>below</td></tr>
<tr><td>Empty</td><td>No request sent; no recent policies</td><td>below</td></tr></tbody></table>` +
  figure("wb-sell-client-error", "The form's own check", 340) + figure("wb-sell-422", "422: a backdated start", 340) + figure("wb-sell-409", "409: the same reference again", 340) +
  figure("wb-home-404", "404: no such policy", 340) + figure("wb-unreachable", "The API unreachable", 340) + figure("wb-requests-empty", "Empty: no request yet", 340) +
  figure("wb-home-recent", "A recent policy listed (compare with the empty home above)", 340),
  [["How do I tell a 422 from a 409?", "422 is a rule (SELL-2 here); 409 is a conflict (SELL-1 duplicate)."], ["What does the page show when the API is down?", "That no response was read."]]);

const s7 = section("s7", "7. Accessibility", "Keyboard first, two themes, and axe on every screen.",
  "Every control is reachable with the keyboard: press <kbd>/</kbd> to jump to search, <kbd>Up</kbd> and <kbd>Down</kbd> to choose, <kbd>Enter</kbd> to open and <kbd>Esc</kbd> to close. The theme toggle sets Light, Dark or System. The Playwright suite runs axe on the screens; the activity and event tables are text equivalents of the lanes.",
  `<p>The suites are the <code>a11y-1</code> specs in <a href="../../../tests/Uinsure.Policies.Web.Tests/e2e/U0b/a11y-1.spec.ts#L1">tests/Uinsure.Policies.Web.Tests/e2e/U0b/a11y-1.spec.ts:1</a>, and the same name under U8 and W1.</p>`,
  [["Which key opens search?", "<kbd>/</kbd>."], ["What does axe check?", "Contrast, names, roles and landmarks on each screen, in the end-to-end suite."]]);

const s8 = section("s8", "8. Run the tests yourself", "Postman for the API's requests, Playwright for the screens, Vitest for the units.",
  "The workbench sends the same requests the Postman collection sends. Every runner is below with its command; only the Postman run was executed for this guide, and its summary is copied from that run.",
  `<h3>Postman app (MAN-1)</h3>` + steps([
    ["Import <code>tests/postman/Uinsure.Policies.postman_collection.json</code> and <code>tests/postman/local.postman_environment.json</code>.", "Folders F0b Walking skeleton, F1 Sell, F1b Layered models, F2 Retrieve, F3 Cancel, F4 Renew."],
    ["Select the local environment, start the API on 5080, and open the Collection Runner.", "Run the collection, one folder or one request."],
    ["Read the results.", "Each test name starts with its rule id."],
  ]) +
  `<h3>Postman CLI (MAN-2)</h3>` + steps([
    ["Run one folder against the running API (the base URL is overridden here to the API port in use).", "A summary table.", ["postman collection run tests/postman/Uinsure.Policies.postman_collection.json -e tests/postman/local.postman_environment.json --env-var baseUrl=http://localhost:5080 -i \"F2 Retrieve\"", outputs.postman]],
  ]) +
  `<h3>Playwright (MAN-5)</h3>` + steps([
    ["Install the browser once.", "Chromium downloaded.", ["npm --prefix src/Uinsure.Policies.Web exec -- playwright install chromium", "(not run in this short form)"]],
    ["Run everything: it builds, starts the app and uses its own API.", "Specs pass.", ["npm --prefix src/Uinsure.Policies.Web run e2e", "(not run in this short form)"]],
    ["Run one spec or one test by title, rule id or screen name; use <code>--ui</code> for UI mode, <code>--headed</code> or <code>--debug</code> to watch.", "The matching tests only.", ["npm --prefix src/Uinsure.Policies.Web exec -- playwright test --config playwright.config.ts W1/wb-1 -g \"WB-1\"", "(not run in this short form)"]],
    ["Run with the HTML reporter and traces on the command line (the config itself uses the list reporter), then open the report.", "The HTML report opens in the browser.", ["npm --prefix src/Uinsure.Policies.Web exec -- playwright test --config playwright.config.ts --reporter=html --trace on\nnpm --prefix src/Uinsure.Policies.Web exec -- playwright show-report","(not run in this short form)"]],
  ]) +
  `<div class="callout warn"><span class="label">Visual regression</span> The baselines are Windows renders in <code>docs/ui/baselines</code>, so the regression folder is skipped on Linux. Update them only deliberately, with <code>--update-snapshots</code>, after a signed-off design change, never to silence a failure. See <a href="../../../src/Uinsure.Policies.Web/playwright.config.ts#L9">src/Uinsure.Policies.Web/playwright.config.ts:9</a>.</div>` +
  `<h3>Vitest (MAN-6)</h3>` + steps([
    ["Run the unit tests once, in watch mode, or for one file.", "A pass count.", ["npm --prefix src/Uinsure.Policies.Web run test\nnpm --prefix src/Uinsure.Policies.Web exec -- vitest --config vite.config.ts\nnpm --prefix src/Uinsure.Policies.Web exec -- vitest run --config vite.config.ts ../../tests/Uinsure.Policies.Web.Tests/unit/client/wb-1.test.ts", "(not run in this short form)"]],
  ]) +
  `<h3>Every runner (MAN-7)</h3><table><thead><tr><th>Runner</th><th>Tests</th><th>Use when</th><th>Command or click</th><th>Needs running</th><th>Time</th></tr></thead><tbody>
<tr><td>Postman app</td><td>The API's requests, by rule</td><td>Exploring</td><td>Collection Runner</td><td>API on 5080</td><td>Not measured</td></tr>
<tr><td>Postman CLI</td><td>Same</td><td>Scripted</td><td><code>postman collection run …</code></td><td>API</td><td>${esc(outputs.postmanTime)}</td></tr>
<tr><td>Playwright</td><td>Screens, a11y, parity, regression</td><td>Before a UI change lands</td><td><code>npm run e2e</code></td><td>Starts its own</td><td>Not measured</td></tr>
<tr><td>Vitest</td><td>Units and kit</td><td>While coding</td><td><code>npm run test</code></td><td>Nothing</td><td>Not measured</td></tr>
<tr><td>Visual Studio, <code>dotnet test</code></td><td>The .NET suites (see the API guide)</td><td>API work</td><td>Test Explorer</td><td>Nothing</td><td>Not measured</td></tr></tbody></table>`,
  [["Which runner needs the API already running?", "Postman, app or CLI."], ["When may I update a visual baseline?", "Only deliberately, after a signed-off design change."]]);

const s9 = section("s9", "9. Understand it", "A small folder tree, one compiler, one kit, screens as contracts, five kinds of test.",
  "The explorer's data is compiled once into <code>trace.json</code>; the kit supplies components and tokens; the screens were agreed as static HTML before they were built.",
  svg("From git to the screen", [["git + trail files", "commits, verdicts, findings"], ["compiler/", "npm run trace"], ["trace.json", "public/ and dist/"], ["explorer", "reads it"]]) +
  `<table><thead><tr><th>Topic</th><th>Where</th><th>What</th></tr></thead><tbody>
<tr><td>Folder tree after U10</td><td><code>src/Uinsure.Policies.Web</code>: <code>app/</code> (explorer, workbench, shell, data), <code>kit/</code>, <code>compiler/</code>, <code>public/</code>; tests in <code>tests/Uinsure.Policies.Web.Tests</code>: <code>unit/</code>, <code>kit/</code>, <code>e2e/</code>, <code>fixtures/</code></td><td>One project, tests beside the API's</td></tr>
<tr><td>The compiler</td><td><code>compiler/index.ts</code>, <code>git.ts</code>, <code>plans.ts</code>, <code>privacy.ts</code></td><td>Reads git and the trail, scrubs private data, writes <code>trace.json</code></td></tr>
<tr><td>The kit and tokens</td><td><code>kit/</code>, <code>tokens.css</code></td><td>Components (patterns, layouts) and the colours and type; this guide uses the same tokens</td></tr>
<tr><td>Design pipeline</td><td><code>docs/ui/</code>: directions, concept, styles, mockups, screens</td><td>Directions, then a style, then one static HTML per screen state</td></tr>
<tr><td>How screens are tested</td><td><code>tests/Uinsure.Policies.Web.Tests</code></td><td>Unit and kit (Vitest), end to end (Playwright), axe, parity against the screens, visual regression</td></tr></tbody></table>` +
  `<div class="callout"><span class="label">Why</span> Screens are contracts, not code. Choice: agree each screen as static HTML in <code>docs/ui/screens</code> and test the app for parity. Alternative: design in the code. Reason: a reviewer can approve a screen without reading React, and a test can fail when the app drifts from it.</div>` +
  extract("app/shell/Rung.tsx", 17, 6),
  [["What does the compiler produce?", "<code>trace.json</code>."], ["Why static screens first?", "So a design is approved before it is coded, and tested for parity afterwards."]]);

const s10 = section("s10", "10. Troubleshooting", "Most problems are a missing API, a missing trace or a missing browser.", "Built from the problems met while capturing this guide and from the repo's own configuration.",
  `<table><thead><tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr></thead><tbody>
<tr><td>The workbench says no response was read</td><td>The API is not running, or <code>DOCKET_API_PORT</code> names the wrong port</td><td>Start the API; set <code>DOCKET_API_PORT</code> to its port and restart the preview</td></tr>
<tr><td>Explorer screens say data is not available</td><td><code>trace.json</code> was not compiled</td><td><code>npm --prefix src/Uinsure.Policies.Web run trace</code>, then rebuild</td></tr>
<tr><td>Port 4170 in use</td><td>The dev server uses <code>--strictPort</code></td><td>Stop the other process or pass another <code>--port</code></td></tr>
<tr><td>Playwright says the browser is missing</td><td>Chromium not installed</td><td><code>npm --prefix src/Uinsure.Policies.Web exec -- playwright install chromium</code></td></tr>
<tr><td>Visual regression fails on Linux or macOS</td><td>Baselines are Windows renders; Linux skips the folder</td><td>Run on Windows; update baselines only deliberately</td></tr>
<tr><td>Renew answers 422 on a new policy</td><td>RENEW-1 and RENEW-2: the window opens 30 days before the end date</td><td>Expected; renew inside the window</td></tr>
<tr><td>A sell answers 409</td><td>SELL-1: the reference exists (case-insensitive)</td><td>Use a new reference</td></tr>
<tr><td>The request log is empty after a reload</td><td>It lists requests since the page opened</td><td>Send the request again</td></tr></tbody></table>`,
  null);

const html = `${head}\n${[s1, s2, s3, s4, s5, s6, s7, s8, s9, s10].join("\n")}\n</body>\n</html>\n`;
writeFileSync(join(here, "index.html"), html);
console.log(`Wrote index.html (${html.length} bytes)`);
