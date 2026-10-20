import { defineConfig } from '@playwright/test';

const appPort = Number(process.env.DOCKET_APP_PORT ?? 4170);

export default defineConfig({
  testDir: '../../tests/web/e2e',
  use: { baseURL: `http://localhost:${appPort}` },
  webServer: {
    command: `npm run build && npm run preview -- --port ${appPort} --strictPort`,
    url: `http://localhost:${appPort}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
