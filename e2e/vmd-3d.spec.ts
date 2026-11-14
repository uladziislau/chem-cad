import { test, expect } from '@playwright/test';

/**
 * E2E-тесты страницы /simulator/vmd — VMD 3D визуализация молекул.
 * Three.js/WebGL в headless Chromium работает через SwiftShader;
 * тесты проверяют DOM/телеметрию и не падают при отсутствии GL-контекста
 * (renderer.init внутри Vmd3dRenderer может бросить — ловим на уровне страницы).
 */
test.describe('VMD 3D', () => {
  test('страница загружается и показывает заголовок', async ({ page }) => {
    await page.goto('/simulator/vmd');
    await expect(page.locator('app-vmd-3d')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('h1')).toContainText('VMD 3D');
  });

  test('canvas присутствует и телеметрия отображается', async ({ page }) => {
    await page.goto('/simulator/vmd');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 20000 });
    // HUD-элементы телеметрии
    await expect(page.locator('text=FPS')).toBeVisible();
    await expect(page.locator('text=Атомов')).toBeVisible();
    await expect(page.locator('text=Связей')).toBeVisible();
    await expect(page.locator('text=Температура')).toBeVisible();
  });

  test('молекула по умолчанию — газ (Аргон), счётчики атомов > 0', async ({ page }) => {
    await page.goto('/simulator/vmd');
    await expect(page.getByText(/Молекула: Аргон/)).toBeVisible({ timeout: 20000 });
    // Газ Аргон: 500 частиц — ждём пока сигнал обновится до числа
    const atomCount = page.locator('.grid span.text-indigo-400').first();
    await expect(atomCount).toHaveText('500', { timeout: 15000 });
  });

  test('FPS обновляется (симуляция работает)', async ({ page }) => {
    await page.goto('/simulator/vmd');
    await expect(page.locator('app-vmd-3d')).toBeVisible({ timeout: 20000 });
    // Ждём пока цикл rAF накопит кадры — FPS появится в течение ~2с
    const fpsCell = page.locator('.grid span.text-emerald-400, .grid span.text-rose-400').first();
    await expect(fpsCell).not.toHaveText('0', { timeout: 15000 });
  });

  test('переключение режимов рендеринга меняет активную кнопку', async ({ page }) => {
    await page.goto('/simulator/vmd');
    await expect(page.locator('app-vmd-3d')).toBeVisible({ timeout: 20000 });

    const ballStick = page.getByRole('button', { name: 'Ball-Stick' });
    await ballStick.click();
    await expect(ballStick).toHaveClass(/bg-indigo-500/);

    const spaceFill = page.getByRole('button', { name: 'Space Fill' });
    await spaceFill.click();
    await expect(spaceFill).toHaveClass(/bg-indigo-500/);
    await expect(ballStick).not.toHaveClass(/bg-indigo-500\/30/);
  });

  test('пауза/запуск переключает состояние кнопки', async ({ page }) => {
    await page.goto('/simulator/vmd');
    await expect(page.locator('app-vmd-3d')).toBeVisible({ timeout: 20000 });

    const pauseBtn = page.getByRole('button', { name: /Пауза|Запуск/ });
    await expect(pauseBtn).toHaveText(/Пауза/); // isRunning=true по умолчанию
    await pauseBtn.click();
    await expect(page.getByRole('button', { name: 'Запуск' })).toBeVisible();
    await page.getByRole('button', { name: 'Запуск' }).click();
    await expect(page.getByRole('button', { name: 'Пауза' })).toBeVisible();
  });

  test('кнопка «Газ (Аргон)» сбрасывает симуляцию и обновляет имя молекулы', async ({ page }) => {
    await page.goto('/simulator/vmd');
    await expect(page.getByText(/Молекула: Аргон/)).toBeVisible({ timeout: 20000 });

    // Сначала переключим режим, чтобы состояние отличалось
    await page.getByRole('button', { name: 'Ball-Stick' }).click();
    // Сброс газа
    await page.getByRole('button', { name: /Газ \(Аргон\)/ }).click();
    await expect(page.getByText(/Молекула: Аргон/)).toBeVisible();
    await expect(page.locator('text=Молекула:')).toBeVisible();
  });

  test('переключатель меток ABC/Aa работает', async ({ page }) => {
    await page.goto('/simulator/vmd');
    await expect(page.locator('app-vmd-3d')).toBeVisible({ timeout: 20000 });

    const labelBtn = page.getByRole('button', { name: 'Aa', exact: true });
    await expect(labelBtn).toBeVisible(); // showLabels=false по умолчанию
    await labelBtn.click();
    const abcBtn = page.getByRole('button', { name: 'ABC', exact: true });
    await expect(abcBtn).toBeVisible();
    await abcBtn.click();
    await expect(labelBtn).toBeVisible();
  });

  test('температура — положительное число (кинетическая энергия частиц)', async ({ page }) => {
    await page.goto('/simulator/vmd');
    await expect(page.locator('app-vmd-3d')).toBeVisible({ timeout: 20000 });

    // Ждём несколько кадров физики
    const tempCell = page.locator('.grid .text-orange-400').first();
    await expect(tempCell).not.toHaveText('0.0 K', { timeout: 15000 });
    const text = await tempCell.textContent();
    expect(text).toMatch(/\d+\.\d K/);
  });
});
