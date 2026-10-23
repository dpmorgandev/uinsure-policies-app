// web-architecture C1: the kitchen sink is its own entry; the app never imports it. Tests live in
// tests/Uinsure.Policies.Web.Tests (W3), outside this package, so every bare import resolves to this package's node_modules.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

// Only what kit code and tests import; never the build tools (aliasing vite breaks its virtual modules).
const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf8'));
const deps = [...Object.keys(pkg.dependencies ?? {}), 'vitest', '@testing-library/react', '@testing-library/user-event'];
const alias = deps.map((name) => ({
  find: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/.*)?$`),
  replacement: resolve(import.meta.dirname, 'node_modules', name) + '$1',
}));

// The workbench calls /api/...; the app proxies it to the API port it is given, whose routes have no /api prefix.
const proxy = {
  '/api': {
    target: `http://localhost:${process.env.DOCKET_API_PORT ?? 5080}`,
    rewrite: (path: string) => path.replace(/^\/api/, ''),
  },
};

// DATA-1: the dev server listens first and compiles the trail beside it. Until the compile ends /trace.json answers 503
// "compiling"; then it serves the compiled file. A failed compile is printed problem by problem and /trace.json keeps
// answering 503, so the page says it could not load. Preview compiles nothing: it serves the dist/ the build made.
function traceOnStart(): Plugin {
  const publicDir = resolve(import.meta.dirname, 'public');
  let state: 'compiling' | 'ready' | 'failed' = 'compiling';
  return {
    name: 'docket-trace-on-start',
    // Vitest reads this config in serve mode too, as mode 'test'; a unit run compiles nothing.
    apply: (_config, { command, mode, isPreview }) => command === 'serve' && mode !== 'test' && isPreview !== true,
    configureServer(server) {
      const log = server.config.logger;
      let problems = '';
      const compiler = spawn(process.execPath, [resolve(import.meta.dirname, 'compiler/index.ts'), '--ref', 'HEAD'], { cwd: import.meta.dirname });
      compiler.stderr.on('data', (chunk: Buffer) => (problems += chunk.toString()));
      const compiled = new Promise<void>((done) =>
        compiler.on('close', (code) => {
          state = code === 0 ? 'ready' : 'failed';
          if (state === 'failed') for (const line of problems.split('\n').filter((l) => l.trim() !== '')) log.error(`trace compile failed: ${line}`);
          done();
        }),
      );
      // The port answers at once, but the "Local:" line waits for the compile: it means the trail is ready or has said why not.
      const printUrls = server.printUrls.bind(server);
      server.printUrls = () => void compiled.then(printUrls);
      server.httpServer?.on('close', () => compiler.kill());
      server.middlewares.use((request, response, next) => {
        const path = decodeURIComponent((request.url ?? '').split('?')[0] ?? '');
        if (path !== '/trace.json' && !path.startsWith('/trace/')) return next();
        const file = resolve(publicDir, '.' + path);
        if (state === 'ready' && file.startsWith(publicDir + sep) && existsSync(file)) {
          response.setHeader('content-type', 'application/json');
          return response.end(readFileSync(file));
        }
        response.statusCode = state === 'ready' ? 404 : 503;
        response.setHeader('content-type', 'text/plain');
        response.end(state === 'compiling' ? 'The trail is compiling; try again in a moment.' : 'The trail did not compile; see the console of the dev server.');
      });
    },
  };
}

// A kit class is kit-<component>__<local>, as in the stylekit the screens were signed off against (parity reads it).
function scopedName(local: string, filename: string): string {
  const kit = /[\\/]kit[\\/](?:primitives|patterns|layouts|project)[\\/]([a-z0-9-]+)[\\/][^\\/]+\.module\.css/.exec(filename);
  return kit ? `kit-${kit[1]}__${local}` : `${local}_${Buffer.from(filename).toString('base64url').slice(-6)}`;
}

export default defineConfig({
  plugins: [react(), traceOnStart()],
  css: { modules: { generateScopedName: scopedName } },
  base: './',
  cacheDir: resolve(import.meta.dirname, 'node_modules/.vite'),
  resolve: { alias },
  preview: { proxy },
  server: { proxy, fs: { allow: [resolve(import.meta.dirname, '../..')] } },
  build: { rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        'kitchen-sink': resolve(import.meta.dirname, 'kitchen-sink.html'),
      },
    }, },
  test: { environment: 'jsdom', root: resolve(import.meta.dirname, '../..'), include: ['tests/Uinsure.Policies.Web.Tests/kit/**/*.test.tsx', 'tests/Uinsure.Policies.Web.Tests/unit/**/*.test.{ts,tsx}'] },
});
