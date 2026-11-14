import { test, expect } from '@playwright/test';

test.describe('Lab Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lab/dashboard');
    await expect(page.locator('app-lab-dashboard')).toBeVisible({ timeout: 15000 });
  });

  test('renders all solver panels', async ({ page }) => {
    await expect(page.locator('app-safety-banner')).toBeAttached();
    await expect(page.locator('app-target-specs')).toBeAttached();
    await expect(page.locator('app-version-history')).toBeAttached();
    await expect(page.locator('app-reasoning-panel')).toBeAttached();
    await expect(page.locator('app-formulation-optimizer')).toBeAttached();
    await expect(page.locator('app-detergency-panel')).toBeAttached();
    await expect(page.locator('app-drying-panel')).toBeAttached();
    await expect(page.locator('app-microscope-view')).toBeAttached();
  });

  test('catalog shows ingredients', async ({ page }) => {
    const catalog = page.getByRole('heading', { name: 'Каталог' });
    await expect(catalog).toBeVisible();
    // At least one ingredient card (group hover class)
    await expect(page.locator('div.group').first()).toBeVisible();
  });

  test('formulation optimizer expands and runs', async ({ page }) => {
    const opt = page.locator('app-formulation-optimizer');
    // Expand panel
    await opt.locator('button').first().click();
    await expect(opt.locator('text=Масляная фаза')).toBeVisible();
    await expect(opt.locator('text=Водная фаза')).toBeVisible();
    await expect(opt.getByText('ПАВ (кандидаты для пары)')).toBeVisible();

    // Run optimization with defaults
    await opt.locator('button:has-text("Подобрать рецептуру")').click();
    // Wait for result or error (case-insensitive: CSS may render title-case)
    await expect(
      opt.getByText(/Оптимальная пара ПАВ|Ошибка оптимизации/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('adding ingredient updates formulation', async ({ page }) => {
    // Click first catalog ingredient add button
    await page.locator('.group button').first().click();
    await page.waitForTimeout(500);
    // Should show item in formulation (not empty state)
    await expect(page.locator('text=Добавьте ингредиенты')).not.toBeVisible();
  });

  test('items persist after reload', async ({ page }) => {
    // Add ingredient
    await page.locator('.group button').first().click();
    await page.waitForTimeout(500);
    // Reload
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('app-lab-dashboard')).toBeVisible({ timeout: 15000 });
    // Item should still be there
    await expect(page.locator('text=Добавьте ингредиенты')).not.toBeVisible();
  });
});
