import { defineConfig, devices } from '@playwright/test';

/**
 * FASE 155 - Option C: Docker Container Optimization
 *
 * Docker-specific configuration with:
 * - Increased timeouts (60s vs 30s) - compensate for bridge network latency
 * - Enhanced expect timeout (10s vs 5s)
 * - Trace/video/screenshot retention for debugging
 * - Network idle strategy (built into tests)
 *
 * Research Sources:
 * - https://playwright.dev/docs/docker
 * - https://dockerpros.com/networking-and-connectivity/understanding-network-latency-issues-in-containerized-environments/
 *
 * Usage:
 * docker exec invest_frontend npx playwright test --config=playwright.config.docker.ts
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // 1 retry in Docker (flakiness compensation)
  workers: 2, // Limit workers in Docker (resource constrained)

  // CRITICAL: Increased timeouts for Docker bridge network latency (500-1500ms)
  timeout: 60000, // 60s vs 30s default (2x increase for Docker)
  expect: {
    timeout: 10000, // 10s for assertions (vs 5s default)
  },

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/docker-results.json' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:3100',

    // Enhanced debugging for Docker failures
    trace: 'retain-on-failure', // Keep traces on failure (vs on-first-retry)
    screenshot: 'only-on-failure',
    video: 'retain-on-failure', // Retain videos on failure

    // Docker-specific timeouts
    navigationTimeout: 90000, // 90s for navigation (slow in Docker)
    actionTimeout: 30000, // 30s for actions (2x increase)
  },

  projects: [
    // Setup project for auth
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      timeout: 90000, // Extra time for setup in Docker
    },

    // Chromium only (primary test browser for Docker)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // WebServer configuration (frontend should already be running in Docker)
  // REMOVED: Frontend is already running in Docker, no need to start webServer
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3100',
  //   reuseExistingServer: true,
  //   timeout: 120 * 1000,
  // },

  // Output directories
  outputDir: 'test-results/docker-artifacts',
});
