import { test, expect } from '@playwright/test';

test.describe('Lab Dashboard', () => {
  test('loads catalog and formulation panels', async ({ page }) => {
    await page.goto('/lab/dashboard');
    await expect(page.locator('app-root')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h2:has-text("Каталог")')).toBeVisible();
    await expect(page.locator('h2:has-text("Текущая Рецептура")')).toBeVisible();
  });

  test('export buttons disabled without ingredients', async ({ page }) => {
    await page.goto('/lab/dashboard');
    await expect(page.locator('app-root')).toBeVisible({ timeout: 15000 });
    const txtBtn = page.locator('button:has-text("TXT")');
    const csvBtn = page.locator('button:has-text("CSV")');
    await expect(txtBtn).toBeDisabled();
    await expect(csvBtn).toBeDisabled();
  });

  test('export buttons enabled after adding ingredient', async ({ page }) => {
    await page.goto('/lab/dashboard');
    await expect(page.locator('app-root')).toBeVisible({ timeout: 15000 });

    // Add first ingredient from catalog
    const addBtn = page.locator('button:has(svg path[d*="M10 3a1"])').first();
    await addBtn.click();

    // Wait for simulation to compute
    await page.waitForTimeout(500);

    const txtBtn = page.locator('button:has-text("TXT")');
    await expect(txtBtn).toBeEnabled();
  });

  test('download TXT report after adding ingredient', async ({ page }) => {
    await page.goto('/lab/dashboard');
    await expect(page.locator('app-root')).toBeVisible({ timeout: 15000 });

    // Add first ingredient
    const addBtn = page.locator('button:has(svg path[d*="M10 3a1"])').first();
    await addBtn.click();
    await page.waitForTimeout(500);

    // Wait for report to be ready and click TXT
    const txtBtn = page.locator('button:has-text("TXT")');
    await expect(txtBtn).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await txtBtn.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.txt$/);
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('download CSV report after adding ingredient', async ({ page }) => {
    await page.goto('/lab/dashboard');
    await expect(page.locator('app-root')).toBeVisible({ timeout: 15000 });

    const addBtn = page.locator('button:has(svg path[d*="M10 3a1"])').first();
    await addBtn.click();
    await page.waitForTimeout(500);

    const csvBtn = page.locator('button:has-text("CSV")');
    await expect(csvBtn).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await csvBtn.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});

test.describe('Process Designer', () => {
  test('loads with empty state', async ({ page }) => {
    await page.goto('/lab/process');
    await expect(page.locator('app-root')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Техпроцесс')).toBeVisible();
    await expect(page.locator('text=Эволюция Системы')).toBeVisible();
  });

  test('export buttons enabled after adding step', async ({ page }) => {
    await page.goto('/lab/process');
    await expect(page.locator('app-root')).toBeVisible({ timeout: 15000 });

    // Add a step via the + button
    const addStepBtn = page.locator('button[title*="Добавить компоненты"]');
    await addStepBtn.click();

    await page.waitForTimeout(500);

    const txtBtn = page.locator('button:has-text("TXT")');
    await expect(txtBtn).toBeEnabled();
  });
});
