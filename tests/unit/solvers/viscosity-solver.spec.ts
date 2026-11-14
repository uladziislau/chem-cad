import { describe, it, expect } from 'vitest';
import { ViscositySolver } from '@root-modules/solvers/viscosity-solver';
import { MultiphaseSystem } from '@domain/entities/multiphase-system';
import { Phase } from '@domain/entities/phase';
import { PhaseBoundary } from '@domain/entities/phase-boundary';
import { Mixture } from '@domain/entities/mixture';
import { Mass } from '@root-modules/units/quantities';
import { PureSubstance } from '@domain/entities/pure-substance';
import { Oil } from '@domain/entities/oil';

const water = new PureSubstance('Water', 18.015, 8.07, 1730, 233, 1.0, 1.0);
const oil = new Oil('Light Oil', 300, 6.0, 10, 1, true, 0, 0, 0, 0.8);

function makePhase(entity: typeof water | typeof oil, grams: number) {
  const mix = new Mixture();
  mix.addComponent(entity, new Mass(grams, 'g'));
  return new Phase(mix, new Mass(grams, 'g'), 25);
}

describe('ViscositySolver (Модель Тейлора)', () => {
  it('одна фаза → её собственная вязкость', () => {
    const sys = new MultiphaseSystem([makePhase(water, 100)], []);
    const result = ViscositySolver.calculateEmulsionViscosity(sys);
    expect(result).toBeGreaterThan(0);
  });

  it('две фазы → вязкость выше вязкости сплошной фазы', () => {
    const aq = makePhase(water, 50);
    const ol = makePhase(oil, 50);
    const sys = new MultiphaseSystem([aq, ol], [new PhaseBoundary(aq, ol, 50)]);
    sys.setEmulsionType('O/W');
    const etaWater = water.getViscosity(25);
    const result = ViscositySolver.calculateEmulsionViscosity(sys);
    expect(result).toBeGreaterThan(etaWater);
  });

  it('W/O → масло сплошная фаза', () => {
    const aq = makePhase(water, 50);
    const ol = makePhase(oil, 50);
    const sys = new MultiphaseSystem([aq, ol], [new PhaseBoundary(aq, ol, 50)]);
    sys.setEmulsionType('W/O');
    const result = ViscositySolver.calculateEmulsionViscosity(sys);
    const etaOil = oil.getViscosity(25);
    expect(result).toBeGreaterThan(etaOil);
  });

  it('пустая система → 0', () => {
    const sys = new MultiphaseSystem([], []);
    expect(ViscositySolver.calculateEmulsionViscosity(sys)).toBe(0);
  });
});
