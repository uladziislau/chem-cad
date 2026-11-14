import { describe, it, expect } from 'vitest';
import { ProcessSolver } from '@root-modules/solvers/process-solver';
import { MultiphaseSystem } from '@domain/entities/multiphase-system';
import { Phase } from '@domain/entities/phase';
import { PhaseBoundary } from '@domain/entities/phase-boundary';
import { Mixture } from '@domain/entities/mixture';
import { Mass } from '@root-modules/units/quantities';
import { PureSubstance } from '@domain/entities/pure-substance';
import { Oil } from '@domain/entities/oil';

const water = new PureSubstance('Water', 18.015, 8.07, 1730, 233, 1.0);
const oil = new Oil('Almond Oil', 800, 6.0, 10, 1, true, 0, 0, 0, 0.9);

function makePhase(entity: typeof water | typeof oil, grams: number) {
  const mix = new Mixture();
  mix.addComponent(entity, new Mass(grams, 'g'));
  return new Phase(mix, new Mass(grams, 'g'), 25);
}

describe('ProcessSolver (Размер капель d32)', () => {
  it('одна фаза → 0 (нет капель)', () => {
    const sys = new MultiphaseSystem([makePhase(water, 100)], []);
    expect(ProcessSolver.calculateDropletSize(sys, 1000, 5)).toBe(0);
  });

  it('две фазы без границы → 0', () => {
    const sys = new MultiphaseSystem([makePhase(water, 80), makePhase(oil, 20)], []);
    expect(ProcessSolver.calculateDropletSize(sys, 1000, 5)).toBe(0);
  });

  it('rpm=0 → макс. размер 200 мкм', () => {
    const aq = makePhase(water, 80);
    const ol = makePhase(oil, 20);
    const sys = new MultiphaseSystem([aq, ol], [new PhaseBoundary(aq, ol, 50)]);
    expect(ProcessSolver.calculateDropletSize(sys, 0, 5)).toBe(200);
  });

  it('высокие RPM → мельче капли', () => {
    const aq = makePhase(water, 80);
    const ol = makePhase(oil, 20);
    const boundary = new PhaseBoundary(aq, ol, 50);
    const sys = new MultiphaseSystem([aq, ol], [boundary]);

    const slow = ProcessSolver.calculateDropletSize(sys, 500, 5);
    const fast = ProcessSolver.calculateDropletSize(sys, 5000, 5);
    expect(fast).toBeLessThan(slow);
  });

  it('длинное время → мельче капли', () => {
    const aq = makePhase(water, 80);
    const ol = makePhase(oil, 20);
    const sys = new MultiphaseSystem([aq, ol], [new PhaseBoundary(aq, ol, 50)]);

    // Высокий rpm выводит расчёт из зоны насыщения (maxSize=200)
    const short = ProcessSolver.calculateDropletSize(sys, 20000, 1);
    const long = ProcessSolver.calculateDropletSize(sys, 20000, 10);
    expect(long).toBeLessThan(short);
  });

  it('результат в пределах [0.5, 200] мкм', () => {
    const aq = makePhase(water, 80);
    const ol = makePhase(oil, 20);
    const sys = new MultiphaseSystem([aq, ol], [new PhaseBoundary(aq, ol, 50)]);
    const d32 = ProcessSolver.calculateDropletSize(sys, 3000, 3);
    expect(d32).toBeGreaterThanOrEqual(0.5);
    expect(d32).toBeLessThanOrEqual(200);
  });
});
