import { describe, it, expect } from 'vitest';
import { FormulationSolver } from '@root-modules/solvers/formulation-solver';
import { MultiphaseSystem } from '@domain/entities/multiphase-system';
import { Phase } from '@domain/entities/phase';
import { PhaseBoundary } from '@domain/entities/phase-boundary';
import { Mixture } from '@domain/entities/mixture';
import { Mass } from '@root-modules/units/quantities';
import { PureSubstance } from '@domain/entities/pure-substance';
import { Oil } from '@domain/entities/oil';
import { Surfactant } from '@domain/entities/surfactant';
import { Moles } from '@root-modules/units/quantities';
import { IChemicalEntity } from '@domain/entities/chemical-entity.interface';

const water = new PureSubstance('Water', 18.015, 8.07, 1730, 233, 1.0, 1.0);
const oil = new Oil('Light Oil', 300, 6.0, 10, 1, true, 0, 0, 0, 0.8, 0, 0.0001, 3000, 0, 8);
const surfLow = new Surfactant('Span-80', 428, 4.3, 10, 1, true, 0, 0, 0, 1.0, 0, 0.0001, 3500, 0, -2);
const surfHigh = new Surfactant('Tween-80', 1310, 15.0, 8, 1, true, 0, 0, 0, 1.0, 0, 0.0001, 3500, 0, 2);

function makePhaseWith(entity: IChemicalEntity, grams: number) {
  const mix = new Mixture();
  mix.addComponent(entity, new Mass(grams, 'g'));
  return new Phase(mix, new Mass(grams, 'g'), 25);
}

function makeSystem() {
  const aq = makePhaseWith(water, 50);
  const ol = makePhaseWith(oil, 50);
  const boundary = new PhaseBoundary(aq, ol, 10);
  boundary.addSurfactant(surfLow, new Moles(0.01, 'mol'));
  boundary.addSurfactant(surfHigh, new Moles(0.01, 'mol'));
  return new MultiphaseSystem([aq, ol], [boundary]);
}

describe('FormulationSolver (HLB/HLD)', () => {
  it('calculateSystemHLB: средневзвешенный HLB ПАВ', () => {
    const sys = makeSystem();
    const hlb = FormulationSolver.calculateSystemHLB(sys);
    // (4.3*0.01 + 15*0.01) / 0.02 = 9.65
    expect(hlb).toBeCloseTo(9.65, 1);
  });

  it('calculateSystemHLB: без ПАВ → 0', () => {
    const aq = makePhaseWith(water, 50);
    const ol = makePhaseWith(oil, 50);
    const sys = new MultiphaseSystem([aq, ol], []);
    expect(FormulationSolver.calculateSystemHLB(sys)).toBe(0);
  });

  it('calculateRequiredHLB: взвешенный HLB масла', () => {
    const aq = makePhaseWith(water, 50);
    const ol = makePhaseWith(oil, 50);
    const sys = new MultiphaseSystem([aq, ol], []);
    const reqHLB = FormulationSolver.calculateRequiredHLB(sys);
    expect(reqHLB).toBeCloseTo(6.0, 1);
  });

  it('calculateHLBMismatch: без ПАВ → максимальный штраф', () => {
    const aq = makePhaseWith(water, 50);
    const ol = makePhaseWith(oil, 50);
    const sys = new MultiphaseSystem([aq, ol], []);
    expect(FormulationSolver.calculateHLBMismatch(sys)).toBe(10);
  });

  it('calculateHLD: система с ПАВ → конечное число', () => {
    const sys = makeSystem();
    const hld = FormulationSolver.calculateHLD(sys, 25);
    expect(isFinite(hld)).toBe(true);
  });

  it('predictEmulsionType: одна фаза → Unknown', () => {
    const sys = new MultiphaseSystem([makePhaseWith(water, 100)], []);
    expect(FormulationSolver.predictEmulsionType(sys)).toBe('Unknown');
  });

  it('predictEmulsionType: >74% масла → W/O', () => {
    const aq = makePhaseWith(water, 20);
    const ol = makePhaseWith(oil, 80);
    const sys = new MultiphaseSystem([aq, ol], [new PhaseBoundary(aq, ol, 10)]);
    expect(FormulationSolver.predictEmulsionType(sys)).toBe('W/O');
  });

  it('predictEmulsionType: >74% воды → O/W', () => {
    const aq = makePhaseWith(water, 80);
    const ol = makePhaseWith(oil, 20);
    const sys = new MultiphaseSystem([aq, ol], [new PhaseBoundary(aq, ol, 10)]);
    expect(FormulationSolver.predictEmulsionType(sys)).toBe('O/W');
  });
});
