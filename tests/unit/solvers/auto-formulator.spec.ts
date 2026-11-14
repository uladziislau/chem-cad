import { describe, it, expect } from 'vitest';
import { AutoFormulator } from '@root-modules/solvers/auto-formulator';
import { PureSubstance } from '@domain/entities/pure-substance';
import { Oil } from '@domain/entities/oil';
import { Surfactant } from '@domain/entities/surfactant';
import { Mass } from '@root-modules/units/quantities';

const water = new PureSubstance('Water', 18.015, 8.07, 1730, 233, 1.0, 1.0);
const oil = new Oil('Light Oil', 300, 6.0, 10, 1, true, 0, 0, 0, 0.8, 0, 0.0001, 3000, 0, 8);
const surfLow = new Surfactant('Span-80', 428, 4.3, 10, 1, true, 0, 0, 0, 1.0, 0, 0.0001, 3500, 0, -2);
const surfHigh = new Surfactant('Tween-80', 1310, 15.0, 8, 1, true, 0, 0, 0, 1.0, 0, 0.0001, 3500, 0, 2);

describe('AutoFormulator (Оптимизация рецептуры)', () => {
  it('optimizeEmulsion: подбирает пару ПАВ по HLB', () => {
    const report = AutoFormulator.optimizeEmulsion(
      oil, new Mass(50, 'g'),
      water, new Mass(50, 'g'),
      [surfLow, surfHigh],
      new Mass(5, 'g')
    );
    expect(report.mixture).toBeDefined();
    expect(report.surfactantsUsed.length).toBe(2);
    expect(report.totalCost).toBeGreaterThanOrEqual(0);
  });

  it('optimizeEmulsion: результат содержит компоненты', () => {
    const report = AutoFormulator.optimizeEmulsion(
      oil, new Mass(50, 'g'),
      water, new Mass(50, 'g'),
      [surfLow, surfHigh],
      new Mass(5, 'g')
    );
    const components = report.mixture.getComponents();
    expect(components.length).toBeGreaterThanOrEqual(4); // water + oil + 2 surfactants
  });

  it('optimizeEmulsion: один ПАВ с обеих сторон HLB → ошибка', () => {
    // Оба ПАВ ниже targetHLB=8 → нет highHLB кандидатов
    const lowOnly = new Surfactant('Low1', 100, 4.0, 10, 1, true);
    const lowOnly2 = new Surfactant('Low2', 100, 5.0, 10, 1, true);
    expect(() => AutoFormulator.optimizeEmulsion(
      oil, new Mass(50, 'g'),
      water, new Mass(50, 'g'),
      [lowOnly, lowOnly2],
      new Mass(5, 'g')
    )).toThrow();
  });

  it('createStableEmulsion: возвращает Mixture', () => {
    const mix = AutoFormulator.createStableEmulsion(
      oil, 50, water, 50,
      [surfLow, surfHigh], 5
    );
    expect(mix.getComponents().length).toBeGreaterThan(0);
  });
});
