import { test, expect } from '@playwright/test';

test.describe('Recipe Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/recipes');
  });

  test('navigates to create form from list', async ({ page }) => {
    await page.getByRole('link', { name: 'Новая рецептура' }).click();
    await expect(page).toHaveURL(/\/recipes\/create/);
    await expect(page.locator('app-recipe-form')).toBeVisible({ timeout: 15000 });
  });

  test('creates a recipe and navigates to detail', async ({ page }) => {
    await page.goto('/recipes/create');
    await expect(page.locator('app-recipe-form')).toBeVisible({ timeout: 15000 });

    await page.locator('#r-name').fill('Тестовый крем');
    await page.locator('#r-desc').fill('Тестовое описание крема');

    // Выбираем первый доступный компонент в первой строке ингредиентов
    const firstSelect = page.locator('app-recipe-form select.ingredient-select').first();
    // options[0] = '— компонент —', index 1 = первый ингредиент
    await firstSelect.selectOption({ index: 1 });

    // Процент
    await page.locator('app-recipe-form input[type="number"]').first().fill('100');

    // Назначение
    await page.locator('app-recipe-form input[placeholder="Назначение"]').first().fill('Основа');

    // Шаг
    await page.locator('app-recipe-form textarea').first().fill('Смешать компоненты');

    await page.getByRole('button', { name: 'Сохранить рецептуру' }).click();

    // Должны попасть на detail страницу нового рецепта
    await expect(page).toHaveURL(/\/recipes\/detail\//, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Тестовый крем' })).toBeVisible({ timeout: 10000 });
  });

  test('save disabled without name', async ({ page }) => {
    await page.goto('/recipes/create');
    await expect(page.locator('app-recipe-form')).toBeVisible({ timeout: 15000 });
    const btn = page.getByRole('button', { name: 'Сохранить рецептуру' });
    await expect(btn).toBeDisabled();
  });

  test('created recipe persists after reload', async ({ page }) => {
    await page.goto('/recipes/create');
    await expect(page.locator('app-recipe-form')).toBeVisible({ timeout: 15000 });

    await page.locator('#r-name').fill('Персистентный лосьон');
    await page.locator('#r-desc').fill('Проверка localStorage');
    await page.locator('app-recipe-form select.ingredient-select').first().selectOption({ index: 1 });
    await page.locator('app-recipe-form input[type="number"]').first().fill('100');
    await page.locator('app-recipe-form input[placeholder="Назначение"]').first().fill('База');
    await page.locator('app-recipe-form textarea').first().fill('Нанести на кожу');

    await page.getByRole('button', { name: 'Сохранить рецептуру' }).click();
    await expect(page).toHaveURL(/\/recipes\/detail\//, { timeout: 15000 });

    await page.goto('/recipes');
    await expect(page.getByText('Персистентный лосьон')).toBeVisible({ timeout: 10000 });
  });
});
