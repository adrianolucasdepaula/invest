import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for MCP Triplo validation
 * No auth setup dependency - uses existing token
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/mcp-triplo-no-auth.spec.ts',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 90000,
  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:3100',
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
    navigationTimeout: 60000,
    actionTimeout: 30000,
  },

  projects: [
    {
      name: 'mcp-validation',
      use: {
        ...devices['Desktop Chrome'],
        // No dependencies - use existing storage state
      },
    },
  ],
});
