// Coverage check for both guides (LRN-14, docs/specs/guide-format.spec.md "Journeys and the coverage map").
// Run: node --test docs/guides/coverage.test.mjs   (beside: node --test docs/guides/api/check.test.mjs)
//
// Each guide spec holds one fenced block with the info string `coverage`. Each line that is not blank and does not
// start with `#` reads `feature-id | requirement ref | step id | feature`. The check fails on:
//   - a feature whose step id is not an `li.step` id in the guide's HTML;
//   - a step in the guide's HTML with no feature line;
//   - a step in the spec's outline tables with no feature line (so the map is complete before the HTML exists);
//   - an item of docs/documentation-requirements.md section 6 (API guide) or 7 (UI guide) with no line;
//   - for the UI guide, a screen folder under docs/ui/screens (not starting with `_`) with no `T-<folder>` line,
//     and a `T-` line whose folder does not exist.
// A requirement ref is `<section number> <word>`; the word must start one of the words of the item's bold label
// (for example `7 tour` for "A tour, screen by screen.").
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (path) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

const guides = [
  { name: "api", spec: "docs/specs/api-guide.spec.md", html: "docs/guides/api/index.html", section: 6 },
  { name: "ui", spec: "docs/specs/ui-guide.spec.md", html: "docs/guides/ui/index.html", section: 7, screens: "docs/ui/screens" },
];

/** The coverage block of a spec, as [{ id, ref, step, feature, line }]. */
function coverageOf(specPath) {
  const text = read(specPath);
  const block = /^```coverage\n([\s\S]*?)^```/m.exec(text);
  assert.ok(block, `${specPath} has no fenced block with the info string "coverage"`);
  const firstLine = text.slice(0, block.index + "```coverage\n".length).split("\n").length;
  const rows = [];
  block[1].split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) return;
    const cells = line.split(" | ").map((c) => c.trim());
    assert.equal(cells.length, 4, `${specPath}:${firstLine + i}: expected "feature-id | requirement ref | step id | feature", got "${line}"`);
    rows.push({ id: cells[0], ref: cells[1], step: cells[2], feature: cells[3], line: firstLine + i });
  });
  return rows;
}

/** The ids of every li.step in a guide's HTML. */
function stepIdsOf(htmlPath) {
  if (!existsSync(resolve(root, htmlPath))) return [];
  const html = read(htmlPath);
  const ids = [];
  for (const m of html.matchAll(/<li\b([^>]*)>/g)) {
    const cls = /\bclass\s*=\s*"([^"]*)"/.exec(m[1])?.[1] ?? "";
    const id = /\bid\s*=\s*"([^"]*)"/.exec(m[1])?.[1];
    if (id && cls.split(/\s+/).includes("step")) ids.push(id);
  }
  return ids;
}

/** The steps named in the spec's outline tables: rows that start `| XJn |`. */
function outlineStepsOf(specPath) {
  return [...read(specPath).matchAll(/^\| ([A-Z]J\d+) \|/gm)].map((m) => m[1]);
}

/** The top-level items of a section of the requirements: [{ n, label }], label being the first bold run. */
function itemsOf(section) {
  const text = read("docs/documentation-requirements.md");
  const start = text.search(new RegExp(`^## ${section}\\. `, "m"));
  assert.ok(start >= 0, `docs/documentation-requirements.md has no section ${section}`);
  const rest = text.slice(start + 1);
  const end = rest.search(/^## /m);
  const body = end < 0 ? rest : rest.slice(0, end);
  const items = [];
  for (const m of body.matchAll(/^- \*\*(.+?)\*\*/gm)) items.push({ n: items.length + 1, label: m[1] });
  return items;
}

const words = (label) => label.toLowerCase().match(/[a-z]+/g) ?? [];

for (const g of guides) {
  const rows = coverageOf(g.spec);

  test(`LRN-14 ${g.name}: the coverage block is well formed, with unique feature ids`, () => {
    const seen = new Map();
    const dup = [];
    for (const r of rows) {
      if (seen.has(r.id)) dup.push(`${r.id} (lines ${seen.get(r.id)} and ${r.line})`);
      seen.set(r.id, r.line);
    }
    assert.deepEqual(dup, [], `duplicate feature ids in ${g.spec}`);
    const badStep = rows.filter((r) => !/^[A-Z]J\d+$/.test(r.step)).map((r) => `${r.id} -> "${r.step}"`);
    assert.deepEqual(badStep, [], `step ids must look like SJ3 in ${g.spec}`);
  });

  test(`LRN-14 ${g.name}: every step in the spec's outline has a feature line`, () => {
    const mapped = new Set(rows.map((r) => r.step));
    const missing = outlineStepsOf(g.spec).filter((s) => !mapped.has(s));
    assert.deepEqual(missing, [], `${g.spec}: steps with no feature line`);
  });

  test(`LRN-14 ${g.name}: every feature's step id is a step in ${g.html}`, () => {
    const present = new Set(stepIdsOf(g.html));
    const missing = rows.filter((r) => !present.has(r.step)).map((r) => `${r.id} (${r.feature}) -> ${r.step}`);
    assert.deepEqual(missing, [], `${g.html}: features whose step is not an li.step id (${present.size} steps found)`);
  });

  test(`LRN-14 ${g.name}: every step in ${g.html} has a feature line`, () => {
    const mapped = new Set(rows.map((r) => r.step));
    const orphan = stepIdsOf(g.html).filter((s) => !mapped.has(s));
    assert.deepEqual(orphan, [], `${g.html}: steps with no feature`);
  });

  test(`LRN-14 ${g.name}: every item of requirements section ${g.section} has a line`, () => {
    const items = itemsOf(g.section);
    assert.ok(items.length > 0, `no items found in section ${g.section}`);
    const refs = rows.filter((r) => r.ref.startsWith(`${g.section} `)).map((r) => r.ref.slice(String(g.section).length + 1).trim().toLowerCase());
    const missing = items
      .filter((item) => !refs.some((word) => words(item.label).some((w) => w.startsWith(word))))
      .map((item) => `section ${g.section}, item ${item.n}: ${item.label}`);
    assert.deepEqual(missing, [], `${g.spec}: requirement items with no line`);
  });

  if (g.screens) {
    test(`LRN-14 ${g.name}: every screen folder has a T- line, and every T- line has a folder`, () => {
      const dir = resolve(root, g.screens);
      const folders = readdirSync(dir).filter((f) => !f.startsWith("_") && statSync(resolve(dir, f)).isDirectory());
      const tour = new Set(rows.filter((r) => r.id.startsWith("T-")).map((r) => r.id.slice(2)));
      const noLine = folders.filter((f) => !tour.has(f)).map((f) => `folder ${f} has no T-${f} line`);
      const noFolder = [...tour].filter((t) => !folders.includes(t)).map((t) => `T-${t} has no folder under ${g.screens}`);
      assert.deepEqual([...noLine, ...noFolder], [], "screen folders and tour lines differ");
    });
  }
}
