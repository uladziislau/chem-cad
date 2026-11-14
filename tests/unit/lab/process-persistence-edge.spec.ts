import '@angular/compiler';
import { installMemoryLocalStorage } from './test-storage';
import { describe, it, expect, beforeEach } from 'vitest';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { CatalogService } from '@modules/lab/services/catalog.service';
import { ProcessPersistenceService } from '@modules/lab/services/process-persistence.service';
import { isOperationType, validateProcessStep } from '@root-modules/engine/process-step.interface';

const PROCESS_KEY = 'chem-cad.process.v1';

/**
 * Граничные случаи загрузки процесса из localStorage:
 * повреждённые шаги отбрасываются, валидные сохраняются.
 */
describe('ProcessPersistenceService — устойчивость к повреждённым данным', () => {
  let persistence: ProcessPersistenceService;

  beforeEach(() => {
    installMemoryLocalStorage();
    const injector = createEnvironmentInjector(
      [CatalogService, ProcessPersistenceService],
      null as unknown as EnvironmentInjector
    );
    persistence = injector.get(ProcessPersistenceService);
  });

  const seed = (value: unknown) =>
    localStorage.setItem(PROCESS_KEY, JSON.stringify(value));

  it('неизвестный тип операции → шаг отбрасывается', () => {
    seed({
      name: 'p',
      steps: [
        { id: 's1', name: 'ok', operation: 'MIX', durationMinutes: 5 },
        { id: 's2', name: 'bad', operation: 'EXPLODE', durationMinutes: 5 },
      ],
    });
    const loaded = persistence.load();
    expect(loaded).not.toBeNull();
    expect(loaded!.steps).toHaveLength(1);
    expect(loaded!.steps[0].id).toBe('s1');
  });

  it('невалидная длительность (0, -5, NaN-строка, отсутствует) → шаг отбрасывается', () => {
    seed({
      name: 'p',
      steps: [
        { id: 'ok', name: 'ok', operation: 'ADD', durationMinutes: 1 },
        { id: 'zero', name: 'z', operation: 'ADD', durationMinutes: 0 },
        { id: 'neg', name: 'n', operation: 'ADD', durationMinutes: -5 },
        { id: 'str', name: 's', operation: 'ADD', durationMinutes: 'abc' },
        { id: 'none', name: 'm', operation: 'ADD' },
      ],
    });
    const loaded = persistence.load();
    expect(loaded!.steps).toHaveLength(1);
    expect(loaded!.steps[0].id).toBe('ok');
  });

  it('все шаги битые → load() возвращает null', () => {
    seed({
      name: 'p',
      steps: [
        { id: 's1', name: 'x', operation: 'NOPE', durationMinutes: 1 },
        { id: 's2', name: 'y', operation: 'ADD', durationMinutes: -1 },
      ],
    });
    expect(persistence.load()).toBeNull();
  });

  it('шаги не-массив / null / отсутствие поля steps → null', () => {
    seed({ name: 'p', steps: 'oops' });
    expect(persistence.load()).toBeNull();
    seed({ name: 'p' });
    expect(persistence.load()).toBeNull();
    seed(null);
    expect(persistence.load()).toBeNull();
  });

  it('ингредиент с неположительной массой отбрасывается, валидный остаётся', () => {
    const injector = createEnvironmentInjector(
      [CatalogService, ProcessPersistenceService],
      null as unknown as EnvironmentInjector
    );
    const catalog = injector.get(CatalogService);
    const waterName = catalog.getIngredientById('ing_water')!.entity.getName();
    seed({
      name: 'p',
      steps: [{
        id: 's1', name: 'mix', operation: 'MIX', durationMinutes: 3,
        ingredients: [
          { entityName: waterName, massGrams: 50, category: 'water' },
          { entityName: waterName, massGrams: 0, category: 'water' },
          { entityName: waterName, massGrams: -10, category: 'water' },
          { entityName: 42, massGrams: 10, category: 'water' },
          { massGrams: 10, category: 'water' },
        ],
      }],
    });
    const loaded = persistence.load();
    expect(loaded!.steps[0].ingredients).toHaveLength(1);
    expect(loaded!.steps[0].ingredients![0].massGrams).toBe(50);
  });

  it('шаг без id получает сгенерированный, пустое имя — заглушку', () => {
    seed({
      name: 'p',
      steps: [{ operation: 'HEAT', durationMinutes: 10 }],
    });
    const loaded = persistence.load();
    expect(loaded!.steps[0].id).toBeTruthy();
    expect(loaded!.steps[0].name).toBe('Этап без названия');
    expect(loaded!.steps[0].operation).toBe('HEAT');
  });

  it('нечисловые targetTemperature/rpm/instructions отбрасываются в undefined', () => {
    seed({
      name: 'p',
      steps: [{
        id: 's1', name: 'heat', operation: 'HEAT', durationMinutes: 10,
        targetTemperature: 'hot', rpm: 'fast', instructions: 123,
      }],
    });
    const step = persistence.load()!.steps[0];
    expect(step.targetTemperature).toBeUndefined();
    expect(step.rpm).toBeUndefined();
    expect(step.instructions).toBeUndefined();
  });

  it('пустое/пробельное имя процесса → заглушка «Восстановленный процесс»', () => {
    seed({ name: '   ', steps: [{ id: 's', name: 'n', operation: 'ADD', durationMinutes: 1 }] });
    expect(persistence.load()!.name).toBe('Восстановленный процесс');
  });
});

describe('isOperationType / validateProcessStep — новые проверки', () => {
  const base = {
    id: 's1',
    name: 'step',
    operation: 'MIX' as const,
    durationMinutes: 5,
  };

  it('isOperationType принимает только известные операции', () => {
    expect(isOperationType('ADD')).toBe(true);
    expect(isOperationType('HOLD')).toBe(true);
    expect(isOperationType('mix')).toBe(false);
    expect(isOperationType('')).toBe(false);
    expect(isOperationType(42)).toBe(false);
    expect(isOperationType(null)).toBe(false);
  });

  it('validateProcessStep: пустой id, неизвестная операция, битый entity', () => {
    expect(validateProcessStep({ ...base, id: '' }).length).toBeGreaterThan(0);
    expect(validateProcessStep({ ...base, operation: 'BOGUS' as never }).some(i => i.includes('операц'))).toBe(true);
    expect(validateProcessStep({
      ...base,
      ingredients: [{ entity: null as never, massGrams: 10, category: 'x' }],
    }).some(i => i.includes('компонент'))).toBe(true);
  });
});
