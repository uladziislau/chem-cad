import { describe, it, expect } from 'vitest';
import { ThermodynamicsSolver } from '@root-modules/solvers/thermodynamics-solver';
import { MultiphaseSystem } from '@domain/entities/multiphase-system';
import { Phase } from '@domain/entities/phase';
import { Mixture } from '@domain/entities/mixture';
import { Mass } from '@root-modules/units/quantities';
import { PureSubstance } from '@domain/entities/pure-substance';

const water = new PureSubstance('Water', 18.015, 8.07, 1730, 233, 1.0);

function makePhase(entity: typeof water, grams: number, temp = 25) {
  const mix = new Mixture();
  mix.addComponent(entity, new Mass(grams, 'g'));
  return new Phase(mix, new Mass(grams, 'g'), temp);
}

describe('ThermodynamicsSolver (Термодинамика)', () => {
  it('энтальпия при 0°C = 0', () => {
    const sys = new MultiphaseSystem([makePhase(water, 100, 0)], []);
    expect(ThermodynamicsSolver.calculateEnthalpy(sys)).toBeCloseTo(0, 5);
  });

  it('энтальпия растёт с температурой', () => {
    const cold = new MultiphaseSystem([makePhase(water, 100, 10)], []);
    const hot = new MultiphaseSystem([makePhase(water, 100, 80)], []);
    expect(ThermodynamicsSolver.calculateEnthalpy(hot)).toBeGreaterThan(
      ThermodynamicsSolver.calculateEnthalpy(cold)
    );
  });

  it('энтальпия пропорциональна массе', () => {
    const small = new MultiphaseSystem([makePhase(water, 50, 25)], []);
    const large = new MultiphaseSystem([makePhase(water, 100, 25)], []);
    const hSmall = ThermodynamicsSolver.calculateEnthalpy(small);
    const hLarge = ThermodynamicsSolver.calculateEnthalpy(large);
    expect(hLarge).toBeCloseTo(hSmall * 2, 1);
  });

  it('пустая система → 0', () => {
    const sys = new MultiphaseSystem([], []);
    expect(ThermodynamicsSolver.calculateEnthalpy(sys)).toBe(0);
  });
});
