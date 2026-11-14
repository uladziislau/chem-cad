import { test, expect } from '@playwright/test';

test.describe('Recipes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/recipes/list');
    await expect(page.locator('app-recipe-list')).toBeVisible({ timeout: 15000 });
  });

  test('list renders built-in recipes', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'База рецептур' })).toBeVisible();
    await expect(page.getByText('Универсальное моющее средство')).toBeVisible();
  });

  test('export and import buttons are visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Экспорт' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Импорт' })).toBeVisible();
  });

  test('navigates to recipe detail', async ({ page }) => {
    await page.getByRole('link', { name: 'Посмотреть рецептуру' }).first().click();
    await expect(page).toHaveURL(/\/recipes\/detail\//);
    await expect(page.locator('app-recipe-detail')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Универсальное моющее средство' })).toBeVisible();
  });

  test('detail shows export and duplicate actions', async ({ page }) => {
    await page.goto('/recipes/detail/r1');
    await expect(page.locator('app-recipe-detail')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button[title="Экспорт в JSON"]')).toBeVisible();
    await expect(page.locator('button[title="Дублировать"]')).toBeVisible();
    // Встроенный рецепт — кнопки удаления нет
    await expect(page.locator('button[title="Удалить"]')).not.toBeVisible();
  });
});
