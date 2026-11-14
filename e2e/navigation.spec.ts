import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('app-root')).toBeVisible({ timeout: 15000 });
  });

  test('page renders navbar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('app-navbar')).toBeVisible({ timeout: 15000 });
  });
});
