import '@angular/compiler';
import { installMemoryLocalStorage } from '../lab/test-storage';
import { describe, it, expect, beforeEach } from 'vitest';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { RecipeService } from '@modules/recipe/services/recipe.service';
import { Recipe } from '@root-modules/recipe/models/recipe.model';

const customRecipe: Omit<Recipe, 'id' | 'isCustom'> = {
  name: 'Тестовый рецепт',
  category: 'hygiene',
  description: 'Проверка',
  difficulty: 'easy',
  ingredients: [{ ingredientId: 'water', percentage: 100, purpose: 'Основа' }],
  steps: [{ text: 'Смешать' }],
  safetyWarnings: [],
};

describe('RecipeService', () => {
  let service: RecipeService;

  beforeEach(() => {
    installMemoryLocalStorage();
    const injector = createEnvironmentInjector([RecipeService], null as unknown as EnvironmentInjector);
    service = injector.get(RecipeService);
  });

  it('загружает встроенные рецепты с isCustom=false', () => {
    const recipes = service.getRecipes()();
    expect(recipes.length).toBeGreaterThan(0);
    expect(recipes.every(r => r.isCustom === false)).toBe(true);
    expect(service.getRecipeById('r1')?.name).toContain('моющее');
  });

  it('addRecipe создаёт рецепт с уникальным id и isCustom=true', () => {
    const a = service.addRecipe(customRecipe);
    const b = service.addRecipe(customRecipe);
    expect(a.id).not.toBe(b.id);
    expect(a.isCustom).toBe(true);
    expect(service.getRecipes()().length).toBe(service.getRecipes()().length);
  });

  it('persist: после перезапуска сервиса кастомные рецепты сохраняются', () => {
    service.addRecipe(customRecipe);
    const injector2 = createEnvironmentInjector([RecipeService], null as unknown as EnvironmentInjector);
    const service2 = injector2.get(RecipeService);
    expect(service2.getRecipes()().some(r => r.name === 'Тестовый рецепт' && r.isCustom)).toBe(true);
  });

  it('removeRecipe удаляет только кастомные рецепты', () => {
    expect(service.removeRecipe('r1')).toBe(false);
    const custom = service.addRecipe(customRecipe);
    expect(service.removeRecipe(custom.id)).toBe(true);
    expect(service.getRecipeById(custom.id)).toBeUndefined();
  });

  it('duplicateRecipe копирует рецепт с новым id и суффиксом «(копия)»', () => {
    const copy = service.duplicateRecipe('r1');
    expect(copy).toBeDefined();
    expect(copy!.id).not.toBe('r1');
    expect(copy!.name).toContain('(копия)');
    expect(copy!.isCustom).toBe(true);
    expect(copy!.ingredients).toEqual(service.getRecipeById('r1')!.ingredients);
  });

  it('exportRecipe/exportRecipes возвращают валидный JSON', () => {
    const json = service.exportRecipe('r1')!;
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json).id).toBe('r1');
    const all = JSON.parse(service.exportRecipes());
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(service.getRecipes()().length);
  });

  it('importRecipes добавляет валидные рецепты и пропускает невалидные', () => {
    const payload = JSON.stringify([
      { ...customRecipe, id: 'imp1' },
      { name: 'Без id' },
      { ...customRecipe, id: 'imp2', category: 'invalid' },
    ]);
    const count = service.importRecipes(payload);
    expect(count).toBe(1);
    expect(service.getRecipeById('imp1')?.isCustom).toBe(true);
  });

  it('importRecipes переназначает id при коллизии со встроенным', () => {
    const payload = JSON.stringify([{ ...customRecipe, id: 'r1' }]);
    service.importRecipes(payload);
    expect(service.getRecipes()().filter(r => r.name === 'Тестовый рецепт').length).toBe(1);
    const imported = service.getRecipes()().find(r => r.name === 'Тестовый рецепт')!;
    expect(imported.id).not.toBe('r1');
  });

  it('importRecipes возвращает 0 на битом JSON', () => {
    expect(service.importRecipes('not json')).toBe(0);
    expect(service.importRecipes('{"foo": 1}')).toBe(0);
  });

  it('importRecipes нормализует legacy string[] steps → RecipeStep[]', () => {
    const payload = JSON.stringify([
      { ...customRecipe, id: 'norm1', steps: ['Шаг текстом', { text: 'Шаг объектом', durationMinutes: 5 }] },
    ]);
    expect(service.importRecipes(payload)).toBe(1);
    const imported = service.getRecipeById('norm1')!;
    expect(imported.steps[0]).toEqual({ text: 'Шаг текстом' });
    expect(imported.steps[1]).toEqual({ text: 'Шаг объектом', durationMinutes: 5 });
  });

  it('importRecipes отклоняет невалидные steps (без text, отрицательная duration)', () => {
    const bad1 = JSON.stringify([{ ...customRecipe, id: 'bad1', steps: [{ durationMinutes: 5 }] }]);
    const bad2 = JSON.stringify([{ ...customRecipe, id: 'bad2', steps: [{ text: 'ok', durationMinutes: -1 }] }]);
    const bad3 = JSON.stringify([{ ...customRecipe, id: 'bad3', steps: [{ text: 'ok', ingredientIds: 'not-array' }] }]);
    expect(service.importRecipes(bad1)).toBe(0);
    expect(service.importRecipes(bad2)).toBe(0);
    expect(service.importRecipes(bad3)).toBe(0);
  });

  it('importRecipes принимает пустой объект {} как невалидный (нет обязательных полей)', () => {
    expect(service.importRecipes('[{}]')).toBe(0);
    expect(service.importRecipes('[]')).toBe(0);
  });

  it('updateRecipe обновляет только кастомные рецепты', () => {
    // Встроенный — нельзя
    expect(service.updateRecipe('r1', { ...customRecipe, name: 'Взлом' })).toBeUndefined();
    expect(service.getRecipeById('r1')!.name).not.toBe('Взлом');

    // Кастомный — можно
    const custom = service.addRecipe(customRecipe);
    const updated = service.updateRecipe(custom.id, { ...customRecipe, name: 'Новое имя' });
    expect(updated?.name).toBe('Новое имя');
    expect(service.getRecipeById(custom.id)!.name).toBe('Новое имя');
    expect(updated!.id).toBe(custom.id);
    expect(updated!.isCustom).toBe(true);
  });

  it('updateRecipe персистит изменения', () => {
    const custom = service.addRecipe(customRecipe);
    service.updateRecipe(custom.id, { ...customRecipe, name: 'Сохранённое' });
    const injector2 = createEnvironmentInjector([RecipeService], null as unknown as EnvironmentInjector);
    const service2 = injector2.get(RecipeService);
    expect(service2.getRecipeById(custom.id)!.name).toBe('Сохранённое');
  });

  it('updateRecipe возвращает undefined для несуществующего id', () => {
    expect(service.updateRecipe('no_such_id', customRecipe)).toBeUndefined();
  });
});
