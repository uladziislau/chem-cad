import { describe, it, expect } from 'vitest';
import { DryingSolver } from '@root-modules/solvers/drying-solver';
import { MultiphaseSystem } from '@domain/entities/multiphase-system';
import { Phase } from '@domain/entities/phase';
import { Mixture } from '@domain/entities/mixture';
import { Mass } from '@root-modules/units/quantities';
import { PureSubstance } from '@domain/entities/pure-substance';
import { Oil } from '@domain/entities/oil';

// Летучий растворитель (низкая t кипения)
const ethanol = new PureSubstance('Ethanol', 46.07, 8.20, 1642, 230, 0.789);
// Высококипящий растворитель
const water = new PureSubstance('Water', 18.015, 8.07, 1730, 233, 1.0);
// Высыхающее масло (с реальными константами Антуана для температур кипения > 200°C)
const linseedOil = new Oil('Linseed Oil', 880, 10, 8, 1, true, 8.5, 3000, 300, 0.93, -10, 0.0001, 3000, 0, 10);
// Нелетучее масло
const mineralOil = new Oil('Mineral Oil', 300, 12, 3, 0, false, 0, 0, 0, 0.85, -20, 0.0001, 4000, 0, 15);

function makePhase(entity: typeof ethanol | typeof water | typeof linseedOil | typeof mineralOil, grams: number) {
  const mix = new Mixture();
  mix.addComponent(entity, new Mass(grams, 'g'));
  return new Phase(mix, new Mass(grams, 'g'), 25);
}

describe('DryingSolver (Время высыхания)', () => {
  it('чистый летучий растворитель → испарение', () => {
    const sys = new MultiphaseSystem([makePhase(ethanol, 100)], []);
    const report = DryingSolver.evaluate(sys, 25);
    expect(report.volatilePercent).toBeGreaterThan(50);
    expect(report.mechanism).toBe('evaporation');
    expect(report.touchDryTimeMin).toBeGreaterThan(0);
  });

  it('чистое высыхающее масло → окислительная полимеризация', () => {
    const sys = new MultiphaseSystem([makePhase(linseedOil, 100)], []);
    const report = DryingSolver.evaluate(sys, 25);
    expect(report.mechanism).toBe('oxidation');
    expect(report.fullDryTimeMin).toBeGreaterThan(100);
  });

  it('смесь растворителя и масла → гибридный механизм', () => {
    const aq = makePhase(ethanol, 40);
    aq.composition.addComponent(linseedOil, new Mass(60, 'g'));
    const sys = new MultiphaseSystem([aq], []);
    const report = DryingSolver.evaluate(sys, 25);
    expect(report.mechanism).toBe('hybrid');
    expect(report.stages.length).toBeGreaterThan(1);
  });

  it('высокая температура ускоряет высыхание', () => {
    const sys = new MultiphaseSystem([makePhase(ethanol, 100)], []);
    const cold = DryingSolver.evaluate(sys, 10);
    const hot = DryingSolver.evaluate(sys, 40);
    expect(hot.touchDryTimeMin).toBeLessThan(cold.touchDryTimeMin);
  });

  it('пустая система → нулевое время', () => {
    const sys = new MultiphaseSystem([], []);
    const report = DryingSolver.evaluate(sys);
    expect(report.touchDryTimeMin).toBe(0);
    expect(report.fullDryTimeMin).toBe(0);
    expect(report.stages).toHaveLength(0);
  });

  it('стадии содержат процент завершения', () => {
    const sys = new MultiphaseSystem([makePhase(ethanol, 100)], []);
    const report = DryingSolver.evaluate(sys, 25);
    expect(report.stages.length).toBeGreaterThan(0);
    for (const stage of report.stages) {
      expect(stage.percentComplete).toBeGreaterThan(0);
      expect(stage.percentComplete).toBeLessThanOrEqual(100);
      expect(stage.durationMin).toBeGreaterThanOrEqual(0);
    }
  });

  it('рекомендации генерируются', () => {
    const sys = new MultiphaseSystem([makePhase(linseedOil, 100)], []);
    const report = DryingSolver.evaluate(sys, 25);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });
});
