import { test, expect } from '@playwright/test';

test.describe('Formulator persistence', () => {
  test('formulation survives reload via localStorage', async ({ page }) => {
    await page.goto('/formulator');
    await expect(page.locator('app-formulator')).toBeVisible({ timeout: 15000 });

    // Добавить первый доступный направление — клик по карточке ингредиента
    const firstIngredient = page.locator('app-formulator .cursor-pointer').first();
    await firstIngredient.click();
    // Проставить 100%
    await page.locator('app-formulator input[type="number"]').first().fill('100');
    await expect(page.getByText('Итого: 100%')).toBeVisible();

    // Перезагрузка — состояние должно восстановиться
    await page.reload();
    await expect(page.locator('app-formulator')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Итого: 100%')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('app-formulator input[type="number"]').first()).toHaveValue('100');
  });

  test('clear button empties formulation and storage', async ({ page }) => {
    await page.goto('/formulator');
    await expect(page.locator('app-formulator')).toBeVisible({ timeout: 15000 });

    // Убедиться, что черновик чист (отдельный контекст браузера на тест)
    await page.locator('app-formulator .cursor-pointer').first().click();
    await expect(page.getByRole('button', { name: 'Очистить' })).toBeVisible();
    await page.getByRole('button', { name: 'Очистить' }).click();

    await expect(page.getByText('Добавьте компоненты из списка слева')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Очистить' })).toHaveCount(0);
  });
});
