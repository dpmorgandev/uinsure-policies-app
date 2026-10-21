// A type-only import: the config is an ES module, and '@playwright/test' (reached through tsconfig `paths`) is CommonJS.
import type { PlaywrightTestConfig } from '@playwright/test';

const appPort = Number(process.env.DOCKET_APP_PORT ?? 4170);

const config: PlaywrightTestConfig = {
  testDir: '../../tests/web/e2e',
  // One tsconfig for every spec: the specs live outside src/web, so they would find no `paths` of their own.
  tsconfig: './tsconfig.json',
  use: { baseURL: `http://localhost:${appPort}` },
  webServer: {
    command: `npm run build && npm run preview -- --port ${appPort} --strictPort`,
    url: `http://localhost:${appPort}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
};

export default config;
