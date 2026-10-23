// Copies captured output from receipts.md into index.html, so outputs are never retyped.
// Usage: node docs/guides/api/fill-guide.mjs
// Every <pre class="output" data-receipt="ID"> gets the fenced output of the receipts.md entry "## ID ...",
// minus the "(excerpt: ...)" note line, HTML-escaped.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const receipts = readFileSync(join(here, "receipts.md"), "utf8").replace(/\r\n/g, "\n");
const guidePath = join(here, "index.html");
let html = readFileSync(guidePath, "utf8");

const output = (id) => {
  const entry = receipts.split(/^## /m).find((s) => s.startsWith(`${id} `));
  if (!entry) throw new Error(`no receipt ${id}`);
  const fenced = entry.match(/```text\n([\s\S]*?)\n```/);
  if (!fenced) throw new Error(`receipt ${id} has no output`);
  return fenced[1]
    .split("\n")
    .filter((line) => !line.startsWith("(excerpt:"))
    .join("\n")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

html = html.replace(
  /(<pre class="output" data-receipt="(\w+)">)[\s\S]*?(<\/pre>)/g,
  (_, open, id, close) => `${open}${output(id)}${close}`,
);
writeFileSync(guidePath, html);
console.log("filled");
