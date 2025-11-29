import { defineConfig, devices } from '@playwright/test';

/**
 * Configuracao Playwright para testes locais com screenshots
 * Executa no host Windows conectando ao frontend em localhost:3100
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  timeout: 120000,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['list']
  ],

  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    navigationTimeout: 60000,
    actionTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium-local',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
    },
  ],

  // NO webServer - server already running in Docker
});
