// Guide checks for the API user guide (F7, failure route A1).
// Run: node --test tests/guides/api-guide.test.mjs
//
// Each test reproduces one finding of docs/trace/build/F7/findings/A1.md and names it (<rule> <round>/<id>).
// Conventions read from the sources themselves:
// - receipts.md records each command it ran on a line `Command: \`<the command, verbatim>\``.
// - In the guide, a `…` inside a command or an output marks text left out (index.html, section 3 summary).
//   `…words…` is one elision, so the words between two ellipses are a description, not literal text.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (path) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

const guidePath = "docs/guides/api/index.html";
const receiptsPath = "docs/guides/api/receipts.md";

const VOID = new Set(["meta", "link", "br", "img", "hr", "input", "source", "wbr"]);
const RAW = new Set(["pre", "script", "style"]);

function lineAt(text, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

function parseAttrs(raw) {
  const attrs = {};
  for (const m of raw.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) attrs[m[1].toLowerCase()] = m[2];
  return attrs;
}

// A small tag scanner, enough for the guide's own markup: every start tag with its attributes, its line,
// its open ancestors, and (for pre, script, style) its raw inner text.
function scan(html) {
  const elements = [];
  const stack = [];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)\b([^>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].startsWith("<!--")) continue;
    const [, closing, rawName, rawAttrs, selfClosing] = m;
    const name = rawName.toLowerCase();
    if (closing) {
      const i = stack.map((e) => e.name).lastIndexOf(name);
      if (i >= 0) stack.length = i;
      continue;
    }
    const el = { name, attrs: parseAttrs(rawAttrs), line: lineAt(html, m.index), start: m.index, ancestors: stack.slice() };
    elements.push(el);
    if (RAW.has(name)) {
      const end = html.indexOf(`</${name}>`, re.lastIndex);
      el.inner = html.slice(re.lastIndex, end);
      re.lastIndex = end + name.length + 3;
      continue;
    }
    if (!selfClosing && !VOID.has(name)) stack.push(el);
  }
  return elements;
}

const classes = (el) => (el.attrs.class ?? "").split(/\s+/).filter(Boolean);
const hasClass = (el, c) => classes(el).includes(c);
const within = (el, name, c) => el.ancestors.some((a) => a.name === name && (c === undefined || hasClass(a, c)));

const decode = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// A shown text with `…` elisions as a pattern: each elision (and the space around it) matches any text.
function elisionPattern(shown, anchored) {
  const body = shown.split(/\s*…(?:[^…]*…)?\s*/).map(escapeRe).join("[\\s\\S]*?");
  return new RegExp(anchored ? `^${body}$` : body);
}

const pres = (html) => scan(html).filter((el) => el.name === "pre");

// The commands the guide tells the reader to run: every line of a <pre> that is not captured output and
// not a code extract.
function guideCommands(html) {
  return pres(html)
    .filter((el) => !hasClass(el, "output") && !within(el, "div", "extract"))
    .flatMap((el) =>
      decode(el.inner)
        .split("\n")
        .map((text, i) => ({ text: text.trim(), line: el.line + i }))
        .filter((c) => c.text !== ""),
    );
}

const receiptCommands = (md) => [...md.matchAll(/^Command:\s*`(.+)`\s*$/gm)].map((m) => m[1]);

const isReceipted = (shown, receipted) => receipted.some((r) => elisionPattern(shown, true).test(r));

test("LRN-5 A1/I1: every curl command in the guide is well formed and is a receipted command", () => {
  const curls = guideCommands(read(guidePath)).filter((c) => c.text.startsWith("curl "));
  assert.ok(curls.length > 0, "the guide shows curl commands");

  const glued = curls.filter((c) => /(^|\s)-i(?!\s|$)/.test(c.text)).map((c) => `index.html:${c.line} ${c.text.slice(0, 40)}`);
  assert.deepEqual(glued, [], "a curl flag `-i` must be followed by a space (`-ihttp` prints curl's help, `-i-X` is an unknown option)");

  const receipted = receiptCommands(read(receiptsPath));
  const unreceipted = curls.filter((c) => !isReceipted(c.text, receipted)).map((c) => `index.html:${c.line} ${c.text.slice(0, 60)}`);
  assert.deepEqual(unreceipted, [], "every curl command shown must match a `Command:` line in receipts.md");
});

const squash = (s) => s.trim().replace(/\s+/g, " ");

test("LRN-5 A1/I2: every line of every captured output in the guide appears in receipts.md", () => {
  const receiptLines = read(receiptsPath).split("\n").map(squash).filter(Boolean);
  const outputs = pres(read(guidePath)).filter((el) => hasClass(el, "output"));
  assert.ok(outputs.length > 0, "the guide shows captured outputs");

  const missing = outputs.flatMap((el) =>
    decode(el.inner)
      .split("\n")
      .map((text, i) => ({ text: squash(text), line: el.line + i }))
      .filter((o) => o.text !== "")
      .filter((o) =>
        o.text.includes("…")
          ? !receiptLines.some((r) => elisionPattern(o.text, false).test(r))
          : !receiptLines.some((r) => r.includes(o.text)),
      )
      .map((o) => `index.html:${o.line} ${o.text.slice(0, 60)}`),
  );
  assert.deepEqual(missing, [], "every output line shown must be copied from a receipts.md entry");
});

// A recorded HTTP response: a status line, or a `-w` line such as "openapi status 200".
const isResponseLine = (line) => /^HTTP\/\d(\.\d)? \d{3}\b/.test(line) || /^\w+ status \d{3}$/.test(line);

test("LRN-5 A1/I3: every response recorded in receipts.md has its own curl command, verbatim", () => {
  const lines = read(receiptsPath).split("\n").map((l) => l.trim());
  const vague = lines.filter((l) => /^Command:\s*`curl against\b/.test(l));
  assert.deepEqual(vague, [], "a receipt names the exact command run, not 'curl against <host>'");

  const responses = lines.map((l, i) => ({ l, i })).filter(({ l }) => isResponseLine(l));
  assert.ok(responses.length > 0, "receipts.md records HTTP responses");

  const orphans = [];
  for (const { l, i } of responses) {
    let j = i - 1;
    while (j >= 0 && !lines[j].startsWith("Command:") && !isResponseLine(lines[j])) j--;
    const command = j >= 0 && lines[j].match(/^Command:\s*`(.+)`\s*$/);
    if (!command || !/^curl\s.*https?:\/\/\S+/.test(command[1])) orphans.push(`receipts.md:${i + 1} ${l}`);
  }
  assert.deepEqual(orphans, [], "each recorded response is preceded by its own `Command: \\`curl … <url>\\`` line");
});

test("LRN-5 A1/I4: every non-curl command in the guide is exactly a receipted command", () => {
  const commands = guideCommands(read(guidePath)).filter((c) => !c.text.startsWith("curl "));
  assert.ok(commands.length > 0, "the guide shows dotnet, postman, node and bicep commands");

  const receipted = receiptCommands(read(receiptsPath));
  const unreceipted = commands.filter((c) => !isReceipted(c.text, receipted)).map((c) => `index.html:${c.line} ${c.text}`);
  assert.deepEqual(unreceipted, [], "every command shown must be the command that was run, as receipts.md records it");
});

test("LRN-3 A1/I7: no list outside the front sheet has more than four items", () => {
  const elements = scan(read(guidePath));
  const lists = elements.filter((el) => (el.name === "ol" || el.name === "ul") && !within(el, "section", "front"));
  assert.ok(lists.length > 0, "the guide has lists");

  const long = lists
    .map((list) => ({ list, items: elements.filter((el) => el.name === "li" && el.ancestors.at(-1) === list).length }))
    .filter(({ items }) => items > 4)
    .map(({ list, items }) => `index.html:${list.line} ${list.name}.${classes(list).join(".")} has ${items} items`);
  assert.deepEqual(long, [], "lists have three items, or four at most; longer ones are grouped under labels");
});

test("A1/I8: the API guide spec states its real question count and a receipts path that exists", () => {
  const spec = read("docs/specs/api-guide.spec.md");
  const rows = [...spec.matchAll(/^\| [ADU]\d+ \|/gm)].length;
  assert.ok(rows > 0, "the spec has a question bank");

  const stated = [
    ...[...spec.matchAll(/(?<!at least )\b(\d+) questions\b/g)].map((m) => `"${m[0]}"`),
    ...[...spec.matchAll(/\bMet at (\d+)\b/g)].map((m) => `"${m[0]}"`),
  ];
  assert.ok(stated.length > 0, "the spec states its question count");
  const wrong = stated.filter((s) => Number(s.match(/\d+/)[0]) !== rows);
  assert.deepEqual(wrong, [], `the question bank has ${rows} rows, so every stated count must be ${rows}`);

  const paths = [...new Set([...spec.matchAll(/\bdocs\/[\w./-]*receipts\.md\b/g)].map((m) => m[0]))];
  assert.ok(paths.length > 0, "the spec names where the receipts are written");
  const absent = paths.filter((p) => !existsSync(resolve(root, p)));
  assert.deepEqual(absent, [], "every receipts path the spec names exists");
});
