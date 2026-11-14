import { test, expect } from '@playwright/test';

test.describe('Process Designer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lab/process');
    await expect(page.locator('app-process-designer')).toBeVisible({ timeout: 15000 });
  });

  test('renders three panels', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Техпроцесс' })).toBeVisible();
    await expect(page.getByText('Выберите или создайте этап процесса')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Эволюция Системы' })).toBeVisible();
  });

  test('adds steps via quick-action buttons', async ({ page }) => {
    await page.getByRole('button', { name: 'Перемешать' }).click();
    await expect(page.getByText('Шаг 1')).toBeVisible();
    await page.getByRole('button', { name: 'Нагреть' }).click();
    await expect(page.getByText('Шаг 2')).toBeVisible();
    await page.getByRole('button', { name: 'Эмульгировать' }).click();
    await expect(page.getByText('Шаг 3')).toBeVisible();
  });

  test('adds ADD step and ingredient from catalog', async ({ page }) => {
    // Add step via title button
    await page.locator('button[title="Добавить компоненты"]').click();
    await expect(page.getByText('Шаг 1')).toBeVisible();

    // Open catalog
    await page.getByText('+ Добавить из каталога').click();
    await expect(page.getByText('Добавляемые компоненты')).toBeVisible();

    // Click first ingredient in catalog grid
    const catalogGrid = page.locator('div.grid.grid-cols-2.gap-2').last();
    await catalogGrid.locator('button').first().click();

    // Ingredient should appear in step
    await expect(page.getByText('Нет компонентов на этом этапе')).not.toBeVisible();
  });

  test('edits step parameters', async ({ page }) => {
    await page.getByRole('button', { name: 'Нагреть' }).click();
    // Duration input
    const durationInput = page.locator('input[type="number"]').first();
    await durationInput.fill('30');
    await expect(durationInput).toHaveValue('30');
  });

  test('evolution panel shows metrics after steps', async ({ page }) => {
    // Add ADD step with ingredient, then MIX step
    await page.locator('button[title="Добавить компоненты"]').click();
    await page.getByText('+ Добавить из каталога').click();
    const catalogGrid = page.locator('div.grid.grid-cols-2.gap-2').last();
    await catalogGrid.locator('button').first().click();
    await page.getByRole('button', { name: 'Перемешать' }).click();

    // Evolution panel should show metrics (viscosity, pH)
    await expect(page.getByText('Вязкость')).toBeVisible();
    await expect(page.getByText('Прогноз стабильности')).toBeVisible();
  });

  test('navigates back to dashboard', async ({ page }) => {
    await page.getByText('Вернуться в Лабораторию').click();
    await expect(page).toHaveURL('/lab/dashboard');
    await expect(page.locator('app-lab-dashboard')).toBeVisible({ timeout: 15000 });
  });
});
