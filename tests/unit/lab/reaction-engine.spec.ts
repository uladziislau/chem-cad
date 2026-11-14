import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { ReactionEngineService } from '@modules/laboratory/services/reaction-engine.service';
import { REAGENTS, REACTION_RULES } from '@data/laboratory/chemistry.data';

/**
 * Юнит-тесты ReactionEngineService — виртуальная колба с реакциями.
 */
describe('ReactionEngineService', () => {
  let service: ReactionEngineService;

  beforeEach(() => {
    vi.useFakeTimers();
    const injector = createEnvironmentInjector([ReactionEngineService], null as unknown as EnvironmentInjector);
    service = injector.get(ReactionEngineService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('начальное состояние: пустая колба', () => {
    const s = service.flaskState();
    expect(s.contents).toEqual([]);
    expect(s.totalVolume).toBe(0);
    expect(s.temperature).toBe(20);
    expect(s.isExploded).toBe(false);
    expect(service.reactionLog()[0]).toContain('готова к работе');
  });

  it('addReagent добавляет реагент и считает моли', () => {
    service.addReagent('water', 100);
    const s = service.flaskState();
    expect(s.contents).toHaveLength(1);
    expect(s.contents[0].reagent.id).toBe('water');
    expect(s.contents[0].mass).toBe(100);
    expect(s.contents[0].moles).toBeCloseTo(100 / 18.015, 5);
    expect(s.totalVolume).toBe(100); // вода — жидкость
  });

  it('повторное добавление того же реагента суммирует массу и моли', () => {
    service.addReagent('water', 50);
    service.addReagent('water', 50);
    const s = service.flaskState();
    expect(s.contents).toHaveLength(1);
    expect(s.contents[0].mass).toBe(100);
    expect(s.totalVolume).toBe(100);
  });

  it('твёрдые реагенты не увеличивают объём', () => {
    service.addReagent('nahco3', 10); // solid
    expect(service.flaskState().totalVolume).toBe(0);
    expect(service.flaskState().contents[0].mass).toBe(10);
  });

  it('неизвестный reagentId игнорируется', () => {
    service.addReagent('no-such-reagent', 10);
    expect(service.flaskState().contents).toEqual([]);
  });

  it('нейтрализация HCl + NaOH → NaCl + H₂O, температура растёт, без взрыва в избытке воды', () => {
    service.addReagent('water', 100);
    service.addReagent('hcl', 3.646);  // ~0.1 моль
    service.addReagent('naoh', 4.0);   // ~0.1 моль

    const s = service.flaskState();
    const ids = s.contents.map(c => c.reagent.id);
    expect(ids).toContain('nacl');
    expect(ids).not.toContain('hcl');
    expect(ids).not.toContain('naoh');

    const nacl = s.contents.find(c => c.reagent.id === 'nacl')!;
    expect(nacl.moles).toBeCloseTo(0.1, 1);

    expect(s.temperature).toBeGreaterThan(20);
    expect(s.isExploded).toBe(false);
    expect(service.reactionLog()[0]).toContain('Реакция');
  });

  it('газообразные продукты не остаются в колбе', () => {
    // Fe + 2HCl → FeCl₂ + H₂↑ ; h2 — gas, должен фильтроваться.
    // HCl — лимитирующий (коэффициент 2): fe остаётся частично.
    service.addReagent('water', 200);
    service.addReagent('hcl', 7.292); // 0.2 моль
    service.addReagent('fe', 11.17);  // ~0.2 моль

    const s = service.flaskState();
    const ids = s.contents.map(c => c.reagent.id);
    expect(ids).not.toContain('h2');
    expect(ids).not.toContain('hcl');
    const fe = s.contents.find(c => c.reagent.id === 'fe');
    expect(fe).toBeDefined();
    expect(fe!.mass).toBeLessThan(11.17); // часть железа израсходована
    expect(s.contents.some(c => c.reagent.id === 'nacl')).toBe(true);
  });

  it('натрий + вода → взрыв', () => {
    service.addReagent('water', 50);
    service.addReagent('na', 10); // ~0.43 моль Na

    const s = service.flaskState();
    expect(s.isExploded).toBe(true);
    expect(s.activeEffect).toBe('explosion');
    expect(service.reactionLog().some(l => l.includes('ВЗРЫВ'))).toBe(true);
  });

  it('после взрыва добавление реагентов заблокировано', () => {
    service.addReagent('water', 50);
    service.addReagent('na', 10);
    expect(service.flaskState().isExploded).toBe(true);

    const contentsBefore = service.flaskState().contents.length;
    service.addReagent('hcl', 10);
    expect(service.flaskState().contents.length).toBe(contentsBefore);
  });

  it('activeEffect сбрасывается через 3 секунды', () => {
    // Fe + 2HCl → visualEffect 'bubbles' (нейтрализация имеет 'none')
    service.addReagent('water', 200);
    service.addReagent('hcl', 7.292);
    service.addReagent('fe', 11.17);
    expect(service.flaskState().activeEffect).toBe('bubbles');

    vi.advanceTimersByTime(3100);
    expect(service.flaskState().activeEffect).toBe('none');
  });

  it('resetFlask очищает колбу и лог', () => {
    service.addReagent('water', 100);
    service.resetFlask();
    const s = service.flaskState();
    expect(s.contents).toEqual([]);
    expect(s.totalVolume).toBe(0);
    expect(s.temperature).toBe(20);
    expect(service.reactionLog()).toEqual(['Лаборатория очищена.']);
  });

  it('getAvailableReagents возвращает каталог', () => {
    expect(service.getAvailableReagents()).toBe(REAGENTS);
    expect(REAGENTS.length).toBeGreaterThan(10);
    expect(REACTION_RULES.length).toBeGreaterThan(5);
  });
});
