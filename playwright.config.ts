import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  paths: ['e2e/features/*.feature'],
  require: ['e2e/steps/*.ts'],
  outputDir: 'e2e/.bdd-generated',
});

export default defineConfig({
  testDir,
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  webServer: {
    command: './mvnw',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
  },
});
