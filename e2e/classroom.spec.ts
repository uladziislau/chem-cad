import { test, expect } from '@playwright/test';

test.describe('Classroom lesson navigation', () => {
  test('lesson card opens interactive lesson and back returns to list', async ({ page }) => {
    await page.goto('/classroom/lessons');
    await expect(page.locator('app-lesson-list')).toBeVisible({ timeout: 15000 });

    const firstLink = page.locator('a[href*="/classroom/lesson/"]').first();
    await expect(firstLink).toBeVisible();
    const href = await firstLink.getAttribute('href');
    expect(href).toMatch(/lesson\//);

    await firstLink.click();
    await expect(page.locator('app-interactive-lesson')).toBeVisible({ timeout: 15000 });
    // Лабораторный стол присутствует
    await expect(page.getByText('Лабораторный стол')).toBeVisible({ timeout: 10000 });
    // Кнопка «назад» ведёт к списку
    await page.locator('a[href="/classroom"]').first().click();
    await expect(page.locator('app-lesson-list')).toBeVisible({ timeout: 15000 });
  });

  test('unknown lesson id shows not-found', async ({ page }) => {
    await page.goto('/classroom/lesson/nonexistent_id');
    await expect(page.locator('app-interactive-lesson')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Урок не найден')).toBeVisible({ timeout: 10000 });
  });
});
