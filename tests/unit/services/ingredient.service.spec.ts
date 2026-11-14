import '@angular/compiler';
import { installMemoryLocalStorage } from '../lab/test-storage';
import { describe, it, expect, beforeEach } from 'vitest';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { IngredientService } from '@modules/formulation/services/ingredient.service';
import { Ingredient } from '@root-modules/formulation/models/ingredient.model';

const customIngredient: Omit<Ingredient, 'id' | 'isCustom'> = {
  name: 'Тестовый ингредиент',
  type: 'additive',
  description: 'Проверка',
  safety: 'Безопасно',
};

describe('IngredientService', () => {
  let service: IngredientService;

  beforeEach(() => {
    installMemoryLocalStorage();
    const injector = createEnvironmentInjector([IngredientService], null as unknown as EnvironmentInjector);
    service = injector.get(IngredientService);
  });

  it('загружает встроенные ингредиенты с isCustom=false', () => {
    const ingredients = service.getIngredients()();
    expect(ingredients.length).toBeGreaterThan(0);
    expect(ingredients.every(i => i.isCustom === false)).toBe(true);
    expect(service.getIngredientById('water')?.name).toContain('вода');
  });

  it('addIngredient создаёт ингредиент с уникальным id и isCustom=true', () => {
    const a = service.addIngredient(customIngredient);
    const b = service.addIngredient(customIngredient);
    expect(a.id).not.toBe(b.id);
    expect(a.isCustom).toBe(true);
    expect(service.getIngredients()().length).toBeGreaterThan(20);
  });

  it('persist: после перезапуска сервиса кастомные ингредиенты сохраняются', () => {
    service.addIngredient(customIngredient);
    const injector2 = createEnvironmentInjector([IngredientService], null as unknown as EnvironmentInjector);
    const service2 = injector2.get(IngredientService);
    expect(service2.getIngredients()().some(i => i.name === 'Тестовый ингредиент' && i.isCustom)).toBe(true);
  });

  it('persist: в localStorage пишутся только кастомные', () => {
    service.addIngredient(customIngredient);
    const raw = JSON.parse(localStorage.getItem('chem-cad.ingredients.v1')!);
    expect(Array.isArray(raw)).toBe(true);
    expect(raw.every((i: Ingredient) => i.isCustom)).toBe(true);
    expect(raw.length).toBe(1);
  });

  it('updateIngredient обновляет только кастомные', () => {
    expect(service.updateIngredient('water', { name: 'X' })).toBeUndefined();
    const custom = service.addIngredient(customIngredient);
    const updated = service.updateIngredient(custom.id, { name: 'Новое имя' });
    expect(updated?.name).toBe('Новое имя');
    expect(service.getIngredientById(custom.id)?.name).toBe('Новое имя');
  });

  it('removeIngredient удаляет только кастомные', () => {
    expect(service.removeIngredient('water')).toBe(false);
    const custom = service.addIngredient(customIngredient);
    expect(service.removeIngredient(custom.id)).toBe(true);
    expect(service.getIngredientById(custom.id)).toBeUndefined();
  });

  it('exportIngredient/exportIngredients возвращают валидный JSON', () => {
    const json = service.exportIngredient('water')!;
    expect(JSON.parse(json).id).toBe('water');
    const all = JSON.parse(service.exportIngredients());
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(service.getIngredients()().length);
  });

  it('importIngredients добавляет валидные и пропускает невалидные', () => {
    const payload = JSON.stringify([
      { ...customIngredient, id: 'imp1' },
      { name: 'Без id' },
      { ...customIngredient, id: 'imp2', type: 'invalid' },
    ]);
    expect(service.importIngredients(payload)).toBe(1);
    expect(service.getIngredientById('imp1')?.isCustom).toBe(true);
  });

  it('importIngredients переназначает id при коллизии со встроенным', () => {
    const payload = JSON.stringify([{ ...customIngredient, id: 'water' }]);
    service.importIngredients(payload);
    const customs = service.getIngredients()().filter(i => i.name === 'Тестовый ингредиент');
    expect(customs.length).toBe(1);
    expect(customs[0].id).not.toBe('water');
  });

  it('importIngredients возвращает 0 на битом JSON', () => {
    expect(service.importIngredients('not json')).toBe(0);
    expect(service.importIngredients('{"foo": 1}')).toBe(0);
  });
});
