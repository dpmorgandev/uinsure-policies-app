// Runs the commands the UI guide shows, on this checkout, and records each one's real output in run-output.json.
// build.mjs copies from that file; nothing in the guide's outputs is typed by hand (documentation-requirements section 8.3).
//
// Usage: node docs/guides/ui/run-receipts.mjs <step>...      steps: tree trace build vitest vitest-one serve playwright playwright-one
//        (no step runs the quick ones: tree trace build vitest vitest-one serve)
//
// An entry is { command, cwd, seconds, output, exit }. The checkout's absolute path is replaced by <repo> in every output
// (the guide is public), and the time is the wall clock of the whole command.
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..", "..");
const web = "src/Uinsure.Policies.Web";
const file = join(here, "run-output.json");
const receipts = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};

const slash = (p) => p.replace(/\\/g, "/");
const scrub = (text) => {
  let out = text.replace(/\u001b\[[0-9;]*[A-Za-z]/g, "").replace(/\r\n/g, "\n");
  const forms = new Set([root, slash(root), slash(root).replace(/^([A-Za-z]):/, (_, d) => `/${d.toLowerCase()}`), slash(root).replace(/^([A-Za-z]):/, (_, d) => `/${d}`)]);
  for (const f of forms) out = out.split(f).join("<repo>");
  const home = slash(process.env.USERPROFILE ?? process.env.HOME ?? "");
  if (home.length > 3) out = out.split(home).join("<home>").split(home.replace(/\//g, "\\")).join("<home>");
  return out.trimEnd();
};

function run(name, command, cwd = ".", env = {}) {
  const start = Date.now();
  const r = spawnSync(command, { cwd: join(root, cwd), shell: true, encoding: "utf8", env: { ...process.env, ...env }, maxBuffer: 256 * 1024 * 1024 });
  const seconds = Math.round((Date.now() - start) / 100) / 10;
  receipts[name] = { command, cwd, seconds, exit: r.status, output: scrub(`${r.stdout ?? ""}${r.stderr ?? ""}`) };
  console.log(`${name}: exit ${r.status} in ${seconds}s`);
  save();
}
const save = () => writeFileSync(file, `${JSON.stringify(receipts, null, 2)}\n`);

const steps = {
  tree() {
    // What git tracks in each folder, one line per folder: names only, so build output (dist, node_modules) never appears.
    const dirs = [web, `${web}/app`, `${web}/app/explorer`, `${web}/app/workbench`, `${web}/kit`, `${web}/compiler`, "tests/Uinsure.Policies.Web.Tests", "tests/Uinsure.Policies.Web.Tests/e2e", "docs/ui"];
    const lines = [];
    for (const d of dirs) {
      const names = execFileSync("git", ["ls-tree", "--name-only", "HEAD", `${d}/`], { cwd: root, encoding: "utf8" })
        .trim()
        .split("\n")
        .map((n) => n.slice(d.length + 1));
      lines.push(`${d}/`, `  ${names.join("  ")}`);
    }
    receipts.tree = { command: "git ls-tree --name-only HEAD <folder>/", cwd: ".", seconds: 0, exit: 0, output: scrub(lines.join("\n")) };
    save();
  },
  trace: () => run("trace", `npm --prefix ${web} run trace`),
  build: () => run("build", `npm --prefix ${web} run build`),
  vitest: () => run("vitest", `npm --prefix ${web} run test`),
  "vitest-one": () => run("vitestOne", "npx vitest run --config vite.config.ts wb-7-requests-drawer", web),
  playwright: () => run("playwright", `npm --prefix ${web} run e2e`),
  "playwright-one": () => run("playwrightOne", 'npx playwright test --config playwright.config.ts W1/wb-1 -g "WB-1"', web),
  async serve() {
    // The API's http profile (5080) and the static preview (4170) with /api proxied to it, then a status check of each.
    const lines = [];
    const start = Date.now();
    const api = spawn("dotnet", ["run", "--project", "src/Uinsure.Policies.Api", "--launch-profile", "http"], { cwd: root, shell: false });
    const preview = spawn("npm", ["--prefix", web, "run", "preview", "--", "--port", "4170", "--strictPort"], { cwd: root, shell: true, env: { ...process.env, DOCKET_API_PORT: "5080" } });
    const seen = { api: "", preview: "" };
    api.stdout.on("data", (d) => (seen.api += d));
    preview.stdout.on("data", (d) => (seen.preview += d));
    const until = async (probe, ms) => {
      for (let t = 0; t < ms / 500; t++) {
        if (await probe().catch(() => false)) return true;
        await new Promise((r) => setTimeout(r, 500));
      }
      return false;
    };
    await until(async () => (await fetch("http://localhost:5080/health/live")).status === 200, 120000);
    await until(async () => (await fetch("http://localhost:4170/")).status === 200, 60000);
    const status = async (url) => (await fetch(url).then((r) => r.status, () => "no answer"));
    const checks = [
      ["curl -s -o /dev/null -w \"%{http_code}\\n\" http://localhost:4170/", await status("http://localhost:4170/")],
      ["curl -s -o /dev/null -w \"%{http_code}\\n\" http://localhost:5080/health/live", await status("http://localhost:5080/health/live")],
      ["curl -s -o /dev/null -w \"%{http_code}\\n\" http://localhost:4170/api/health/live", await status("http://localhost:4170/api/health/live")],
    ];
    const kill = (p) => spawnSync("taskkill", ["/PID", String(p.pid), "/T", "/F"], { encoding: "utf8" });
    kill(api);
    kill(preview);
    lines.push(...checks.map(([, code]) => String(code)));
    receipts.serve = {
      command: "dotnet run --project src/Uinsure.Policies.Api --launch-profile http, then DOCKET_API_PORT=5080 npm --prefix src/Uinsure.Policies.Web run preview -- --port 4170",
      cwd: ".",
      seconds: Math.round((Date.now() - start) / 100) / 10,
      exit: 0,
      apiOutput: scrub(seen.api),
      previewOutput: scrub(seen.preview),
      checks: checks.map(([command, code]) => ({ command, output: String(code) })),
      output: scrub(lines.join("\n")),
    };
    save();
    console.log(`serve: ${lines.join(" ")}`);
  },
};

const wanted = process.argv.slice(2);
const todo = wanted.length ? wanted : ["tree", "trace", "build", "vitest", "vitest-one", "serve"];
for (const s of todo) {
  if (!(s in steps)) {
    console.error(`Unknown step ${s}. Steps: ${Object.keys(steps).join(" ")}`);
    process.exit(2);
  }
  await steps[s]();
}
