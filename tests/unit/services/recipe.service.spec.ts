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
  steps: ['Смешать'],
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
});
