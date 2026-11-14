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


  test('edit custom recipe via detail page', async ({ page }) => {
    // Создаём рецептуру
    await page.goto('/recipes/create');
    await expect(page.locator('app-recipe-form')).toBeVisible({ timeout: 15000 });
    await page.locator('#r-name').fill('Редактируемый гель');
    await page.locator('#r-desc').fill('Для проверки редактирования');
    await page.locator('app-recipe-form select.ingredient-select').first().selectOption({ index: 1 });
    await page.locator('app-recipe-form input[type="number"]').first().fill('100');
    await page.locator('app-recipe-form textarea').first().fill('Шаг 1');
    await page.getByRole('button', { name: 'Сохранить рецептуру' }).click();
    await expect(page).toHaveURL(/\/recipes\/detail\//, { timeout: 15000 });

    // Кнопка редактирования видна (isCustom)
    const editBtn = page.locator('a[title="Редактировать"]');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    await expect(page).toHaveURL(/\/recipes\/edit\//, { timeout: 15000 });
    await expect(page.locator('app-recipe-form')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Редактирование рецептуры' })).toBeVisible();

    // Поля предзаполнены
    await expect(page.locator('#r-name')).toHaveValue('Редактируемый гель');

    // Меняем имя и сохраняем
    await page.locator('#r-name').fill('Обновлённый гель');
    await page.getByRole('button', { name: 'Сохранить изменения' }).click();

    await expect(page).toHaveURL(/\/recipes\/detail\//, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Обновлённый гель' })).toBeVisible({ timeout: 10000 });
  });

  test('built-in recipe has no edit button', async ({ page }) => {
    // Первый встроенный рецепт из списка
    await page.goto('/recipes');
    const firstCard = page.locator('a[href*="/recipes/detail/"]').first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/recipes\/detail\//, { timeout: 15000 });

    // У встроенного рецепта нет кнопки редактирования (isCustom = false)
    await expect(page.locator('a[title="Редактировать"]')).toHaveCount(0);
  });

  test('step-ingredient binding persists to detail', async ({ page }) => {
    await page.goto('/recipes/create');
    await expect(page.locator('app-recipe-form')).toBeVisible({ timeout: 15000 });

    await page.locator('#r-name').fill('Рецепт с привязкой');
    await page.locator('#r-desc').fill('Проверка ingredientIds на шагах');

    // Ингредиент в основную таблицу
    await page.locator('app-recipe-form select.ingredient-select').first().selectOption({ index: 1 });
    await page.locator('app-recipe-form input[type="number"]').first().fill('100');

    // Текст шага
    await page.locator('app-recipe-form textarea').first().fill('Смешать компоненты');

    // Привязать ингредиент к шагу через select "[+ ингредиент]"
    const stepPick = page.locator('app-recipe-form select').filter({ hasText: '+ ингредиент' }).first();
    await stepPick.selectOption({ index: 1 });

    await page.getByRole('button', { name: 'Сохранить рецептуру' }).click();
    await expect(page).toHaveURL(/\/recipes\/detail\//, { timeout: 15000 });

    // На detail чип ингредиента виден под шагом
    await expect(page.getByText('Смешать компоненты')).toBeVisible();
    // хотя бы один чип с именем ингредиента в блоке шагов
    const chips = page.locator('ol li .rounded-full');
    await expect(chips.first()).toBeVisible({ timeout: 10000 });
  });
});
