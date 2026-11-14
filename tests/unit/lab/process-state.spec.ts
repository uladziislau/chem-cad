import '@angular/compiler';
import { installMemoryLocalStorage } from './test-storage';
import { describe, it, expect, beforeEach } from 'vitest';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { CatalogService } from '@modules/lab/services/catalog.service';
import { ProcessPersistenceService } from '@modules/lab/services/process-persistence.service';
import { ProcessStateService } from '@modules/lab/services/process-state.service';
import { ManufacturingProcess } from '@root-modules/engine/process-step.interface';

const PROCESS_KEY = 'chem-cad.process.v1';

/**
 * Юнит-тесты ProcessStateService и ProcessPersistenceService.
 */
describe('ProcessStateService + ProcessPersistenceService', () => {
  let catalog: CatalogService;
  let persistence: ProcessPersistenceService;
  let state: ProcessStateService;

  const waterEntity = () => catalog.getIngredientById('ing_water')!.entity;

  beforeEach(() => {
    installMemoryLocalStorage();
    const injector = createEnvironmentInjector(
      [CatalogService, ProcessPersistenceService, ProcessStateService],
      null as unknown as EnvironmentInjector
    );
    catalog = injector.get(CatalogService);
    persistence = injector.get(ProcessPersistenceService);
    state = injector.get(ProcessStateService);
  });

  describe('ProcessStateService — шаги', () => {
    it('начальное состояние: пустой процесс', () => {
      expect(state.currentProcess().steps).toEqual([]);
      expect(state.currentProcess().name).toBe('Новый технологический процесс');
      expect(state.activeStepIndex()).toBe(0);
      expect(state.simulationResults()).toEqual([]);
      expect(state.currentStepResult()).toBeNull();
    });

    it('addStep создаёт шаг с дефолтами по типу операции', () => {
      state.addStep('MIX');
      const mix = state.currentProcess().steps[0];
      expect(mix.operation).toBe('MIX');
      expect(mix.name).toBe('Перемешивание');
      expect(mix.rpm).toBe(1000);
      expect(mix.durationMinutes).toBe(10);
      expect(mix.targetTemperature).toBe(25);
      expect(state.activeStepIndex()).toBe(0);
    });

    it('addStep выставляет rpm для EMULSIFY/HEAT/HOLD', () => {
      state.addStep('EMULSIFY');
      state.addStep('HEAT');
      state.addStep('HOLD');
      const steps = state.currentProcess().steps;
      expect(steps[0].rpm).toBe(5000);
      expect(steps[0].name).toBe('Гомогенизация (Эмульгирование)');
      expect(steps[1].rpm).toBe(0);
      expect(steps[1].name).toBe('Нагрев');
      expect(steps[2].rpm).toBe(0);
      expect(steps[2].name).toBe('Выдержка');
      expect(state.activeStepIndex()).toBe(2);
    });

    it('updateStep меняет поля и сохраняет процесс', () => {
      state.addStep('MIX');
      const stepId = state.currentProcess().steps[0].id;
      state.updateStep(stepId, { durationMinutes: 30, rpm: 2500, instructions: 'тщательно' });

      const step = state.currentProcess().steps[0];
      expect(step.durationMinutes).toBe(30);
      expect(step.rpm).toBe(2500);
      expect(step.instructions).toBe('тщательно');

      const stored = JSON.parse(localStorage.getItem(PROCESS_KEY)!);
      expect(stored.steps[0].durationMinutes).toBe(30);
    });

    it('removeStep удаляет шаг и клампит activeStepIndex', () => {
      state.addStep('MIX');
      state.addStep('HEAT');
      state.addStep('COOL');
      expect(state.activeStepIndex()).toBe(2);

      const lastId = state.currentProcess().steps[2].id;
      state.removeStep(lastId);
      expect(state.currentProcess().steps).toHaveLength(2);
      expect(state.activeStepIndex()).toBe(1);

      const midId = state.currentProcess().steps[0].id;
      state.removeStep(midId);
      expect(state.currentProcess().steps).toHaveLength(1);
      expect(state.activeStepIndex()).toBe(0);
    });

    it('addIngredientsToStep добавляет ингредиенты к нужному шагу', () => {
      state.addStep('ADD');
      const stepId = state.currentProcess().steps[0].id;
      state.addIngredientsToStep(stepId, [
        { entity: waterEntity(), massGrams: 50, category: 'water' },
      ]);

      const step = state.currentProcess().steps[0];
      expect(step.ingredients).toHaveLength(1);
      expect(step.ingredients![0].massGrams).toBe(50);
      expect(step.ingredients![0].entity).toBe(waterEntity());
    });

    it('moveStep меняет порядок и сохраняет активный шаг по id', () => {
      state.addStep('MIX');
      state.addStep('HEAT');
      state.addStep('COOL');
      // activeStepIndex = 2 (COOL)
      const [mix, heat, cool] = state.currentProcess().steps;

      state.moveStep(2, 0); // COOL → первая позиция
      const steps = state.currentProcess().steps;
      expect(steps.map(s => s.id)).toEqual([cool.id, mix.id, heat.id]);
      expect(state.activeStepIndex()).toBe(0); // COOL остался активным
    });

    it('moveStep игнорирует невалидные индексы и no-op', () => {
      state.addStep('MIX');
      state.addStep('HEAT');
      const before = state.currentProcess().steps.map(s => s.id);

      state.moveStep(0, 0);      // no-op
      state.moveStep(-1, 1);     // out of range
      state.moveStep(0, 99);     // out of range
      state.moveStep(1, -5);     // out of range

      expect(state.currentProcess().steps.map(s => s.id)).toEqual(before);
      expect(state.activeStepIndex()).toBe(1);
    });

    it('moveStep персистит новый порядок', () => {
      state.addStep('MIX');
      state.addStep('HEAT');
      const [mix, heat] = state.currentProcess().steps;

      state.moveStep(1, 0); // HEAT → 0
      const restored = persistence.load();
      expect(restored!.steps.map(s => s.id)).toEqual([heat.id, mix.id]);
    });
  });

  describe('ProcessStateService — валидация шагов', () => {
    it('валидный шаг не попадает в stepIssues', () => {
      state.addStep('MIX');
      expect(state.stepIssues().size).toBe(0);
    });

    it('пустое название и неположительная длительность дают ошибки', () => {
      state.addStep('MIX');
      const id = state.currentProcess().steps[0].id;
      state.updateStep(id, { name: '   ', durationMinutes: 0 });

      const issues = state.stepIssues().get(id)!;
      expect(issues.length).toBeGreaterThanOrEqual(2);
      expect(issues.some(i => i.includes('Название'))).toBe(true);
      expect(issues.some(i => i.includes('Длительность'))).toBe(true);
    });

    it('нечисловая температура и отрицательный rpm дают ошибки', () => {
      state.addStep('MIX');
      const id = state.currentProcess().steps[0].id;
      state.updateStep(id, { targetTemperature: NaN, rpm: -100 });

      const issues = state.stepIssues().get(id)!;
      expect(issues.some(i => i.includes('температура'))).toBe(true);
      expect(issues.some(i => i.includes('вращения'))).toBe(true);
    });

    it('нулевая масса ингредиента даёт ошибку', () => {
      state.addStep('ADD');
      const id = state.currentProcess().steps[0].id;
      state.addIngredientsToStep(id, [
        { entity: waterEntity(), massGrams: 0, category: 'water' },
      ]);

      const issues = state.stepIssues().get(id)!;
      expect(issues.some(i => i.includes('компонент'))).toBe(true);
    });

    it('несколько шагов: ошибки только у невалидных', () => {
      state.addStep('MIX');
      state.addStep('HEAT');
      const [good, bad] = state.currentProcess().steps;
      state.updateStep(bad.id, { durationMinutes: -5 });

      expect(state.stepIssues().has(good.id)).toBe(false);
      expect(state.stepIssues().has(bad.id)).toBe(true);
    });
  });

  describe('ProcessPersistenceService', () => {
    it('save/load roundtrip с ингредиентами', () => {
      const process: ManufacturingProcess = {
        id: 'p1',
        name: 'Тестовый процесс',
        createdAt: new Date(),
        steps: [{
          id: 's1',
          name: 'Добавление воды',
          operation: 'ADD',
          durationMinutes: 5,
          rpm: 500,
          targetTemperature: 30,
          ingredients: [{ entity: waterEntity(), massGrams: 100, category: 'water' }],
        }],
      };
      persistence.save(process);

      const loaded = persistence.load();
      expect(loaded).not.toBeNull();
      expect(loaded!.name).toBe('Тестовый процесс');
      expect(loaded!.steps).toHaveLength(1);
      expect(loaded!.steps[0].operation).toBe('ADD');
      expect(loaded!.steps[0].ingredients).toHaveLength(1);
      expect(loaded!.steps[0].ingredients![0].entity).toBe(waterEntity());
      expect(loaded!.steps[0].ingredients![0].massGrams).toBe(100);
    });

    it('load → null при пустом localStorage', () => {
      expect(persistence.load()).toBeNull();
    });

    it('load → null при битом JSON', () => {
      localStorage.setItem(PROCESS_KEY, '{{{');
      expect(persistence.load()).toBeNull();
    });

    it('load → null при пустом списке шагов', () => {
      localStorage.setItem(PROCESS_KEY, JSON.stringify({ name: 'x', steps: [] }));
      expect(persistence.load()).toBeNull();
    });

    it('неизвестный ингредиент отбрасывается при десериализации', () => {
      localStorage.setItem(PROCESS_KEY, JSON.stringify({
        name: 'p',
        steps: [{
          id: 's1', name: 'n', operation: 'ADD', durationMinutes: 1,
          ingredients: [
            { entityName: 'definitely-not-in-catalog', massGrams: 10, category: 'water' },
          ],
        }],
      }));
      const loaded = persistence.load();
      expect(loaded!.steps[0].ingredients).toBeUndefined();
    });

    it('ProcessStateService восстанавливает процесс из localStorage в новом injector', () => {
      state.addStep('MIX');
      const stepId = state.currentProcess().steps[0].id;
      state.updateStep(stepId, { durationMinutes: 42 });
      state.addStep('HEAT');

      const injector2 = createEnvironmentInjector(
        [CatalogService, ProcessPersistenceService, ProcessStateService],
        null as unknown as EnvironmentInjector
      );
      const state2 = injector2.get(ProcessStateService);

      expect(state2.currentProcess().steps).toHaveLength(2);
      expect(state2.currentProcess().steps[0].durationMinutes).toBe(42);
      expect(state2.currentProcess().steps[1].operation).toBe('HEAT');
    });
  });
});
