import '@angular/compiler';
import { installMemoryLocalStorage } from '../lab/test-storage';
import { describe, it, expect, beforeEach } from 'vitest';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { IngredientService } from '@modules/formulation/services/ingredient.service';
import { FormulationDraftService } from '@modules/formulation/services/formulation-draft.service';
import { FormulationItem } from '@root-modules/formulation/models/ingredient.model';

const KEY = 'chem-cad.formulator.draft.v1';

function makeInjector() {
  return createEnvironmentInjector([IngredientService, FormulationDraftService], null as unknown as EnvironmentInjector);
}

describe('FormulationDraftService', () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  it('пустой черновик при отсутствии ключа', () => {
    const injector = makeInjector();
    const draft = injector.get(FormulationDraftService);
    expect(draft.getItems()()).toEqual([]);
  });

  it('setItems персистит {ingredientId, percentage} и roundtrip-восстанавливает', () => {
    const injector = makeInjector();
    const ingredients = injector.get(IngredientService);
    const draft = injector.get(FormulationDraftService);
    const water = ingredients.getIngredientById('water')!;

    draft.setItems([{ ingredient: water, percentage: 50 }]);

    const raw = JSON.parse(localStorage.getItem(KEY)!);
    expect(raw).toEqual([{ ingredientId: 'water', percentage: 50 }]);

    // Новый инжектор = «перезапуск»
    const injector2 = makeInjector();
    const draft2 = injector2.get(FormulationDraftService);
    const items = draft2.getItems()();
    expect(items.length).toBe(1);
    expect(items[0].ingredient.id).toBe('water');
    expect(items[0].percentage).toBe(50);
  });

  it('отбрасывает записи с неизвестным ingredientId и дубликаты', () => {
    localStorage.setItem(KEY, JSON.stringify([
      { ingredientId: 'water', percentage: 10 },
      { ingredientId: 'ghost_ingredient', percentage: 20 },
      { ingredientId: 'water', percentage: 30 }, // дубликат
      { ingredientId: '', percentage: 5 },       // невалидный id
      { ingredientId: 'glycerin', percentage: -1 }, // невалидный %
      'not-an-object',
    ]));
    const injector = makeInjector();
    const draft = injector.get(FormulationDraftService);
    const items = draft.getItems()();
    expect(items.length).toBe(1);
    expect(items[0].ingredient.id).toBe('water');
    expect(items[0].percentage).toBe(10);
  });

  it('повреждённый JSON → пустой черновик', () => {
    localStorage.setItem(KEY, '{broken');
    const injector = makeInjector();
    const draft = injector.get(FormulationDraftService);
    expect(draft.getItems()()).toEqual([]);
  });

  it('clear() удаляет ключ и сбрасывает items', () => {
    const injector = makeInjector();
    const ingredients = injector.get(IngredientService);
    const draft = injector.get(FormulationDraftService);
    const water = ingredients.getIngredientById('water')!;
    const glycerin: FormulationItem = { ingredient: water, percentage: 100 };

    draft.setItems([glycerin]);
    expect(localStorage.getItem(KEY)).not.toBeNull();

    draft.clear();
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(draft.getItems()()).toEqual([]);
  });
});
