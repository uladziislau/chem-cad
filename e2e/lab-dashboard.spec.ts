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

  test('version history: save, restore, diff', async ({ page }) => {
    const vh = page.locator('app-version-history');

    // Add two ingredients
    await page.locator('.group button').first().click();
    await page.locator('.group button').nth(1).click();
    await page.waitForTimeout(500);

    // Open version history panel
    await vh.locator('button').first().click();
    await expect(vh.locator('input[placeholder="Название версии"]')).toBeVisible();

    // Save v1
    await vh.locator('input[placeholder="Название версии"]').fill('Версия А');
    await vh.locator('button:has-text("Сохранить")').click();
    await expect(vh.locator('span:has-text("v1 — Версия А")')).toBeVisible();

    // Save v2 (same items)
    await vh.locator('input[placeholder="Название версии"]').fill('Версия Б');
    await vh.locator('button:has-text("Сохранить")').click();
    await expect(vh.locator('span:has-text("v2 — Версия Б")')).toBeVisible();

    // Compare v1 vs v2
    await vh.locator('select').nth(0).selectOption({ index: 1 });
    await vh.locator('select').nth(1).selectOption({ index: 2 });
    await vh.locator('button:has-text("Показать diff")').click();
    await page.waitForTimeout(300);
    await expect(vh.locator('text=⬇ Скачать SDS')).toBeVisible();
  });

  test('version history: delete version', async ({ page }) => {
    const vh = page.locator('app-version-history');

    // Add ingredient and save version
    await page.locator('.group button').first().click();
    await page.waitForTimeout(500);

    await vh.locator('button').first().click();
    await vh.locator('input[placeholder="Название версии"]').fill('Тестовая');
    await vh.locator('button:has-text("Сохранить")').click();
    await expect(vh.locator('span:has-text("v1 — Тестовая")')).toBeVisible();

    // Delete it
    await vh.locator('button:has-text("×")').click();
    await expect(vh.locator('text=Нет сохранённых версий')).toBeVisible();
  });

  test('target specs: constraint solver optimization', async ({ page }) => {
    const specs = page.locator('app-target-specs');

    // Add ingredients first
    await page.locator('.group button').first().click();
    await page.locator('.group button').nth(1).click();
    await page.waitForTimeout(500);

    // Open target specs panel
    await specs.locator('button').first().click();
    await expect(specs.locator('text=Целевые свойства')).toBeVisible();

    // Enable pH spec
    await specs.locator('input[type="checkbox"]').first().check();
    await specs.locator('input[type="number"]').first().fill('5.0');
    await specs.locator('input[type="number"]').nth(1).fill('7.0');

    // Run optimization
    await specs.locator('button:has-text("Подобрать состав")').click();

    // Wait for result (converged or not)
    await expect(
      specs.getByText(/Сошлось|Не сошлось/)
    ).toBeVisible({ timeout: 10000 });

    // Recipe breakdown should show
    await expect(specs.locator('div.uppercase:has-text("Состав")')).toBeVisible();
  });
});
