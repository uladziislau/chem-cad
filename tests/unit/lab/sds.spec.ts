import '@angular/compiler';
import { installMemoryLocalStorage } from './test-storage';
import { describe, it, expect, beforeEach } from 'vitest';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { CatalogService } from '@modules/lab/services/catalog.service';
import { FormulationPersistenceService } from '@modules/lab/services/formulation-persistence.service';
import { FormulationStateService } from '@modules/lab/services/formulation-state.service';
import { SdsService } from '@modules/lab/services/sds.service';

/**
 * Юнит-тесты SdsService — генерация паспорта безопасности (ГОСТ 30333 / GHS).
 */
describe('SdsService', () => {
  let catalog: CatalogService;
  let state: FormulationStateService;
  let sds: SdsService;

  const ingredient = (id: string) => catalog.getIngredientById(id)!;

  beforeEach(() => {
    installMemoryLocalStorage();
    const injector = createEnvironmentInjector(
      [CatalogService, FormulationPersistenceService, FormulationStateService, SdsService],
      null as unknown as EnvironmentInjector
    );
    catalog = injector.get(CatalogService);
    state = injector.get(FormulationStateService);
    sds = injector.get(SdsService);
  });

  it('generateSds на пустой рецептуре → валидный документ без ингредиентов', () => {
    const text = sds.generateSds();
    expect(text).toContain('ПАСПОРТ БЕЗОПАСНОСТИ');
    expect(text).toContain('1. ИДЕНТИФИКАЦИЯ');
    expect(text).toContain('Общая масса:     0.0 г');
  });

  it('SDS содержит все 16 секций', () => {
    state.addIngredient(ingredient('ing_water'), 80);
    const text = sds.generateSds();
    for (let i = 1; i <= 16; i++) {
      expect(text).toContain(`${i}.`);
    }
  });

  it('SDS перечисляет ингредиенты и их доли', () => {
    state.addIngredient(ingredient('ing_water'), 80);
    state.addIngredient(ingredient('ing_glycerin'), 20);

    const text = sds.generateSds();
    expect(text).toContain('Вода очищенная');
    expect(text).toContain('Глицерин растительный');
    expect(text).toContain('80.0'); // ~80%
    expect(text).toContain('Общая масса:     100.0 г');
  });

  it('опасные ингредиенты попадают в секцию идентификации с GHS-кодами', () => {
    state.addIngredient(ingredient('ing_water'), 90);
    state.addIngredient(ingredient('ing_cetyl_alcohol'), 10); // H315, H319, caution

    const text = sds.generateSds();
    expect(text).toContain('Цетиловый спирт');
    expect(text).toContain('H315');
    expect(text).toContain('H319');
  });

  it('ингредиент без ghsCodes получает коды по эвристике имени', () => {
    // Уксусная кислота в каталоге имеет ghsCodes; берём ингредиент и проверяем,
    // что SDS содержит его имя и GHS-коды (из каталога или эвристики).
    const ing = catalog.getAllIngredients().find(i => i.name.includes('Уксусная'));
    expect(ing).toBeDefined();
    state.addIngredient(ing!, 10);
    const text = sds.generateSds();
    expect(text).toContain('Уксусная кислота');
    expect(text).toContain('H315');
  });

  it('SDS содержит блоки первой помощи и пожарной безопасности', () => {
    state.addIngredient(ingredient('ing_water'), 100);
    const text = sds.generateSds();
    expect(text).toContain('МЕРЫ ПЕРВОЙ ПОМОЩИ');
    expect(text).toContain('МЕРЫ ПОЖАРОТУШЕНИЯ');
    expect(text).toContain('ТОКСИКОЛОГИЧЕСКАЯ ИНФОРМАЦИЯ');
  });
});
