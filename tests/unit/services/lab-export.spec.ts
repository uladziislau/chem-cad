import { describe, it, expect } from 'vitest';
import {
  resolveCatalogIngredientId,
  labItemsToFormulationExport,
  LabFormulationItem,
} from '@root-modules/recipe/formulation-export';

const catalog = [
  { id: 'water', name: 'Дистиллированная вода' },
  { id: 'glycerin', name: 'Глицерин' },
  { id: 'sls', name: 'Лаурилсульфат натрия (SLS)' },
];

const labItem = (id: string, name: string, massGrams: number, extra = {}): LabFormulationItem => ({
  ingredient: { id, name, description: `${name} описание`, ...extra },
  massGrams,
});

describe('resolveCatalogIngredientId', () => {
  it('точный id совпадает', () => {
    expect(resolveCatalogIngredientId({ id: 'water', name: 'X' }, catalog)).toBe('water');
  });

  it('ing_-префикс отрезается', () => {
    expect(resolveCatalogIngredientId({ id: 'ing_water', name: 'Вода очищенная' }, catalog)).toBe('water');
  });

  it('совпадение по имени без учёта регистра', () => {
    expect(resolveCatalogIngredientId({ id: 'ing_x', name: 'глицерин' }, catalog)).toBe('glycerin');
  });

  it('null когда нет соответствия', () => {
    expect(resolveCatalogIngredientId({ id: 'ing_unknown', name: 'Неизвестное' }, catalog)).toBeNull();
  });
});

describe('labItemsToFormulationExport', () => {
  it('массы → проценты от суммы замапленных', () => {
    const { items, skipped } = labItemsToFormulationExport([
      labItem('ing_water', 'Вода очищенная', 70),
      labItem('ing_glycerin', 'Глицерин', 30),
    ], catalog);
    expect(skipped).toEqual([]);
    expect(items.map(i => i.ingredientId)).toEqual(['water', 'glycerin']);
    expect(items[0].percentage).toBe(70);
    expect(items[1].percentage).toBe(30);
  });

  it('неразрешимые ингредиенты пропускаются, проценты пересчитываются', () => {
    const { items, skipped } = labItemsToFormulationExport([
      labItem('ing_water', 'Вода', 50),
      labItem('ing_unmapped', 'Редкий компонент', 50),
    ], catalog);
    expect(skipped).toEqual(['Редкий компонент']);
    expect(items).toHaveLength(1);
    expect(items[0].percentage).toBe(100);
  });

  it('нулевые и отрицательные массы игнорируются', () => {
    const { items } = labItemsToFormulationExport([
      labItem('ing_water', 'Вода', 0),
      labItem('ing_glycerin', 'Глицерин', -5),
    ], catalog);
    expect(items).toEqual([]);
  });

  it('safety собирается из safetyLevel + ppe', () => {
    const { items } = labItemsToFormulationExport([
      labItem('ing_sls', 'SLS', 100, { safetyLevel: 'caution', ppe: ['Перчатки', 'Очки'] }),
    ], catalog);
    expect(items[0].safety).toBe('caution; Перчатки; Очки');
    expect(items[0].type).toBe('additive');
  });

  it('пустой вход → пустой выход', () => {
    expect(labItemsToFormulationExport([], catalog)).toEqual({ items: [], skipped: [] });
  });
});
