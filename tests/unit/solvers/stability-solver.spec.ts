import { describe, it, expect } from 'vitest';
import { StabilitySolver } from '@root-modules/solvers/stability-solver';
import { MultiphaseSystem } from '@domain/entities/multiphase-system';
import { Phase } from '@domain/entities/phase';
import { PhaseBoundary } from '@domain/entities/phase-boundary';
import { Mixture } from '@domain/entities/mixture';
import { Mass } from '@root-modules/units/quantities';
import { PureSubstance } from '@domain/entities/pure-substance';
import { Oil } from '@domain/entities/oil';

const water = new PureSubstance('Water', 18.015, 8.07, 1730, 233, 1.0, 1.0);
const lightOil = new Oil('Light Oil', 300, 6.0, 10, 1, true, 0, 0, 0, 0.8);
const heavyOil = new Oil('Heavy Oil', 500, 6.0, 10, 1, true, 0, 0, 0, 1.1);

function makePhase(entity: typeof water | typeof lightOil | typeof heavyOil, grams: number) {
  const mix = new Mixture();
  mix.addComponent(entity, new Mass(grams, 'g'));
  return new Phase(mix, new Mass(grams, 'g'), 25);
}

describe('StabilitySolver (Седиментация Стокса)', () => {
  it('одна фаза → скорость 0', () => {
    const sys = new MultiphaseSystem([makePhase(water, 100)], []);
    expect(StabilitySolver.calculateSeparationRate(sys)).toBe(0);
  });

  it('лёгкое масло всплывает (отрицательная скорость)', () => {
    const aq = makePhase(water, 50);
    const ol = makePhase(lightOil, 50);
    const sys = new MultiphaseSystem([aq, ol], [new PhaseBoundary(aq, ol, 50)]);
    expect(StabilitySolver.calculateSeparationRate(sys)).toBeLessThan(0);
  });

  it('тяжёлое масло оседает (положительная скорость)', () => {
    const aq = makePhase(water, 50);
    const ol = makePhase(heavyOil, 50);
    const sys = new MultiphaseSystem([aq, ol], [new PhaseBoundary(aq, ol, 50)]);
    expect(StabilitySolver.calculateSeparationRate(sys)).toBeGreaterThan(0);
  });

  it('замороженная фаза → скорость 0 (Freeze Lock)', () => {
    const aq = makePhase(water, 50);
    const ol = makePhase(lightOil, 50);
    ol.temperatureCelsius = -10; // ниже точки плавления
    const sys = new MultiphaseSystem([aq, ol], [new PhaseBoundary(aq, ol, 50)]);
    expect(StabilitySolver.calculateSeparationRate(sys)).toBe(0);
  });

  it('predictShelfLife: идеальная система → 2 года', () => {
    const sys = new MultiphaseSystem([], []);
    expect(StabilitySolver.predictShelfLife(sys)).toBeCloseTo(730, 0);
  });
});
