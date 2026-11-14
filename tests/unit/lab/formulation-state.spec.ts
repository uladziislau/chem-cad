import '@angular/compiler';
import { installMemoryLocalStorage } from './test-storage';
import { describe, it, expect, beforeEach } from 'vitest';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { CatalogService } from '@modules/lab/services/catalog.service';
import { FormulationPersistenceService } from '@modules/lab/services/formulation-persistence.service';
import { FormulationStateService } from '@modules/lab/services/formulation-state.service';
import { FormulationEntity } from '@domain/entities/formulation-entity';

const ITEMS_KEY = 'chem-cad.formulation.items.v1';
const PREMIXES_KEY = 'chem-cad.catalog.premixes.v1';

/**
 * Юнит-тесты персистентности рецептуры и премиксов (localStorage).
 */
describe('FormulationPersistenceService + FormulationStateService', () => {
  let catalog: CatalogService;
  let persistence: FormulationPersistenceService;
  let state: FormulationStateService;

  const water = () => catalog.getIngredientById('ing_water')!;
  const glycerin = () => catalog.getIngredientById('ing_glycerin')!;

  beforeEach(() => {
    installMemoryLocalStorage();
    const injector = createEnvironmentInjector(
      [CatalogService, FormulationPersistenceService, FormulationStateService],
      null as unknown as EnvironmentInjector
    );
    catalog = injector.get(CatalogService);
    persistence = injector.get(FormulationPersistenceService);
    state = injector.get(FormulationStateService);
  });

  describe('items roundtrip', () => {
    it('addIngredient сохраняет позиции в localStorage', () => {
      state.addIngredient(water(), 100);
      const raw = JSON.parse(localStorage.getItem(ITEMS_KEY)!);
      expect(raw).toEqual([{ ingredientId: 'ing_water', massGrams: 100 }]);
    });

    it('loadItems читает то, что записал saveItems', () => {
      persistence.saveItems([
        { id: 'x1', ingredient: water(), massGrams: 70 },
        { id: 'x2', ingredient: glycerin(), massGrams: 30 },
      ]);
      const loaded = persistence.loadItems();
      expect(loaded).toEqual([
        { ingredientId: 'ing_water', massGrams: 70 },
        { ingredientId: 'ing_glycerin', massGrams: 30 },
      ]);
    });

    it('битый JSON → пустой массив', () => {
      localStorage.setItem(ITEMS_KEY, '{{{');
      expect(persistence.loadItems()).toEqual([]);
    });

    it('записи с невалидными полями отфильтровываются', () => {
      localStorage.setItem(ITEMS_KEY, JSON.stringify([
        { ingredientId: 'ing_water', massGrams: 10 },
        { ingredientId: 42, massGrams: 10 },
        { ingredientId: 'ing_glycerin' },
        'garbage',
      ]));
      const loaded = persistence.loadItems();
      // Строка 'garbage' упадёт на .ingredientId доступе? — filter читает i.ingredientId,
      // у строки он undefined → отфильтруется. Число 42 → typeof !== string → фильтр.
      expect(loaded).toEqual([{ ingredientId: 'ing_water', massGrams: 10 }]);
    });

    it('новый FormulationStateService восстанавливает items из localStorage', () => {
      state.addIngredient(water(), 60);
      state.addIngredient(glycerin(), 40);

      // Новый injector = новая "сессия" приложения
      const injector2 = createEnvironmentInjector(
        [CatalogService, FormulationPersistenceService, FormulationStateService],
        null as unknown as EnvironmentInjector
      );
      const state2 = injector2.get(FormulationStateService);

      expect(state2.items()).toHaveLength(2);
      expect(state2.totalMass()).toBe(100);
      const ids = state2.items().map(i => i.ingredient.id).sort();
      expect(ids).toEqual(['ing_glycerin', 'ing_water']);
    });
  });

  describe('premixes roundtrip', () => {
    it('saveAsPremix добавляет ингредиент premix_* в каталог', () => {
      state.addIngredient(water(), 90);
      state.addIngredient(glycerin(), 10);

      state.saveAsPremix('Тестовый премикс');

      const premix = catalog.getAllIngredients().find(i => i.name === 'Тестовый премикс');
      expect(premix).toBeDefined();
      expect(premix!.id).toMatch(/^premix_/);
      expect(premix!.entity).toBeInstanceOf(FormulationEntity);
      expect((premix!.entity as FormulationEntity).getRecipe()).toHaveLength(2);
    });

    it('savePremixes пишет только premix_* ингредиенты', () => {
      state.addIngredient(water(), 90);
      state.addIngredient(glycerin(), 10);
      state.saveAsPremix('Премикс А');

      persistence.savePremixes();
      const stored = JSON.parse(localStorage.getItem(PREMIXES_KEY)!);
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toMatch(/^premix_/);
      expect(stored[0].name).toBe('Премикс А');
      expect(stored[0].recipe.length).toBeGreaterThan(0);
    });

    it('loadPremixes восстанавливает премикс в новом injector', () => {
      state.addIngredient(water(), 90);
      state.addIngredient(glycerin(), 10);
      state.saveAsPremix('Премикс Б');
      persistence.savePremixes();

      const injector2 = createEnvironmentInjector(
        [CatalogService, FormulationPersistenceService, FormulationStateService],
        null as unknown as EnvironmentInjector
      );
      const catalog2 = injector2.get(CatalogService);
      const persistence2 = injector2.get(FormulationPersistenceService);
      persistence2.loadPremixes();

      const premix = catalog2.getAllIngredients().find(i => i.name === 'Премикс Б');
      expect(premix).toBeDefined();
      expect(premix!.entity).toBeInstanceOf(FormulationEntity);
      expect((premix!.entity as FormulationEntity).getRecipe().length).toBeGreaterThan(0);
    });

    it('loadPremixes с битым JSON → молча пропускает', () => {
      localStorage.setItem(PREMIXES_KEY, 'not json');
      expect(() => persistence.loadPremixes()).not.toThrow();
      expect(catalog.getAllIngredients().every(i => !i.id.startsWith('premix_'))).toBe(true);
    });
  });
});
