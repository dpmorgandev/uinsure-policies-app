// DATA-1 (I1): the F5 target. A fresh clone has no node_modules, so say how to restore them before node fails on vite.js.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const web = join(dirname(fileURLToPath(import.meta.url)), '..');
const vite = join(web, 'node_modules', 'vite', 'bin', 'vite.js');

if (!existsSync(vite)) {
  console.error('Packages are not restored. Run `npm ci` in src/Uinsure.Policies.Web, then start again.');
  process.exit(1);
}
await import(pathToFileURL(vite).href);
