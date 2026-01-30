import { test, expect } from '@playwright/test';

// Smoke test: ensure the root page loads and main document body is present.
// Configure `STAGING_URL` env var in CI to point at the staging deployment.

test('root page loads', async ({ page, baseURL }) => {
  const url = baseURL || 'http://localhost:3000';
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  expect(response).not.toBeNull();
  const status = response!.status();
  expect([200, 301, 302, 304]).toContain(status);
  await expect(page.locator('body')).toBeVisible();
});
