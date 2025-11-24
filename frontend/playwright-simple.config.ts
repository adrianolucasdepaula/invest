import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração simplificada do Playwright para testes básicos
 * Não requer autenticação ou servidor local
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/playwright-test-simple.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  timeout: 60000,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-simple', open: 'never' }],
  ],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 30000,
    actionTimeout: 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
