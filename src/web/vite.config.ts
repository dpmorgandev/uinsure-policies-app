// web-architecture C1: the kitchen sink is its own entry; the app never imports it. Tests live in
// tests/web (W3), outside this package, so every bare import resolves to this package's node_modules.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Only what kit code and tests import; never the build tools (aliasing vite breaks its virtual modules).
const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf8'));
const deps = [...Object.keys(pkg.dependencies ?? {}), 'vitest', '@testing-library/react', '@testing-library/user-event'];
const alias = deps.map((name) => ({
  find: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/.*)?$`),
  replacement: resolve(import.meta.dirname, 'node_modules', name) + '$1',
}));

// The workbench calls /api/...; the app proxies it to the API port it is given.
const proxy = { '/api': `http://localhost:${process.env.DOCKET_API_PORT ?? 5080}` };

// A kit class is kit-<component>__<local>, as in the stylekit the screens were signed off against (parity reads it).
function scopedName(local: string, filename: string): string {
  const kit = /[\\/]kit[\\/](?:primitives|patterns|layouts|project)[\\/]([a-z0-9-]+)[\\/][^\\/]+\.module\.css/.exec(filename);
  return kit ? `kit-${kit[1]}__${local}` : `${local}_${Buffer.from(filename).toString('base64url').slice(-6)}`;
}

export default defineConfig({
  plugins: [react()],
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
