import { describe, it, expect } from 'vitest';
import { IonicSolver } from '@root-modules/solvers/ionic-solver';
import { MultiphaseSystem } from '@domain/entities/multiphase-system';
import { Phase } from '@domain/entities/phase';
import { Mixture } from '@domain/entities/mixture';
import { Mass } from '@root-modules/units/quantities';
import { PureSubstance } from '@domain/entities/pure-substance';
import { Oil } from '@domain/entities/oil';

const water = new PureSubstance('Water', 18.015, 8.07, 1730, 233, 1.0)
  .withHansen(15.6, 16.0, 42.3);
const oil = new Oil('Almond Oil', 800, 6.0, 10, 1, true, 0, 0, 0, 0.9)
  .withHansen(16.0, 3.0, 4.0);
const salt = new PureSubstance('NaCl', 58.44, 0, 0, 0, 2.16, 801, 0.001, 1500, 1)
  .withElectrolyte('salt');

function makePhase(entity: typeof water | typeof oil | typeof salt, grams: number) {
  const mix = new Mixture();
  mix.addComponent(entity, new Mass(grams, 'g'));
  return new Phase(mix, new Mass(grams, 'g'), 25);
}

describe('IonicSolver (Ионная сила)', () => {
  it('безводная система → ионная сила 0', () => {
    const sys = new MultiphaseSystem([makePhase(oil, 100)], []);
    expect(IonicSolver.calculateIonicStrength(sys)).toBe(0);
  });

  it('водный раствор без солей → ионная сила ~0', () => {
    const sys = new MultiphaseSystem([makePhase(water, 100)], []);
    expect(IonicSolver.calculateIonicStrength(sys)).toBeCloseTo(0, 3);
  });

  it('раствор NaCl → ионная сила > 0', () => {
    const aq = makePhase(water, 90);
    aq.composition.addComponent(salt, new Mass(10, 'g'));
    const sys = new MultiphaseSystem([aq], []);
    expect(IonicSolver.calculateIonicStrength(sys)).toBeGreaterThan(0);
  });

  it('электролитный фактор вязкости падает с ионной силой', () => {
    const clean = new MultiphaseSystem([makePhase(water, 100)], []);
    const salty = new MultiphaseSystem([], []);
    const aq = makePhase(water, 80);
    aq.composition.addComponent(salt, new Mass(20, 'g'));
    salty.phases.push(aq);

    const fClean = IonicSolver.getElectrolyteViscosityFactor(clean);
    const fSalty = IonicSolver.getElectrolyteViscosityFactor(salty);
    expect(fSalty).toBeLessThan(fClean);
    expect(fSalty).toBeGreaterThan(0);
  });
});
