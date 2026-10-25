// Builds docs/guides/ui/index.html: the UI user guide as two persona journeys (feat-001/N1; spec: docs/specs/ui-guide.spec.md).
// Usage: node docs/guides/ui/build.mjs
// Inputs: shots/manifest.json (the red boxes, measured by capture.mjs from data-region tags), run-output.json (real command
// output, from run-receipts.mjs), the web app's source (the code extracts) and tests/postman (the folders and their rule ids).
// Nothing here is typed from memory: the outputs, the boxes and the code lines are copied from those files.
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..", "..");
const manifest = JSON.parse(readFileSync(join(here, "shots", "manifest.json"), "utf8"));
const out = JSON.parse(readFileSync(join(here, "run-output.json"), "utf8"));
const shots = Object.fromEntries(manifest.shots.map((s) => [s.id, s]));
const used = new Set();
// Shots whose compressed pixels trip the e-mail pattern of the privacy scan when embedded in the PDF (see .nudge in guide.css).
const NUDGE = new Set(["aj5-finding"]);
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const W = "src/Uinsure.Policies.Web";
const T = "tests/Uinsure.Policies.Web.Tests";

// ── Code extract (LRN-9): 3 to 12 real lines, with a repo-relative path:line link ─────────────────────────────────
function extract(path, at, count = 6) {
  const lines = readFileSync(join(root, path), "utf8").replace(/\r\n/g, "\n").split("\n");
  const index = typeof at === "number" ? at - 1 : lines.findIndex((l) => at.test(l));
  assert.ok(index >= 0, `${path}: no line matches ${at}`);
  const shown = lines.slice(index, index + Math.min(count, 6));
  while (shown.length && shown[shown.length - 1].trim() === "") shown.pop();
  assert.ok(shown.filter((l) => l.trim()).length >= 3 && shown.length <= 12, `${path}:${index + 1}: extract must be 3 to 12 real lines`);
  return `<div class="extract"><a class="ref" href="../../../${path}#L${index + 1}">${path}:${index + 1}</a><pre>${esc(shown.join("\n"))}</pre></div>`;
}
const web = (rel, at, count) => extract(`${W}/${rel}`, at, count);

const chips = (reqs) => [...new Set(reqs.filter(Boolean))].map((r) => `<span class="chip">${esc(r)}</span>`).join(" ");

// ── A screenshot with red boxes and "Step n" labels (LRN-6, amended), and the sub-steps beneath it ───────────────────
// subs: { n: text }, one entry per box, in step order; a shot with no box (it frames a result, LRN-13) has none.
function fig(id, { step, subs = {}, caption, see }) {
  const s = shots[id];
  assert.ok(s, `no shot ${id}`);
  assert.ok(existsSync(join(here, "shots", `${id}.png`)), `no file for shot ${id}`);
  assert.equal(s.step, step, `shot ${id} belongs to ${s.step}, not ${step}`);
  assert.ok(!used.has(id), `shot ${id} used twice`);
  used.add(id);
  assert.deepEqual(Object.keys(subs).map(Number), s.boxes.map((b) => b.n), `shot ${id}: the sub-steps must match its boxes`);
  const width = Math.min(516,Math.round((540 * s.width) / s.height));
  const overlay = s.boxes
    .map((b) => `<span class="box" style="left: ${b.left}%; top: ${b.top}%; width: ${b.width}%; height: ${b.height}%"></span><span class="boxlabel" style="left: ${b.labelLeft}%; top: ${b.labelTop}%">${esc(b.label)}</span>`)
    .join("");
  const list = s.boxes.length
    ? `<ol class="substeps">${s.boxes.map((b) => `<li><strong>${esc(b.label)}:</strong> ${subs[b.n]}</li>`).join("")}</ol>`
    : "";
  const result = see ? `<div class="see">${see}</div>` : "";
  const reqs = chips(s.regions.map((r) => r.req));
  return `<figure><div class="shot"><img src="shots/${id}.png" alt="${esc(s.title)}" width="${width}"${NUDGE.has(id) ? " class=\"nudge\"" : ""}>${overlay}</div>
<figcaption>${esc(caption ?? s.title)}. <code>${esc(s.hash)}</code>${reqs ? ` Requirement tags in view: ${reqs}` : ""}</figcaption>${list}${result}</figure>`;
}

// ── Steps (LRN-5, LRN-12) ──────────────────────────────────────────────────────────────────────────────────────────
function step(id, title, { decide, gives, body }) {
  return `<li class="step" id="${id}"><h3>${id} · ${esc(title)}</h3>
<div class="decide"><span class="label">You decide</span> ${decide}</div>
<div class="gives"><span class="label">Docket gives you</span> ${gives}</div>
${body}</li>`;
}
const journey = (id, title, headline, summary, steps, checks) =>
  `<section class="journey" id="${id}"><h2>${title}</h2><p class="headline">${headline}</p><p class="summary">${summary}</p><ol class="steps">${steps.join("\n")}</ol>${check(checks)}</section>`;

// A command, what you should see, and the real output (copied from run-output.json by the caller).
const run = (items) =>
  `<ol class="run">${items
    .map(([text, cmd, see, output]) => `<li>${text}${cmd ? `<pre>${esc(cmd)}</pre>` : ""}${see ? `<div class="see">${see}</div>` : ""}${output ? `<pre class="output">${esc(output)}</pre>` : ""}</li>`)
    .join("")}</ol>`;
const check = (rows) =>
  `<h3>Check your understanding</h3><table class="check"><thead><tr><th>Question</th><th>Answer</th></tr></thead><tbody>${rows
    .map(([q, a]) => `<tr><td>${q}</td><td>${a}</td></tr>`)
    .join("")}</tbody></table>`;
const section = (id, title, headline, summary, body, checks) =>
  `<section id="${id}"><h2>${title}</h2><p class="headline">${headline}</p><p class="summary">${summary}</p><details class="depth" open><summary>In depth</summary>${body}</details>${check(checks)}</section>`;
const callout = (label, text, kind = "") => `<div class="callout${kind ? ` ${kind}` : ""}"><span class="label">${label}</span> ${text}</div>`;
const why = (choice, alt, reason) => callout("Why", `Choice: ${choice} Alternative: ${alt} Reason: ${reason}`);
const table = (head, rows, cls = "") =>
  `<table${cls ? ` class="${cls}"` : ""}><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

// ── Diagrams (LRN-4): inline SVG in Docket's palette, one per big idea ───────────────────────────────────────────────
function svg(label, rows) {
  const w = 168;
  const gap = 28;
  const cols = Math.max(...rows.map((r) => r.length));
  const total = 8 + cols * w + (cols - 1) * gap;
  const body = rows
    .map((boxes, r) =>
      boxes
        .map((b, i) => {
          const x = 4 + i * (w + gap);
          const y = 6 + r * 66;
          const arrow = i < boxes.length - 1 ? `<path d="M${x + w} ${y + 28}h${gap}" stroke="var(--color-primary)" stroke-width="2"/><path d="M${x + w + gap - 6} ${y + 23}l6 5l-6 5" fill="none" stroke="var(--color-primary)" stroke-width="2"/>` : "";
          return `<rect x="${x}" y="${y}" width="${w}" height="56" fill="var(--color-accent)" stroke="var(--color-primary)"/><text x="${x + w / 2}" y="${y + 24}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--color-text-primary)">${esc(b[0])}</text><text x="${x + w / 2}" y="${y + 42}" text-anchor="middle" font-size="9" fill="var(--color-text-secondary)">${esc(b[1])}</text>${arrow}`;
        })
        .join(""),
    )
    .join("");
  return `<figure><svg viewBox="0 0 ${total} ${rows.length * 66 + 6}" role="img" aria-label="${esc(label)}">${body}</svg><figcaption>${esc(label)}</figcaption></figure>`;
}

// ── Data read from the repository ──────────────────────────────────────────────────────────────────────────────────
const collection = JSON.parse(readFileSync(join(root, "tests/postman/Uinsure.Policies.postman_collection.json"), "utf8"));
const postmanFolders = collection.item
  .filter((f) => f.item)
  .map((f) => {
    const ids = new Set();
    let requests = 0;
    const walk = (items) =>
      items.forEach((i) => {
        if (i.item) return walk(i.item);
        requests++;
        const m = /^([A-Z0-9]+(?:-[0-9a-z/]+)*)\s·/.exec(i.name);
        if (m) ids.add(m[1]);
      });
    walk(f.item);
    return { name: f.name, requests, ids: [...ids] };
  });
const lastLines = (text, n) => {
  const lines = text.split("\n");
  return lines.length <= n ? text : `…\n${lines.slice(-n).join("\n")}`;
};
const head = (text, n) => text.split("\n").slice(0, n).join("\n");
const seconds = (r) => `${r.seconds} s`;
const R = (key) => {
  assert.ok(out[key], `run-output.json has no "${key}"; run node docs/guides/ui/run-receipts.mjs`);
  return out[key];
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// The document
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const page = [];

page.push(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Docket UI User Guide: two journeys through the workbench and the explorer</title>
<link rel="stylesheet" href="../assets/guide.css">
</head>
<body>
<section class="cover">
  <h1>Docket UI User Guide</h1>
  <p>Two people's journeys through Docket: a policy servicer in the workbench, and an assessor in the explorer. At every step you see what you decide, what Docket gives you back, the control to use boxed in red, and the result it produces.</p>
  <p>Screenshots come from the app on <code>main</code>, with the trail compiled at snapshot <code>a2dc6df</code>. Every path is under <code>${W}</code> or <code>${T}</code>.</p>
</section>
<section class="front">
  <h2>The big ideas</h2>
  <ol>
    <li><strong>Two people.</strong> A policy servicer drives the API from the workbench; an assessor checks how it was built from the explorer. Pick your journey and follow it.</li>
    <li><strong>Decide, then see.</strong> Every step names what you decide and what Docket gives you back, so the screen is never a surprise.</li>
    <li><strong>Red boxes.</strong> The control a step drives from has a red box and a "Step n" label. The shot shows the result the step produces.</li>
    <li><strong>Evidence.</strong> Every rule links to its requirement, its tests, its commits and its verdicts, so one click replaces a search of the git log.</li>
    <li><strong>Honest.</strong> A missing value is drawn as missing, an answer is shown with the status the page received, and nothing is invented.</li>
    <li><strong>Contracts.</strong> Screens were agreed as static HTML first, and the app is tested against them: unit, end to end, axe, parity and visual regression.</li>
    <li><strong>Run it yourself.</strong> Every test collection can be run by hand: Vitest, Playwright and Postman.</li>
  </ol>
</section>`);

// ── Start here ────────────────────────────────────────────────────────────────────────────────────────────────────
page.push(
  section(
    "start",
    "Start here",
    "Pick your journey, then follow its steps in order.",
    "Docket is one app with two halves. The workbench sends real requests to the API and shows what came back. The explorer reads the build trail and shows how each rule was proved. Each half has its own journey below, and each step in a journey follows the same shape.",
    svg("Two people, two halves of one app", [
      [["Policy servicer", "sells, cancels, claims, renews"], ["Workbench", "#/workbench, calls /api"], ["The API", "port 5080"]],
      [["Assessor", "checks how it was built"], ["Explorer", "#/, reads trace.json"], ["The build trail", "git and docs/trace"]],
    ]) +
      table(
        ["", "Policy servicer", "Assessor"],
        [
          ["Works in", "The workbench, <code>#/workbench</code>", "The explorer, <code>#/</code>"],
          ["Reads", "The live API", "<code>trace.json</code>, compiled from git and the trail files"],
          ["Needs running", "The API, and the app with <code>/api</code> pointed at it", "The app only"],
          ["Journey", "<a href=\"#servicer\">SJ1 to SJ9</a>", "<a href=\"#assessor\">AJ1 to AJ8</a>"],
        ],
      ) +
      svg("Every step has the same shape", [[["You decide", "what you choose here"], ["Docket gives you", "what comes back"], ["The shot shows", "the result, boxed in red"]]]) +
      `<h3>How to read a screenshot</h3>
<p>A red box is drawn round the control or region a step drives from, with a red "Step n" label beside it. The sub-step list under the shot says what to do at "Step n". A shot with no box frames a result: the response, the end of a page, a plan picture. Box positions are measured from each region's <code>data-region</code> tag by <code>capture.mjs</code>, never placed by eye.</p>` +
      svg("Where a red box comes from", [[["data-region", "a tag on each region"], ["capture.mjs", "measures its rectangle"], ["manifest.json", "percentages of the image"], ["Red box", "drawn over the shot"]]]) +
      callout(
        "Two kinds of Step",
        "Explorer screens print their own rung labels in black, such as <em>Step 1 Read the answer</em>. Those belong to the screen. The red <em>Step n</em> labels belong to this guide. Where a screen prints its own labels, the step text says which one it means. The workbench forms print numbered circles for their rungs; they are not boxes or labels either.",
        "warn",
      ) +
      why(
        "Box each control from the app's own region tags.",
        "Place boxes by hand.",
        "A hand-placed box drifts when the layout changes. A measured box cannot lie about where a tagged region is.",
      ) +
      callout(
        "Untagged regions",
        "Four regions carry no <code>data-region</code> tag: the header and theme toggle, the cancel confirmation dialog, the requests drawer, and a problem banner inside a screen. Their boxes are measured from the element found by its accessible name, and the manifest records the nearest tagged ancestor. Nothing is placed by hand.",
      ),
    [
      ["Which journey is mine?", "Servicers follow SJ1 to SJ9 in the workbench. Assessors follow AJ1 to AJ8 in the explorer."],
      ["What is the red \"Step n\" label?", "This guide's label for the control you use at that sub-step. It is not the screen's own rung label."],
      ["Where do the boxes come from?", "The <code>data-region</code> tag of the region, measured by <code>capture.mjs</code>."],
    ],
  ),
);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// Journey 1: the policy servicer
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const serve = R("serve");
// The API's start-up log is long (it creates the SQLite tables); the guide shows its first line and the lines from "Now listening".
const apiLines = serve.apiOutput.split("\n");
const apiStart = `${apiLines[0]}\n…\n${apiLines.slice(apiLines.findIndex((l) => l.includes("Now listening")) - 1).join("\n")}`;
const SJ = [];

SJ.push(
  step("SJ1", "Open the workbench", {
    decide: "Whether to serve a static build or the dev server, and which port your API is on.",
    gives: "The workbench home with its status line. It says nothing has been requested until you press Open policy. Both modes proxy <code>/api</code> to the API.",
    body:
      table(
        ["Mode", "Command, from the repository root unless stated", "App port", "Use when"],
        [
          ["Static build, preview", "<code>run build</code> then <code>run preview -- --port 4170</code>", "4170", "A demo; the screenshots in this guide came from a static build"],
          ["Dev server", `<code>node scripts/dev.mjs --port 4170 --strictPort</code>, from <code>${W}</code>`, "4170", "Changing Docket; it compiles the trail on start"],
          ["Visual Studio", "Open <code>Uinsure.Policies.slnx</code> and start the \"API and web\" profile", "4170", "Starts the API (http profile, 5080) and the dev server together"],
        ],
      ) +
      callout(
        "Shell",
        "The commands in this guide are for Git Bash or any POSIX shell. In PowerShell, set the port first with <code>$env:DOCKET_API_PORT = \"5080\"</code> instead of the <code>DOCKET_API_PORT=5080</code> prefix, and use <code>Invoke-WebRequest</code> where this guide uses <code>curl</code>.",
        "warn",
      ) +
      run([
        ["Install the packages once.", `npm --prefix ${W} ci`, "", ""],
        ["Compile the trail into <code>trace.json</code> (the explorer's data), then build the static app.", `npm --prefix ${W} run trace\nnpm --prefix ${W} run build`, `Both finish with exit ${R("build").exit}; the build took ${seconds(R("build"))}.`, `${head(R("trace").output, 6)}\n…\n${lastLines(R("build").output, 8)}`],
        ["Start the API on its http profile in one terminal.", "dotnet run --project src/Uinsure.Policies.Api --launch-profile http", "The API listens on 5080.", apiStart],
        ["In a second terminal, preview the app with <code>/api</code> proxied to that port.", `DOCKET_API_PORT=5080 npm --prefix ${W} run preview -- --port 4170`, "The preview serves the app on 4170.", serve.previewOutput.trim()],
        ["Check that the app, the API and the proxy each answer.", serve.checks.map((c) => c.command).join("\n"), "HTTP 200 from each, from this run.", serve.checks.map((c) => c.output).join("\n")],
      ]) +
      `<p>Open <code>http://localhost:4170/#/workbench</code>. The shot shows what you should see before you send anything.</p>` +
      fig("sj1-home", {
        step: "SJ1",
        subs: {
          1: "The <b>Policy reference</b> box. Type the reference of a policy that exists. You have none yet, so leave it empty and sell one in SJ2.",
          2: "The <b>Open policy</b> button. It sends one <code>GET /policies/&lt;reference&gt;</code>, and shows Opening… and is disabled until the API answers.",
        },
        see: "Request status says <em>Idle. No request sent.</em> The workbench never shows a result it did not receive.",
      }) +
      web("app/workbench/home/WorkbenchHome.tsx", /^export function WorkbenchHome/, 8) +
      web("vite.config.ts", /^const proxy = \{/, 7) +
      web("Docket.Web.esproj", /<StartupCommand>/, 3) +
      why("Proxy <code>/api</code> to the API instead of calling it from the browser.", "Call the API's origin directly.", "The page and the API then share one origin, so the browser makes no cross-origin call. The same shape serves the hosted Static Web App."),
  }),
);

SJ.push(
  step("SJ2", "Sell a policy", {
    decide: "The reference, the start date, the amount and payment method, one to three policyholders, and the property.",
    gives: "Checks on each field as you type, then the API's answer: a new policy reference, or the rule that refused it.",
    body:
      `<p>Open <code>#/workbench/sell</code> from the home page's <em>Sell a new policy</em> link. The form has rungs: name the policy, add the policyholders, describe the property, then send. The grey <em>Server constraint</em> lines under a field are the API's own limits.</p>` +
      fig("sj2-form", {
        step: "SJ2",
        subs: {
          1: "<b>Policy reference</b>: type a new one, 3 to 20 letters, digits or hyphens. It is trimmed and upper-cased as the API stores it (SELL-1).",
          2: "<b>Start date</b>: <code>yyyy-MM-dd</code>, from today to today + 60. No backdating (SELL-2).",
          3: "<b>Amount</b>: greater than zero, at most 2 decimal places (SELL-7). Choose Type, Payment method and Auto-renew above and below it.",
        },
      }) +
      fig("sj2-people", {
        step: "SJ2",
        subs: {
          1: "<b>Policyholder 1</b>: first name, last name and date of birth. Each must be 16 or older on the start date (SELL-5).",
          2: "<b>Policyholder 2</b>: add up to three in all, remove with <em>Remove</em> (SELL-4).",
        },
      }) +
      fig("sj2-submit", {
        step: "SJ2",
        subs: { 1: "<b>Sell this policy</b>: sends <code>POST /policies</code> with every value above. The button is busy and disabled while the request runs." },
      }) +
      fig("sj2-sent", {
        step: "SJ2",
        caption: "The result at the end of the form: the request as sent, and the API's 201",
        see: "The receipt for rung 4 lists <code>POST /policies</code> with a green <b>201</b> and the request body as it went. Nothing is hidden or reformatted. Continue to <a href=\"#SJ3\">SJ3</a> to open the policy.",
      }) +
      `<h3>When the sale is refused</h3>` +
      fig("sj2-client-error", {
        step: "SJ2",
        subs: { 1: "The <b>Policy reference</b> box holds <code>ab</code>. The form's own check stops it before anything is sent; the page says so, and no request appears in the log." },
      }) +
      fig("sj2-conflict", {
        step: "SJ2",
        subs: { 1: "The <b>error summary</b>: the same reference sold twice. The API answers <b>409</b> with rule <code>SELL-1</code>, and the page repeats the API's own words." },
      }) +
      web("app/workbench/sell/SellPolicy.tsx", /^export function SellPolicy/, 8),
  }),
);

SJ.push(
  step("SJ3", "Read the policy", {
    decide: "Which policy to open: from the sell answer, the home page's recent list, or by typing its reference.",
    gives: "The policy as the API holds it: its status, current term, payments, holders and property, the actions open to you, and the requests that touched it.",
    body:
      `<p>Back on <code>#/workbench</code>, the browser remembers the references you have used and lists them under <em>Recent policies in this browser</em>. The list is local to this browser.</p>` +
      fig("sj3-recent", {
        step: "SJ3",
        subs: { 1: "The recent policy <b>UIG-235PG-A</b>: choose it to open the policy page." },
      }) +
      fig("sj3-policy", {
        step: "SJ3",
        subs: { 1: "<b>Status and current term</b>: the headline says <em>Pending</em> because this policy starts in the future. Below it the term's dates, amount, claims flag and auto-renew." },
      }) +
      fig("sj3-policy-end", {
        step: "SJ3",
        caption: "The same page, down to its last section",
        subs: {
          1: "<b>Actions</b>: Quote and cancel (SJ4), Record a claim (SJ5) and Renew (SJ6).",
          2: "<b>Requests that touched this policy</b>: the sell, the failed duplicate and each read, with the status the API sent.",
        },
      }) +
      web("app/workbench/policy/PolicyView.tsx", /^export function PolicyView/, 8),
  }),
);

SJ.push(
  step("SJ4", "Quote a cancellation, then cancel", {
    decide: "The date to quote, and whether to cancel on that date once you have seen the refund.",
    gives: "The refund for each term, worked as a sum, with the rule that decided it (CANCEL-1a, CANCEL-1b, CANCEL-1c or UNPAID-TERM). A confirmation dialog stands between you and the cancel.",
    body:
      `<p>From the policy's Actions press <em>Quote and cancel</em>. A quote is read-only: it saves nothing (COULD-1).</p>` +
      fig("sj4-quote", {
        step: "SJ4",
        subs: {
          1: "<b>Cancellation date</b>: type <code>2026-12-04</code>. Format <code>yyyy-MM-dd</code>, shown as you typed it.",
          2: "<b>Quote</b> (<em>Quote this date</em>, then <em>Quote again</em>): the API answers 200. The headline reads <em>Cancel on 2026-12-04 and the refund quoted is 537.43. Nothing is cancelled yet.</em>",
        },
        see: "<em>The refund, term by term</em> shows 587.31 × 334 ÷ 365 = 537.43, rule <code>CANCEL-1c</code> (after the cooling-off period, pro-rata on the days unused). The Problems list names the rules that can refuse a date: CANCEL-3, CANCEL-4 and CANCEL-7.",
      }) +
      fig("sj4-confirm", {
        step: "SJ4",
        subs: { 1: "<b>Cancel policy on 2026-12-04</b> in the confirmation dialog. The dialog repeats the policy, the quoted date and the refund, and says a cancellation cannot be undone. <em>Go back</em> leaves the policy untouched." },
      }) +
      fig("sj4-done", {
        step: "SJ4",
        see: "The headline reads <em>Cancelled on 2026-12-04. The API answered 201, with a total refund of 537.43.</em> The Status chip is Cancelled, re-read from the API.",
      }) +
      fig("sj4-compare", {
        step: "SJ4",
        caption: "The end of the page: the quote and the cancellation compared, field by field",
        see: "<code>ruleApplied</code> and <code>totalRefund</code> agree between the quote and the cancellation. Rows marked quote-only or cancellation-only are not compared. The requests drawer shows the final <code>GET</code> that reported the policy as Cancelled.",
      }) +
      web("app/workbench/cancel/CancelPolicy.tsx", /^function CancelScreen/, 8),
  }),
);

SJ.push(
  step("SJ5", "Record a claim", {
    decide: "The date of the claim and a description.",
    gives: "The refund quoted before the claim, the claim recorded, and the refund quoted again. A claim changes the refund (COULD-2).",
    body:
      `<p>Open <code>#/workbench/policies/&lt;reference&gt;/claims/new</code> from the policy's Actions. The screen reads three rungs down: quote the refund, record the claim, quote again.</p>` +
      fig("sj5-form", {
        step: "SJ5",
        subs: {
          1: "<b>Claim date</b>: today, or an earlier date inside a term's cover (COULD-2a, COULD-2b).",
          2: "<b>Claim description</b>: up to 500 characters.",
        },
      }) +
      fig("sj5-submit", {
        step: "SJ5",
        subs: { 1: "<b>Record this claim</b>: sends the claim, then asks for the quote again. The button stays busy until the request and both quotes have run." },
      }) +
      fig("sj5-refused", {
        step: "SJ5",
        subs: { 1: "The <b>problem list</b> after a claim dated in the future: the API answers <b>422</b> with <code>COULD-2a</code>. Nothing was recorded." },
      }) +
      fig("sj5-done", {
        step: "SJ5",
        caption: "The claim recorded: the refund before and after",
        see: "Rung 1: refund quoted <b>£412.50</b>, rule <code>CANCEL-1b</code>. Rung 2: claim recorded; the policy now reads <code>hasClaims true</code>. Rung 3: refund quoted <b>£0.00</b>, rule <code>COULD-2</code>. The struck-through sum shows that the rule, not the arithmetic, set the refund.",
      }) +
      web("app/workbench/claim/RecordClaim.tsx", /^export function RecordClaim/, 8),
  }),
);

SJ.push(
  step("SJ6", "Renew", {
    decide: "Whether to renew now, and the amount and payment method for the new term.",
    gives: "The API's answer and, outside the renewal window, its refusal with the window's dates (RENEW-1, RENEW-2).",
    body:
      `<p>Renewal opens 30 days before the term ends and closes on its last day. A policy sold today runs for a year, so on the real clock a new policy cannot be renewed yet. This guide therefore shows the refusal. The success path is a gap: it needs a policy inside its window.</p>` +
      fig("sj6-form", {
        step: "SJ6",
        subs: { 1: "<b>Renew policy</b>: sends <code>POST /policies/&lt;reference&gt;/renewals</code> with the amount and payment method, which default from the current term." },
      }) +
      fig("sj6-refused", {
        step: "SJ6",
        see: "<em>What the API said</em> shows a problem banner: <em>A policy can be renewed from 2027-09-24 to 2027-10-24</em>, with the chip <code>RENEW-1/2</code> and a <b>422</b>. The timeline below stays unchanged: nothing was renewed.",
      }) +
      web("app/workbench/renew/RenewPolicy.tsx", /^export function RenewPolicy/, 8),
  }),
);

SJ.push(
  step("SJ7", "Inspect what you sent", {
    decide: "Which exchange to open.",
    gives: "The request log, newest first, and one exchange as it went over the wire, with a curl command to repeat it.",
    body:
      `<p>Every screen's requests drawer lists what this browser sent. <code>#/workbench/requests</code> lists all of them on one page.</p>` +
      fig("sj7-log", {
        step: "SJ7",
        subs: { 1: "A <b>path</b> in the log: <code>/policies/UIG-235PG-C/renewals</code>, the 422 from SJ6. Choose it to open the exchange." },
      }) +
      fig("sj7-exchange", {
        step: "SJ7",
        caption: "One exchange open: request, response, status line and the curl to repeat it",
        see: "The request body, the response headers and body (a problem JSON with <code>ruleId</code> <code>RENEW-1/2</code>), and under <em>Repeat it</em> a <code>curl</code> command with a <em>Copy curl</em> button. Run it in a terminal to get the same 422.",
      }) +
      web("app/workbench/requests/RequestLogPage.tsx", /^export function RequestLogPage/, 8),
  }),
);

SJ.push(
  step("SJ8", "When it goes wrong", {
    decide: "Whether to fix the input, retry, or stop.",
    gives: "A problem banner with the status, the rule id and each violation. When the API is down the page says no request was completed. Not-found and empty states say so.",
    body:
      table(
        ["What happened", "What you see", "Status and rule", "What to do"],
        [
          ["The form stops you", "A problem list, and no request in the log", "None sent", "Fix the field"],
          ["A business rule refuses", "The API's own words, each violation with its rule chip", "422, for example SELL-2", "Change the input to meet the rule"],
          ["A conflict", "The API's detail and the rule chip", "409, for example SELL-1", "Use another reference"],
          ["No such policy", "The API's not-found answer", "404, GET-1", "Check the reference"],
          ["The API is down", "<em>The API did not answer</em>, <em>No request was completed</em>", "No response", "Start the API, then Try again"],
          ["A page that does not exist", "<em>Not in this snapshot</em>, nothing guessed", "None", "Use the link home"],
        ],
      ) +
      `<h3>A 422: the rule refuses</h3>` +
      fig("sj8-send-anyway", {
        step: "SJ8",
        subs: {
          1: "<b>Send anyway</b> switch, On: it turns off the form's own checks, so you can see the API's answer to a bad request.",
          2: "<b>Sell this policy</b> with a start date in the past.",
        },
      }) +
      fig("sj8-problem", {
        step: "SJ8",
        see: "<em>Nothing was stored. The API answered 422, Start date outside the sale window.</em> The banner reads <em>The start date must be between 2026-10-25 and 2026-12-24</em> with the chip <code>SELL-2</code>. A 422 lists every violated rule.",
      }) +
      `<h3>A 4xx: the policy does not exist</h3>` +
      fig("sj8-404", {
        step: "SJ8",
        subs: { 1: "<b>Policy reference</b>: <code>NO-SUCH-1</code>. The API answers <b>404</b> (<code>GET-1</code>) and the page says so under <em>Request status</em>." },
      }) +
      `<h3>No answer, and empty states</h3>` +
      fig("sj8-unreachable", {
        step: "SJ8",
        subs: { 1: "<b>Try again</b>: the API did not answer. <em>No request was completed. Nothing was changed by this screen.</em> The raw error, <code>Failed to fetch</code>, is shown as it came." },
      }) +
      fig("sj8-empty-log", {
        step: "SJ8",
        subs: { 1: "The <b>request log</b>, empty: nothing has been sent, so it says so and invents no rows." },
      }) +
      fig("sj8-not-found", {
        step: "SJ8",
        subs: { 1: "<b>Go to the requirements matrix</b>: the not-found page names the path asked for, offers no guess, and gives a way home." },
      }) +
      callout("Why", "Choice: show the status the page received, and say plainly when none came. Alternative: translate every failure into a friendly message. Reason: a servicer who sees the API's own words and rule chip can tell a fault in the input from a fault in the service.") +
      svg("Honest states: what Docket shows when it has no answer", [[["Answer received", "status and body, as sent"], ["No answer", "\"No request was completed\""], ["Nothing to show", "\"not in this screen's data\""]]]) +
      web("app/workbench/ProblemView.tsx", /^export function ProblemView/, 8) +
      web("app/shell/NotFound.tsx", /^export function NotFound\(/, 6),
  }),
);

SJ.push(
  step("SJ9", "Make it yours", {
    decide: "The theme, and which link to share.",
    gives: "Light, dark and system themes from the header, and hash links that open any screen directly.",
    body:
      fig("sj9-light", {
        step: "SJ9",
        caption: "The Overview with the System choice, drawn in the light scheme",
        subs: { 1: "<b>Theme</b> control in the header: Light, Dark or System. <em>Step 1 Read the answer</em> printed on the page is the screen's own rung label, not this one." },
      }) +
      fig("sj9-dark", {
        step: "SJ9",
        caption: "The same screen after choosing Dark",
        subs: { 1: "<b>Theme</b>: <em>Dark</em> chosen. The choice sets <code>data-theme</code> on the page; System follows the operating system." },
      }) +
      `<p>Every screen has a hash URL, so a screen can be bookmarked or sent to a colleague. Copy the address bar, or use these shapes:</p>` +
      table(
        ["To open", "Link"],
        [
          ["A rule's evidence", "<code>#/rules/CANCEL-1b</code>"],
          ["A commit", "<code>#/commits/&lt;sha&gt;</code>"],
          ["A policy in the workbench", "<code>#/workbench/policies/&lt;reference&gt;</code>"],
          ["The request log", "<code>#/workbench/requests</code>"],
        ],
      ) +
      web("app/shell/Frame.tsx", /^function useAppliedTheme/, 12) +
      web("app/shell/App.tsx", /^export function App/, 8),
  }),
);

page.push(
  journey(
    "servicer",
    "Journey 1: the policy servicer, in the workbench",
    "From opening the workbench to a cancelled policy, a claim, a refused renewal and the requests behind them.",
    "You sell a policy, read it, quote a cancellation and cancel, record a claim, try a renewal, and read the requests you sent. At each step the workbench shows the status the API answered, never one it did not receive. Forms validate as you go, the refund is shown before you commit, every call is logged with a curl, and the rule behind each refusal is one click away.",
    SJ,
    [
      ["How do I see what a cancellation will refund before I commit?", "Quote the date on the cancel screen. It is read-only and shows each term's sum and rule."],
      ["What does Send anyway do?", "It turns off the form's own checks so the API's rule answer can be seen."],
      ["Why does a new policy refuse renewal?", "The window opens 30 days before the end date (RENEW-1, RENEW-2), a year away."],
      ["What does Docket give me that curl or Postman does not?", "Forms that validate as you go, the refund before you commit, every call logged with a curl, and the rule behind each refusal."],
    ],
  ),
);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// Journey 2: the assessor
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const AJ = [];
const vitest = R("vitest");
const playwright = R("playwright");
// The full run lists every test, so the guide shows its opening lines and its closing totals, and says what they were.
const pwLines = playwright.output.split("\n");
const pwTotals = pwLines.filter((l) => /^\s+\d+ (failed|flaky|skipped|did not run|passed)/.test(l));
const pwCount = (word) => Number((pwTotals.find((l) => l.includes(` ${word}`)) ?? "").trim().split(" ")[0]) || 0;
const pwSummary = `${pwLines.filter((l) => l.trim() && !l.startsWith(">")).slice(0, 1).join("\n")}\n…\n${pwTotals.join("\n")}`;
const pwResult = `Exit ${playwright.exit} after ${seconds(playwright)}: ${pwCount("passed")} passed, ${pwCount("failed")} failed, ${pwCount("flaky")} flaky.`;
const pwVerdict =
  playwright.exit === 0
    ? ""
    : callout(
        "This run did not pass",
        `On the machine that reprinted this guide the full run finished with exit ${playwright.exit}. The failures read in its output are timeouts on the live API (a POST that was not answered within its wait, or a page that did not load), and the same specs pass when run alone: <code>W1/wb-3</code>, <code>N3/busy-1</code>, <code>N4/honest-1</code> and <code>W1/wb-1</code> all passed. The cause of the full-run failures has not been established, and nothing in this guide was changed to hide it. Run the specs of the screen you changed, and treat a full-run failure as a finding to report.`,
        "error",
      );

AJ.push(
  step("AJ1", "What Docket is and where to start", {
    decide: "Which half is for you, and whether to run the app or read about it.",
    gives: "The overview with the counts, the about page that explains how to read the trail, who each half is for, and the deployment evidence.",
    body:
      table(
        ["Half", "For whom", "Reads", "Needs"],
        [
          ["Explorer, 17 screens", "Assessors and developers checking how the API was built", "<code>trace.json</code>", "Nothing running"],
          ["Workbench, 7 screens", "Servicers and testers trying the API", "The live API", "The API on its port"],
        ],
      ) +
      `<p>To see it in five minutes, follow SJ1: build the app, preview it, and open <code>#/</code>.</p>` +
      fig("aj1-overview", {
        step: "AJ1",
        subs: {
          1: "<b>Headline answer</b>: one sentence, counted from the trail, that answers <em>Was this really test-driven, and was the AI really checked?</em> At this capture it reads 29 of 29 rules list a red commit, 21 also list a green commit and 8 list none.",
          2: "<b>Receipt figures</b>: each figure names what it was counted from and links to that source. Counts are never added across rules.",
        },
        see: "The screen's own rung labels read <em>Step 1 Read the answer</em> and <em>Step 2 Check the figures</em>. Here they happen to match the red labels in order; the red labels are this guide's.",
      }) +
      fig("aj1-about", {
        step: "AJ1",
        subs: { 1: "<b>Provenance labels</b>: <em>generated</em> (a hook wrote it), <em>recorded</em> (stored verbatim) and <em>written</em> (a person's claim). Read the label before you weigh the value." },
        see: "The page's own <em>Step 2 Look up the terms</em> explains each status word.",
      }) +
      web("app/explorer/overview/Overview.tsx", /^export function Overview/, 8) +
      web("app/explorer/about/About.tsx", /^export function About/, 8) +
      why("Build a UI over the trail.", "Read the git log and the markdown files.", "Each rule is already joined to its requirement, tests, commits and verdicts, so one click replaces a search.") +
      callout(
        "Is the web part deployed?",
        "No. The Static Web App is evidence only and was never deployed. The hosting configuration is <a href=\"../../../infrastructure/web/staticwebapp.config.json#L1\">infrastructure/web/staticwebapp.config.json:1</a>; the Bicep module is <code>infrastructure/modules/staticwebapp.bicep</code>, and the pipeline's Web stage builds and tests the app. It was validated locally and <code>az</code> was never run.",
        "warn",
      ),
  }),
);

AJ.push(
  step("AJ2", "Is every rule evidenced?", {
    decide: "Which rule to look at, or whether to scan them all.",
    gives: "The requirements matrix: every rule against its requirement, its status, its tests at the node that built it, and its red and green commits.",
    body:
      fig("aj2-matrix", {
        step: "AJ2",
        subs: {
          1: "<b>Filters</b>: Status and Feature narrow the table. The count under them reads <em>Showing 29 of 29 rules</em>.",
          2: "<b>The SELL-1 row</b>: rule, title, feature, status, node, tests at the node (22 of 22), then the red and green commit links.",
        },
        see: "The screen's own rungs read <em>Step 1 Filter the matrix</em> and <em>Step 2 Read the table</em>; they match the red labels here.",
      }) +
      fig("aj2-matrix-end", {
        step: "AJ2",
        caption: "The matrix down to its last row and the scope note",
        see: "The last rows run to <code>COULD-3</code>. The page's own <em>Step 3 Test counts are per node</em> explains why a rule's count here can differ from its rule page: the matrix counts the tests at the node that built it, while the rule page lists every test traited with it.",
      }) +
      web("app/explorer/matrix/Matrix.tsx", /^export function Matrix/, 8),
  }),
);

AJ.push(
  step("AJ3", "Follow one rule", {
    decide: "CANCEL-1b, or any other rule.",
    gives: "The rule page: the requirement and its agreed interpretation, the red-before-green evidence rung by rung, the verification recipe, then a commit with its trailers.",
    body:
      fig("aj3-matrix-link", {
        step: "AJ3",
        subs: { 1: "The <b>CANCEL-1b</b> link in the matrix opens the rule page. Typing <code>CANCEL-1b</code> in the header's jump-to-search box and pressing Enter does the same." },
      }) +
      fig("aj3-rule", {
        step: "AJ3",
        subs: {
          1: "<b>Rule text and agreed interpretation</b>: cooling-off runs to start + 14 days, inclusive. The label <em>written</em> says a person wrote it.",
          2: "<b>Red before green</b>: the rungs read down from the requirement to the red test commits (3b7522d, 7bebd33), the QA step, David's sign-off and the merged pull request.",
        },
        see: "The screen's own rungs are <em>Step 1 Read the rule</em> and <em>Step 2 Red before green, rung by rung</em>; they match the red labels. The page is honest about a gap: it says <em>No green commit is recorded for CANCEL-1b</em> and that the trail does not list both a red and a green commit for it.",
      }) +
      fig("aj3-rule-end", {
        step: "AJ3",
        caption: "The rule page's end: verify it yourself, and the links out",
        subs: { 1: "<b>Verify it yourself</b>: for a rule whose trail has both a red and a green commit this rung gives the <code>git log</code> recipe that the Overview shows for SELL-1. For CANCEL-1b it says <em>not built yet</em>, because there is no green commit to name." },
        see: "The page's own rung labels at this end read <em>Step 5 Verify it yourself</em>, <em>Step 6 Loading a diff</em> and <em>Step 5 Links out, to GitHub</em>. They belong to the screen. Links out: the red commit, the pull request, the rule text and the matrix row.",
      }) +
      `<p>Follow a commit link, for example one of the builder's commits, to its page.</p>` +
      fig("aj3-commit", {
        step: "AJ3",
        subs: {
          1: "<b>Commit header and trailers</b>: the walkthrough row, the agent (<em>builder</em>), the TDD step (<em>green</em>) and each rule it names.",
          2: "<b>Trailer agent against hook agent</b>: what the commit says against what the harness saw. Here it reads <em>not recorded: no hook line logged this commit</em>, so no match is claimed.",
        },
        see: "The screen's own rungs are <em>Step 1 Read the commit</em> and <em>Step 2 Agent: the trailer against the hook</em>, then <em>Step 3 Diff</em> (loaded on demand) and <em>Step 4 Links out</em>.",
      }) +
      svg("Evidence chain: how a rule is proved", [[["Requirement", "docs/requirements.md"], ["Red commit", "a failing test"], ["Green commit", "the code that passes"], ["Verdict", "reviewer and security"]]]) +
      web("app/explorer/rule/Rule.tsx", /^export function Rule\(/, 8) +
      web("app/explorer/commit/Commit.tsx", /^export function Commit/, 8),
  }),
);

AJ.push(
  step("AJ4", "Was it built test-first?", {
    decide: "Which node to walk.",
    gives: "The plan as a picture, then the node, its walkthrough, its loop and its activity: red, stub and green commits in order.",
    body:
      fig("aj4-plan", {
        step: "AJ4",
        subs: {
          1: "<b>Plan header</b>: <em>Approved</em>, by whom and when, the requirements revision and the source file.",
          2: "<b>The plan picture</b>: nodes sit below the nodes they wait for. Choose the <code>F1</code> node.",
        },
        see: "The screen's own rungs are <em>Step 1 Read the answer</em> and <em>Step 2 Follow the plan</em>. The table under the picture says the same in words.",
      }) +
      fig("aj4-node", {
        step: "AJ4",
        subs: {
          1: "<b>Completeness banner</b>: <em>OK</em>, so the trail witnessed the node.",
          2: "<b>Rules this node covers</b>: SELL-1 to SELL-7, and the reviewer's coverage by round (A1 covered 6 of 7 and failed; A2 covered 7 of 7 and passed).",
        },
        see: "The screen's own rungs are <em>Step 1 Was the node witnessed by the trail?</em> and <em>Step 2 Rules this node covers</em>.",
      }) +
      fig("aj4-walkthrough", {
        step: "AJ4",
        subs: { 1: "<b>The first red commit</b>: row #3, <code>b716734</code>, the tester's failing test for SELL-1. The # is the walkthrough row, not a date. Rows #4 and #5 are the red tests for SELL-2 and SELL-3." },
        see: "The screen's own <em>Step 1 Follow the commits</em> is this table.",
      }) +
      fig("aj4-walkthrough-end", {
        step: "AJ4",
        caption: "The walkthrough to its last rows",
        see: "The sequence ends at #92. The closing rows are plan updates by <em>main</em>, QA results by the tester and a trail commit by <em>git</em>, tagged <em>TDD none</em>. One commit has no walkthrough number and is listed apart, oldest first. Red, stub and green commits sit earlier in the same list, in order; the builder's green commit for SELL-2 is #52.",
      }) +
      fig("aj4-loop", {
        step: "AJ4",
        subs: { 1: "<b>Attempt 1</b>, the first rung of the ladder: it ended in a security FAIL at A1. The markers read attempt then loop-log line, so <em>1·2</em> is attempt 1, line 2." },
        see: "The question on this tab is <em>Which gate failed, and did the attempt after it pass the same gate?</em>",
      }) +
      fig("aj4-activity", {
        step: "AJ4",
        subs: { 1: "<b>Agent filter</b>: choose an agent to narrow the lanes. The Tool, Attempt and Redaction filters sit beside it, and the page says <em>Showing 1253 of 1253 lines</em>." },
        see: "Below the filters is one lane per agent, the first being <em>main</em>, with one tick per commit in rung order. A text table beneath is the equivalent for the keyboard and screen readers.",
      }) +
      web("app/explorer/plan/Plan.tsx", /^export function Plan\(/, 8) +
      web("app/explorer/node/Node.tsx", /^export function Node\(/, 8) +
      web("app/explorer/walkthrough/Walkthrough.tsx", /^export function Walkthrough/, 8) +
      web("app/explorer/loop/Loop.tsx", /^export function Loop\(/, 8) +
      web("app/explorer/activity/Activity.tsx", /^export function Activity\(/, 8),
  }),
);

AJ.push(
  step("AJ5", "Read a verdict and its findings", {
    decide: "Whether a node passed, and which finding to follow.",
    gives: "The verdict, each finding with its priority and route, then the findings round and the commit that fixed each.",
    body:
      fig("aj5-verdict", {
        step: "AJ5",
        subs: { 1: "<b>The verdict's title and status</b>: <em>Reviewer verdict A1</em>, with <em>FAIL</em>, round A1 and attempt 1 beneath it. The label <em>recorded</em> further down says a hook stored the agent's words verbatim." },
      }) +
      fig("aj5-verdict-findings", {
        step: "AJ5",
        caption: "The verdict's findings, further down",
        subs: { 1: "The <b>Findings</b> heading. Its first link, <em>Open the findings round A1 and the commits that fixed it</em>, leads to the investigator's round." },
        see: "Findings R1, R2 and R3 are P1 (they fail the node), each with its rule, file and route (builder or tester).",
      }) +
      fig("aj5-finding", {
        step: "AJ5",
        subs: { 1: "<b>The round's title</b>: <em>Round A1: findings on node F1</em>. Its status warns that <em>5 of 7 have a fix commit recorded</em>; the page does not hide the two without one." },
      }) +
      fig("aj5-finding-end", {
        step: "AJ5",
        caption: "The findings round, the end: the commits that fixed it",
        subs: { 1: "<b>Fixed by</b>: the commits whose <code>Fixes-Finding</code> trailer names each finding, oldest first. I2 and I3 say <em>No fix commit recorded</em>." },
      }) +
      web("app/explorer/verdict/Verdict.tsx", /^export function Verdict/, 8) +
      web("app/explorer/finding/Finding.tsx", /^export function Finding/, 8),
  }),
);

AJ.push(
  step("AJ6", "The wider story", {
    decide: "What to read next: the sessions, the harness, the decisions or the numbers.",
    gives: "The sessions timeline, the agents and hooks of the harness, the human decisions with their evidence line, and the stats per agent and node.",
    body:
      fig("aj6-sessions", {
        step: "AJ6",
        caption: "Sessions, down to the latest day with one snapshot open",
        subs: { 1: "<b>One snapshot open</b>: its file, when it was saved, its plan and node, and the next action the hand-off named. It has its own URL, <code>#/sessions/&lt;file&gt;</code>." },
      }) +
      fig("aj6-harness", {
        step: "AJ6",
        caption: "The harness, down to its hooks",
        subs: { 1: "<b>Hooks and what each guards</b>: the hook file, the gate ids it names (or <em>none named</em>, not <em>unguarded</em>) and its purpose, as the file holds it." },
      }) +
      fig("aj6-decisions", {
        step: "AJ6",
        subs: { 1: "<b>The decisions page</b>, <em>Human decisions</em>. Its headline counts 85 recorded decision points, each pinned to a line of a node's loop log. Filter by kind, plan or node." },
        see: "The page says plainly that rulings are not recorded as loop events, so they are not listed here.",
      }) +
      fig("aj6-stats", {
        step: "AJ6",
        caption: "Stats, the end: what is not in the page's data",
        see: "A table of FAIL verdicts by node, round and agent, then two boxes marked <em>Not built yet</em>: commits per agent and elapsed time per node. They are gaps, drawn as gaps, not zeroes.",
      }) +
      web("app/explorer/sessions/Sessions.tsx", /^export function Sessions/, 8) +
      web("app/explorer/harness/Harness.tsx", /^export function Harness/, 8) +
      web("app/explorer/decisions/Decisions.tsx", /^export function Decisions/, 8) +
      web("app/explorer/stats/Stats.tsx", /^export function Stats\(/, 6),
  }),
);

// AJ7: behind the screens, with real output.
const tree = R("tree");
const testKinds = table(
  ["Kind", "Where", "What it proves", "Command"],
  [
    ["Unit and kit", `<code>${T}/unit</code>, <code>${T}/kit</code>`, "Components and screens render and behave, in jsdom", `<code>npm --prefix ${W} run test</code>`],
    ["End to end", `<code>${T}/e2e</code>`, "Each requirement against the running app and the live API", `<code>npm --prefix ${W} run e2e</code>`],
    ["Axe", `<code>e2e/U0b/a11y-1.spec.ts</code>, <code>e2e/W1/a11y-1.spec.ts</code>`, "WCAG 2.2 AA on every route, in both themes", "Part of the end-to-end run"],
    ["Parity", "<code>e2e</code> (<code>support/parity.ts</code>)", "Each screen's regions match the signed-off static screen", "Part of the end-to-end run"],
    ["Visual regression", `<code>${T}/e2e/regression</code>`, "Each screen's pixels match its baseline in <code>docs/ui/baselines</code>", "Part of the end-to-end run, on Windows"],
  ],
);

AJ.push(
  step("AJ7", "Behind the screens", {
    decide: "How deep to go.",
    gives: "The folder tree, the compiler and <code>trace.json</code>, the kit and its tokens, the design pipeline and the screen contracts, and the kinds of test, with a real run of each.",
    body:
      `<h3>The folder tree after U10</h3>` +
      `<p>The web project and its tests, as git tracks them. <code>dist</code>, <code>node_modules</code> and <code>test-results</code> appear after a build, an install or a test run and are git-ignored.</p>` +
      run([["List the folders (run on this checkout).", "git ls-tree --name-only HEAD <folder>/", "One block per folder.", tree.output]]) +
      `<h3>The compiler that builds <code>trace.json</code></h3>` +
      `<p><code>${W}/compiler</code> reads git and the trail files at one ref, scrubs private data, and writes <code>public/trace.json</code>. The explorer reads only that file. The dev server compiles it at start and answers 503 <em>compiling</em> until it is ready.</p>` +
      run([["Compile the trail (the step you ran in SJ1).", `npm --prefix ${W} run trace`, `Exit ${R("trace").exit} in ${seconds(R("trace"))}.`, head(R("trace").output, 8)]]) +
      web("compiler/index.ts", /^export interface CompileOptions/, 6) +
      `<h3>The kit and its tokens</h3>` +
      `<p><code>${W}/kit</code> holds the primitives, patterns and layouts that every screen is built from, with <code>tokens/tokens.css</code> for colour, type and spacing. This guide uses the same tokens, copied unedited into <code>docs/guides/assets</code>. <code>kitchen-sink.html</code> shows every component.</p>` +
      `<h3>The design pipeline, and why screens are contracts</h3>` +
      `<p><code>docs/ui</code> holds the pipeline: directions, concept, styles, mockups, then one static HTML per screen state in <code>docs/ui/screens</code>, with signed-off shots in <code>docs/ui/screens/_shots</code> and baselines in <code>docs/ui/baselines</code>.</p>` +
      why("Agree each screen as static HTML first, and test the app for parity against it.", "Design in the code.", "A reviewer can approve a screen without reading React, and a test fails when the app drifts from it.") +
      `<h3>Region tags</h3>` +
      `<p>Each section of a screen carries <code>data-region</code>, a slug, and <code>data-req</code>, the requirement ids it proves. Tests read them for parity, and <code>capture.mjs</code> reads them to measure this guide's red boxes.</p>` +
      web("app/shell/Rung.tsx", /^export function Rung\(/, 7) +
      svg("From git to the screen", [[["git and the trail", "commits, verdicts, findings"], ["compiler/", "npm run trace"], ["trace.json", "public/ and dist/"], ["Explorer", "reads it"]]]) +
      `<h3>How the screens are tested</h3>` +
      testKinds +
      `<h3>Run the unit tests and the end-to-end suite</h3>` +
      run([
        ["Run every unit and kit test once.", `npm --prefix ${W} run test`, `${vitest.exit === 0 ? "All files pass" : `Exit ${vitest.exit}`}. The run took ${seconds(vitest)} (one worker per file).`, lastLines(vitest.output, 12).replace(/^\s*\n/gm, "")],
        ["Run the end-to-end suite. It builds the app, starts it on 4170 and starts its own API with a fresh database. Stop any API on 5080 first.", `npm --prefix ${W} run e2e`, pwResult, pwSummary],
      ]) + pwVerdict,
  }),
);

AJ.push(
  step("AJ8", "Accessibility", {
    decide: "Whether you use the keyboard or a pointer, and which theme.",
    gives: "Keyboard paths to every control, light, dark and system themes, and an axe audit of every screen.",
    body:
      table(
        ["Key", "What it does"],
        [
          ["<kbd>/</kbd>", "Jump to the search box from anywhere on the page"],
          ["<kbd>Up</kbd> and <kbd>Down</kbd>, <kbd>Enter</kbd>, <kbd>Esc</kbd>", "Choose a match, open it, close the list"],
          ["<kbd>J</kbd> and <kbd>K</kbd>, <kbd>Tab</kbd>", "On rung screens: next and previous rung; Tab moves through the links in a rung"],
        ],
      ) +
      fig("aj8-focus-light", {
        step: "AJ8",
        subs: { 1: "The <b>System</b> button of the theme control, the chosen one. Move to the control with <kbd>Tab</kbd>; its focus ring shows more clearly in the dark shot below. The page's own <em>Step 1 Filter the matrix</em> is its rung label, not this one." },
      }) +
      fig("aj8-focus-dark", {
        step: "AJ8",
        caption: "The same control after choosing Dark",
        subs: { 1: "The <b>Dark</b> button of the theme control, with its focus ring. Contrast holds in both themes: the audit runs in each." },
      }) +
      `<h3>What axe checks</h3>` +
      `<p>The Playwright suites run axe at WCAG 2.2 AA on every route the app builds, in light and dark, at 1440 and 390 pixels wide. The same specs check that every control is reachable by keyboard, that focus is visible, and that a status is never shown by colour alone. The activity lanes carry a text table as their equivalent.</p>` +
      extract(`${T}/e2e/U0b/support/app.ts`, /^export async function axeViolations/, 6) +
      web("app/shell/Frame.tsx", /^export function Frame/, 8) +
      extract(`${W}/kit/patterns/search/Search.tsx`, /if \(event\.key !== shortcut/, 5),
  }),
);

page.push(
  journey(
    "assessor",
    "Journey 2: the assessor, in the explorer",
    "From one question, <em>was this really test-driven?</em>, to a rule's commits, a node's loop, a verdict's findings and the tests behind the screens.",
    "You start at the overview's one-sentence answer, test it against the matrix, follow one rule from requirement to commit, walk a node, read a verdict, and look at the wider record. The last two steps go behind the screens: how the data is compiled and tested, and how the app serves a keyboard and both themes. Each rule is joined to its requirement, tests, commits and verdicts, so one click replaces a search.",
    AJ,
    [
      ["Is every rule evidenced?", "The matrix lists every rule with its requirement, tests and commits. Where a commit is missing the page says so."],
      ["How do I check one rule?", "Open its rule page: requirement, red-before-green rungs, verification recipe and links out."],
      ["How do I see the build was test-first?", "A node's walkthrough lists its commits in order, tagged red, stub or green."],
      ["How do I read a failed verdict?", "Open the verdict, then its findings round and the commits whose <code>Fixes-Finding</code> trailers name each finding."],
    ],
  ),
);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// Run the tests yourself (MAN-1, MAN-5, MAN-6, MAN-7)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const vitestOne = R("vitestOne");
const playwrightOne = R("playwrightOne");
const postmanTable = table(
  ["Folder", "Requests", "Rule ids"],
  postmanFolders.map((f) => [esc(f.name), String(f.requests), f.ids.map((i) => `<span class="chip">${esc(i)}</span>`).join(" ")]),
);

page.push(
  section(
    "run-tests",
    "Run the tests yourself",
    "Postman for the API's requests, Playwright for the screens, Vitest for the units.",
    "The workbench sends the same requests the Postman collection sends. Every runner is below with its command and a real result. Run each from the directory it names. Visual Studio and <code>dotnet test</code> are in the API user guide.",
    svg("What each runner needs first", [[["Vitest", "nothing running"], ["Playwright", "starts its own app and API"], ["Postman", "the API on 5080"]]]) +
      `<h3>Postman app (MAN-1)</h3>` +
      run([
        ["Import <code>tests/postman/Uinsure.Policies.postman_collection.json</code> and <code>tests/postman/local.postman_environment.json</code> with Import.", "", "The collection and the <em>local</em> environment appear in the sidebar.", ""],
        ["Select the <em>local</em> environment, start the API on 5080, and open the collection's Runner.", "", "The Runner lists the requests in folder order.", ""],
        ["Run the whole collection, one folder, or one request. Each test name starts with its rule id.", "", "Green ticks per request; a red cross names the failing assertion.", ""],
      ]) +
      `<p>The folders, and the rule ids their requests prove, read from the collection:</p>` +
      postmanTable +
      `<h3>Postman CLI (MAN-2)</h3>` +
      run([
        ["Run one folder against the running API. No login is needed.", `postman collection run tests/postman/Uinsure.Policies.postman_collection.json -e tests/postman/local.postman_environment.json -i "F2 Retrieve"`, "A summary table. The counts are requests, scripts and assertions executed and failed.", out.postman],
      ]) +
      callout("Provenance", `This output was captured on the F8 run of 2026-10-23, against the same collection (${esc(out.postmanTime)}), with the base URL overridden to the API port in use then. The Postman CLI could not start on the machine that reprinted this guide: it stopped with a Private Cloud manifest error from the machine's registry policy. No Postman app screenshot was taken.`, "warn") +
      `<h3>Playwright (MAN-5)</h3>` +
      `<p>Run these from <code>${W}</code>. The runner finds the config there, and the reports land beside it.</p>` +
      run([
        ["Install the browser once.", "npx playwright install chromium", "Chromium is downloaded to the Playwright cache.", ""],
        ["Run everything. It builds the app and starts it, and starts its own API.", "npm run e2e", `The same run as AJ7. ${pwResult}`, pwTotals.join("\n")],
        ["Run one spec, and one test by a rule id or screen name with <code>-g</code>.", R("playwrightOne").command, `Exit ${playwrightOne.exit} in ${seconds(playwrightOne)}.`, lastLines(playwrightOne.output, 8)],
        ["Watch it run: UI mode, a visible browser, or the step-by-step debugger.", "npx playwright test --ui\nnpx playwright test --headed\nnpx playwright test --debug", "Not run for this guide (interactive).", ""],
        ["Write an HTML report with traces, then open it. In the report, open a test and choose its trace to step through it.", "npx playwright test --reporter=html --trace on", "Not run for this guide. Then, as its own command:", ""],
        ["Open the report.", "npx playwright show-report", "The report opens in the browser.", ""],
        ["Run the visual-regression suite on its own.", "npx playwright test regression/", "Each screen's pixels are compared with its baseline in <code>docs/ui/baselines</code>.", ""],
      ]) +
      callout("Update baselines only on purpose", "The baselines are Windows renders and are signed off with the screens, so the regression folder is skipped on Linux. Update them only deliberately, with <code>npx playwright test regression/ --update-snapshots</code>, after a signed-off design change. Never update one to make a failure go away.", "warn") +
      `<h3>Vitest (MAN-6)</h3>` +
      run([
        ["Run every unit and kit test once.", `npm --prefix ${W} run test`, `${vitest.exit === 0 ? "All files pass" : `Exit ${vitest.exit}`} in ${seconds(vitest)}.`, lastLines(vitest.output, 8).replace(/^\s*\n/gm, "")],
        ["Run one file: a name fragment filters the files. Run from <code>" + W + "</code>.", vitestOne.command, `Exit ${vitestOne.exit} in ${seconds(vitestOne)}.`, lastLines(vitestOne.output, 8).replace(/^\s*\n/gm, "")],
        ["Watch mode: it reruns the tests that a file change touches. Press <kbd>q</kbd> to quit.", "npx vitest --config vite.config.ts", "Not run for this guide (interactive).", ""],
      ]) +
      `<h3>Every runner (MAN-7)</h3>` +
      table(
        ["Runner", "What it tests", "Use when", "Command or click", "Needs running first", "Time"],
        [
          ["Postman app", "The API's requests, by rule id", "Exploring the API by hand", "Collection Runner", "The API on 5080", "Shown by the Runner itself"],
          ["Postman CLI", "The same requests", "Scripted checks", "<code>postman collection run …</code>", "The API on 5080", esc(out.postmanTime)],
          ["Playwright, all", "Screens, axe, parity, regression", "Before a UI change lands", "<code>npm run e2e</code>", "Nothing: it starts its own", seconds(playwright)],
          ["Playwright, one spec", "One requirement's specs", "While fixing one screen", "<code>npx playwright test W1/wb-1 -g \"WB-1\"</code>", "Nothing: it starts its own", seconds(playwrightOne)],
          ["Vitest, all", "Units and the kit", "While coding", "<code>npm run test</code>", "Nothing", seconds(vitest)],
          ["Vitest, one file", "One file's tests", "While coding one component", "<code>npx vitest run … &lt;name&gt;</code>", "Nothing", seconds(vitestOne)],
        ],
      ),
    [
      ["Which runner needs the API already running?", "Postman, the app or the CLI. Playwright starts its own API, so stop any API on 5080 first."],
      ["How do I run just one screen's test?", "<code>npx playwright test regression/matrix</code> for its baseline, or <code>-g</code> with its rule id for its specs."],
      ["When may I update a visual baseline?", "Only deliberately, with <code>--update-snapshots</code>, after a signed-off design change."],
      ["Where are the .NET suites?", "In the API user guide: Visual Studio's Test Explorer and <code>dotnet test</code>."],
    ],
  ),
);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// TJ1: troubleshooting (LRN-11)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const TJ = step("TJ1", "Troubleshooting", {
  decide: "Which symptom you have.",
  gives: "The cause and the fix, from the problems met while building Docket and this guide: the trail's findings, <code>docs/lessons.md</code> and the capture runs.",
  body: table(
    ["Symptom", "Cause", "Fix"],
    [
      ["The workbench says <em>The API did not answer</em>", "The API is not running, or <code>DOCKET_API_PORT</code> names the wrong port", "Start the API on its http profile; set <code>DOCKET_API_PORT</code> to its port and restart the preview"],
      ["Explorer screens say the data is not available", "<code>trace.json</code> was not compiled", `<code>npm --prefix ${W} run trace</code>, then rebuild`],
      ["On the dev server the explorer says the trail is compiling", "The server answers 503 <em>compiling</em> until the compile ends (lessons, bug-002/N1)", "Wait for Vite's <em>Local:</em> line, then reload"],
      ["<code>Packages are not restored</code> when starting the dev server", "A fresh clone has no <code>node_modules</code>", `<code>npm --prefix ${W} ci</code>, then start again`],
      ["Port 4170 is in use", "The dev server uses <code>--strictPort</code>", "Stop the other process, or pass another <code>--port</code>"],
      ["<code>DOCKET_API_PORT=5080 npm …</code> is not recognised", "PowerShell does not take a variable prefix", "Use Git Bash, or set <code>$env:DOCKET_API_PORT</code> first"],
      ["The end-to-end run stops before any test with a setup fault", "An API that this run did not start is already answering on the port", "Stop the API on 5080, then run again"],
      ["The full end-to-end run fails many tests with <em>POST /api/policies is answered</em> or a 90 s timeout", "The tests wait on the live API and it did not answer in time. Seen on the reprint machine; the cause is not established, and the same specs pass alone", "Run the specs of the screen you changed (<code>W1/wb-3</code>, <code>N3/busy-1</code>) and report the full-run failure as a finding"],
      ["Playwright says the browser is missing", "Chromium is not installed", "<code>npx playwright install chromium</code>"],
      ["Visual regression fails on Linux or macOS", "The baselines are Windows renders; Linux skips the folder", "Run on Windows; update baselines only deliberately"],
      ["A rule's count differs between the matrix and its rule page", "The matrix counts the tests at the node that built the rule; the rule page lists every test traited with it", "Expected: the matrix's own <em>Step 3</em> explains it"],
      ["A rule page says no green commit is recorded", "The trail lists no green commit for that rule; the page does not invent one", "Read the red commits, the QA step and the sign-off; this is a gap in the trail, not in the page"],
      ["Renew answers 422 on a new policy", "RENEW-1 and RENEW-2: the window opens 30 days before the end date", "Expected; renew inside the window"],
      ["A sell answers 409", "SELL-1: the reference already exists, in any letter case", "Use a new reference"],
      ["The request log is empty after a reload", "It lists the requests since the page opened", "Send the request again"],
      ["The Postman CLI stops with a Private Cloud manifest error", "A registry policy on the machine names a manifest the CLI cannot read", "Ask whoever manages the machine, or use the Postman app"],
    ],
  ) + check([
    ["The workbench says no answer. What do I check first?", "That the API is running on the port <code>DOCKET_API_PORT</code> names."],
    ["Why does the end-to-end run refuse to start?", "An API it did not start is already on the port, so its database cannot be known to be fresh."],
    ["Is a rule page with no green commit a defect in Docket?", "No. It reports a gap in the trail, and says so."],
  ]),
});
page.push(`<section id="troubleshooting"><h2>Troubleshooting</h2><p class="headline">Most problems are a missing API, a missing trace or a missing browser.</p><p class="summary">Each row is a problem met while building Docket or this guide.</p><ol class="steps">${TJ}</ol></section>`);

page.push(`</body>\n</html>\n`);

// Every shot in the manifest is used, once.
const unused = manifest.shots.map((s) => s.id).filter((id) => !used.has(id));
assert.deepEqual(unused, [], `shots not used: ${unused.join(", ")}`);

const html = page.join("\n");
writeFileSync(join(here, "index.html"), html);
console.log(`Wrote index.html (${html.length} bytes, ${used.size} shots)`);
