import '@angular/compiler';
import { installMemoryLocalStorage } from './test-storage';
import { describe, it, expect, beforeEach } from 'vitest';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { CatalogService } from '@modules/lab/services/catalog.service';
import { VersionHistoryService, FormulationSnapshot } from '@modules/lab/services/version-history.service';

/**
 * Юнит-тесты VersionHistoryService — версии рецептур в localStorage.
 */
describe('VersionHistoryService', () => {
  let service: VersionHistoryService;

  const snapshot = (items: { ingredientId: string; massGrams: number }[]): Omit<FormulationSnapshot, 'id' | 'createdAt' | 'name'> => ({
    temperatureC: 25,
    mixerRpm: 3000,
    mixingTimeMin: 10,
    totalMassG: items.reduce((s, i) => s + i.massGrams, 0),
    items,
  });

  beforeEach(() => {
    installMemoryLocalStorage();
    const injector = createEnvironmentInjector([CatalogService, VersionHistoryService], null as unknown as EnvironmentInjector);
    service = injector.get(VersionHistoryService);
  });

  it('saveVersion нумерует версии и связывает parentId', () => {
    const v1 = service.saveVersion('v1', snapshot([{ ingredientId: 'ing_water', massGrams: 100 }]));
    const v2 = service.saveVersion('v2', snapshot([{ ingredientId: 'ing_water', massGrams: 90 }]));

    expect(v1.version).toBe(1);
    expect(v2.version).toBe(2);
    expect(v1.parentId).toBeUndefined();
    expect(v2.parentId).toBe(v1.id);
    expect(v1.id).toBeTruthy();
    expect(v1.createdAt).toBeTruthy();
  });

  it('listVersions возвращает новые первыми', () => {
    service.saveVersion('первая', snapshot([{ ingredientId: 'ing_water', massGrams: 100 }]));
    service.saveVersion('вторая', snapshot([{ ingredientId: 'ing_water', massGrams: 90 }]));
    service.saveVersion('третья', snapshot([{ ingredientId: 'ing_water', massGrams: 80 }]));

    const list = service.listVersions();
    expect(list.map(v => v.version)).toEqual([3, 2, 1]);
  });

  it('restoreItems резолвит ингредиенты через каталог', () => {
    const v = service.saveVersion('тест', snapshot([
      { ingredientId: 'ing_water', massGrams: 80 },
      { ingredientId: 'ing_glycerin', massGrams: 20 },
    ]));

    const items = service.restoreItems(v.id);
    expect(items).toHaveLength(2);
    expect(items[0].ingredient.id).toBe('ing_water');
    expect(items[0].massGrams).toBe(80);
    expect(items[1].ingredient.id).toBe('ing_glycerin');
  });

  it('restoreItems пропускает ингредиенты, которых нет в каталоге', () => {
    const v = service.saveVersion('битая', snapshot([
      { ingredientId: 'ing_water', massGrams: 50 },
      { ingredientId: 'ghost_id', massGrams: 50 },
    ]));

    const items = service.restoreItems(v.id);
    expect(items).toHaveLength(1);
    expect(items[0].ingredient.id).toBe('ing_water');
  });

  it('restoreItems для несуществующей версии → пустой массив', () => {
    expect(service.restoreItems('no-such-id')).toEqual([]);
  });

  it('deleteVersion удаляет запись', () => {
    const v1 = service.saveVersion('a', snapshot([{ ingredientId: 'ing_water', massGrams: 10 }]));
    const v2 = service.saveVersion('b', snapshot([{ ingredientId: 'ing_water', massGrams: 20 }]));

    service.deleteVersion(v1.id);
    const list = service.listVersions();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(v2.id);
  });

  it('diffVersions возвращает только различия, отсортированные по |delta|', () => {
    const v1 = service.saveVersion('база', snapshot([
      { ingredientId: 'ing_water', massGrams: 80 },
      { ingredientId: 'ing_glycerin', massGrams: 20 },
    ]));
    const v2 = service.saveVersion('новая', snapshot([
      { ingredientId: 'ing_water', massGrams: 70 },
      { ingredientId: 'ing_glycerin', massGrams: 30 },
      { ingredientId: 'ing_salt', massGrams: 5 },
    ]));

    const diff = service.diffVersions(v1.id, v2.id);
    expect(diff).toHaveLength(3);

    const byId = new Map(diff.map(d => [d.ingredientId, d]));
    expect(byId.get('ing_water')).toMatchObject({ massA: 80, massB: 70, delta: -10 });
    expect(byId.get('ing_glycerin')).toMatchObject({ massA: 20, massB: 30, delta: 10 });
    // ing_salt появился только в v2 → massA = 0
    expect(byId.get('ing_salt')).toMatchObject({ massA: 0, massB: 5, delta: 5 });
    expect(byId.get('ing_water')!.name).toBe('Вода очищенная');

    // сортировка по убыванию |delta|
    expect(Math.abs(diff[0].delta)).toBeGreaterThanOrEqual(Math.abs(diff[1].delta));
  });

  it('diffVersions для одинаковых версий → пустой массив', () => {
    const v = service.saveVersion('одинаковые', snapshot([{ ingredientId: 'ing_water', massGrams: 50 }]));
    expect(service.diffVersions(v.id, v.id)).toEqual([]);
  });

  it('diffVersions с несуществующим id → пустой массив', () => {
    const v = service.saveVersion('x', snapshot([{ ingredientId: 'ing_water', massGrams: 50 }]));
    expect(service.diffVersions(v.id, 'ghost')).toEqual([]);
  });

  it('битый JSON в localStorage → пустая история, без исключений', () => {
    localStorage.setItem('chem-cad.formulation-versions', '{broken json');
    expect(service.listVersions()).toEqual([]);
  });
});
