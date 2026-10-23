// Usage: node docs/guides/print.mjs <api|ui|test>
// Prints docs/guides/<guide>/index.html to A4 PDF with Playwright's Chromium (STY-5, no new dependency).
// Playwright is resolved from PLAYWRIGHT_MODULE (the playwright package directory), else the web project's node_modules.
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const guidesDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(guidesDir, "..", "..");
const outputs = { api: "API_UserGuide.pdf", ui: "UI_UserGuide.pdf", test: "docs/guides/test/test.pdf" };

const guide = process.argv[2];
if (!(guide in outputs)) {
  console.error("Usage: node docs/guides/print.mjs <api|ui|test>");
  process.exit(2);
}

const candidates = [
  process.env.PLAYWRIGHT_MODULE && resolve(process.env.PLAYWRIGHT_MODULE),
  join(root, "src/Uinsure.Policies.Web/node_modules/playwright"),
  join(root, "src/web/node_modules/playwright"),
].filter(Boolean);
const found = candidates.find((dir) => existsSync(join(dir, "package.json")));
if (!found) {
  console.error("Playwright not found. Run `npm --prefix src/web ci` (`src/Uinsure.Policies.Web` after the ui plan's U10 rename), or set PLAYWRIGHT_MODULE.");
  process.exit(2);
}
const { chromium } = createRequire(join(found, "package.json"))(found);

const source = join(guidesDir, guide, "index.html");
const target = join(root, outputs[guide]);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(source).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
// Relative hrefs resolve to file:// URLs and would embed the local checkout path in the PDF's link annotations (privacy, §8.6).
await page.evaluate(() => document.querySelectorAll("a[href]").forEach((a) => a.removeAttribute("href")));
const title = await page.title();
const style = "font-family: sans-serif; font-size: 8px; color: #555b62; width: 100%; padding: 0 16mm;";
await page.pdf({
  path: target,
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: `<div style="${style}">${title}</div>`,
  footerTemplate: `<div style="${style} text-align: right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
  margin: { top: "22mm", bottom: "18mm", left: "16mm", right: "16mm" },
});
await browser.close();
console.log(`Printed ${guide} to ${outputs[guide]}`);
