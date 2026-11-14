import { test, expect } from '@playwright/test';

test.describe('Ingredient Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/formulator/ingredients');
    await expect(page.locator('app-ingredient-catalog')).toBeVisible({ timeout: 15000 });
  });

  test('renders built-in ingredients', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Каталог ингредиентов' })).toBeVisible();
    await expect(page.getByText('Дистиллированная вода').first()).toBeVisible();
  });

  test('creates a custom ingredient', async ({ page }) => {
    await page.locator('#ing-name').fill('Тестовый реагент');
    await page.getByRole('button', { name: 'Добавить' }).click();
    await expect(page.getByText('Ингредиент добавлен')).toBeVisible();
    await expect(page.getByText('Тестовый реагент')).toBeVisible();
  });

  test('custom ingredient persists after reload', async ({ page }) => {
    await page.locator('#ing-name').fill('Персистентный ингредиент');
    await page.getByRole('button', { name: 'Добавить' }).click();
    await expect(page.getByText('Персистентный ингредиент')).toBeVisible();
    await page.reload();
    await expect(page.locator('app-ingredient-catalog')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Персистентный ингредиент')).toBeVisible();
  });

  test('built-in ingredient cannot be deleted', async ({ page }) => {
    await page.getByText('Дистиллированная вода').first().click();
    await expect(page.getByRole('button', { name: 'Удалить' })).not.toBeVisible();
    await expect(page.getByText('Встроенный ингредиент — только просмотр')).toBeVisible();
  });

  test('search filters the list', async ({ page }) => {
    const list = page.locator('app-ingredient-catalog .divide-y');
    await page.getByPlaceholder('Поиск по названию…').fill('глицерин');
    await expect(list.getByText('Глицерин')).toBeVisible();
    // 'Этиловый спирт' не содержит 'глицерин' ни в имени, ни в id
    await expect(list.getByText('Этиловый спирт (96%)')).not.toBeVisible();
  });

  test('navigates to formulator', async ({ page }) => {
    await page.getByRole('link', { name: 'К формулятору' }).click();
    await expect(page).toHaveURL(/\/formulator\/formulator/);
    await expect(page.locator('app-formulator')).toBeVisible({ timeout: 15000 });
  });
});
