import { describe, it, expect } from 'vitest';
import { PHSolver } from '@root-modules/solvers/ph-solver';
import { IonicSolver } from '@root-modules/solvers/ionic-solver';
import { MultiphaseSystem } from '@domain/entities/multiphase-system';
import { Phase } from '@domain/entities/phase';
import { Mixture } from '@domain/entities/mixture';
import { Mass } from '@root-modules/units/quantities';
import { PureSubstance } from '@domain/entities/pure-substance';

const water = new PureSubstance('Water', 18.015, 8.07, 1730, 233, 1.0);
const hcl = new PureSubstance('HCl', 36.46, 8.0, 3000, 200, 1.0)
  .withElectrolyte('acid', 7.0);
const naoh = new PureSubstance('NaOH', 40.0, 8.0, 3000, 200, 1.0)
  .withElectrolyte('base', 14.0);

function makePhase(entity: typeof water | typeof hcl | typeof naoh, grams: number) {
  const mix = new Mixture();
  mix.addComponent(entity, new Mass(grams, 'g'));
  return new Phase(mix, new Mass(grams, 'g'), 25);
}

describe('PHSolver + IonicSolver (pH и ионная сила)', () => {
  it('чистая вода → pH 7', () => {
    const sys = new MultiphaseSystem([makePhase(water, 100)], []);
    expect(PHSolver.calculatePH(sys)).toBeCloseTo(7.0, 1);
  });

  it('безводная система → pH 7 (fallback)', () => {
    const sys = new MultiphaseSystem([], []);
    expect(PHSolver.calculatePH(sys)).toBe(7.0);
  });

  it('сильная кислота → pH < 7', () => {
    const aq = makePhase(water, 90);
    aq.composition.addComponent(hcl, new Mass(10, 'g'));
    const sys = new MultiphaseSystem([aq], []);
    expect(PHSolver.calculatePH(sys)).toBeLessThan(7);
  });

  it('сильное основание → pH > 7', () => {
    const aq = makePhase(water, 90);
    aq.composition.addComponent(naoh, new Mass(10, 'g'));
    const sys = new MultiphaseSystem([aq], []);
    expect(PHSolver.calculatePH(sys)).toBeGreaterThan(7);
  });

  it('IonicSolver.calculatePH делегирует PHSolver', () => {
    const sys = new MultiphaseSystem([makePhase(water, 100)], []);
    expect(IonicSolver.calculatePH(sys)).toBe(PHSolver.calculatePH(sys));
  });
});
