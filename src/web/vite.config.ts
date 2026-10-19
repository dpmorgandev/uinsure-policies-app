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

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: { alias },
  server: { fs: { allow: [resolve(import.meta.dirname, '../..')] } },
  build: { rollupOptions: { input: { 'kitchen-sink': resolve(import.meta.dirname, 'kitchen-sink.html') } } },
  test: { environment: 'jsdom', root: resolve(import.meta.dirname, '../..'), include: ['tests/web/kit/**/*.test.tsx'] },
});
