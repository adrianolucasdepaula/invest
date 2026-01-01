import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'mcp-triplo-standalone.spec.ts',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 600000,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3100',
    storageState: 'playwright/.auth/user.json',
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
    navigationTimeout: 90000,
    actionTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium-standalone',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      // No dependencies - uses existing auth
    },
  ],
});
