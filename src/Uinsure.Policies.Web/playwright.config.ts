// A type-only import: the config is an ES module, and '@playwright/test' (reached through tsconfig `paths`) is CommonJS.
import type { PlaywrightTestConfig } from '@playwright/test';

const appPort = Number(process.env.DOCKET_APP_PORT ?? 4170);

const config: PlaywrightTestConfig = {
  testDir: '../../tests/Uinsure.Policies.Web.Tests/e2e',
  // The baselines are Windows renders (U9 review A1 R7), so the regression specs stay off Linux.
  testIgnore: process.platform === 'linux' ? ['regression/**'] : [],
  // One tsconfig for every spec: the specs live outside src/Uinsure.Policies.Web, so they would find no `paths` of their own.
  tsconfig: './tsconfig.json',
  // The regression screenshots live with the signed-off screens: docs/ui/baselines/<screen>/<state>-<width>-<theme>.png.
  snapshotPathTemplate: '{testDir}/../../../docs/ui/baselines/{arg}{ext}',
  use: { baseURL: `http://localhost:${appPort}` },
  webServer: {
    command: `npm run build && npm run preview -- --port ${appPort} --strictPort`,
    url: `http://localhost:${appPort}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
};

export default config;
