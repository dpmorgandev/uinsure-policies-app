// web-architecture C1: the kitchen sink is its own entry; the app never imports it. Tests live in
// tests/web (W3), outside this package, so every bare import resolves to this package's node_modules.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { compile } from './compiler/index.ts';
import type { CompileFailure } from './compiler/index.ts';

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

// DATA-1: the dev server compiles the trail before it serves, so a fresh clone (trace.json is git-ignored) opens on a
// trail, whether F5, the esproj StartupCommand or npx vite started it. A failed compile is printed problem by problem
// and /trace.json answers 503, so the page says it could not load; an older file is never served in its place.
function traceOnStart(): Plugin {
  // The compile runs in the config hook, before Vite lists public/: a file written later is not served.
  let failed: string[] | null = null;
  return {
    name: 'docket-trace-on-start',
    apply: 'serve',
    config(_config, { mode }) {
      // Vitest reads this config in serve mode too, as mode 'test'; a unit run compiles nothing.
      if (mode === 'test') return;
      try {
        const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: import.meta.dirname, encoding: 'utf8' }).trim();
        compile({ root, ref: 'HEAD' });
      } catch (caught) {
        const problems = (caught as Partial<CompileFailure>).problems;
        failed =
          problems === undefined
            ? [caught instanceof Error ? caught.message : String(caught)]
            : problems.map((p) => `${p.file ?? '-'}:${p.line ?? '-'} ${p.reason}`);
      }
    },
    configureServer(server) {
      if (failed === null) return;
      for (const problem of failed) server.config.logger.error(`trace compile failed: ${problem}`);
      server.middlewares.use((request, response, next) => {
        const path = (request.url ?? '').split('?')[0] ?? '';
        if (path !== '/trace.json' && !path.startsWith('/trace/')) return next();
        response.statusCode = 503;
        response.setHeader('content-type', 'text/plain');
        response.end('The trail did not compile; see the console of the dev server.');
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
  test: { environment: 'jsdom', root: resolve(import.meta.dirname, '../..'), include: ['tests/web/kit/**/*.test.tsx', 'tests/web/unit/**/*.test.{ts,tsx}'] },
});
