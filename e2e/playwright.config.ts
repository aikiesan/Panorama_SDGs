import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Assumes the stack is already running via `docker compose up -d`
  // To auto-start: uncomment the webServer block below
  // webServer: {
  //   command: 'docker compose up -d',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: true,
  //   timeout: 120_000,
  // },
});
