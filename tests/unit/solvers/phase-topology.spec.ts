import { describe, it, expect } from 'vitest';
import { PhaseTopologyHelper } from '@root-modules/solvers/phase-topology.helper';
import { Phase } from '@domain/entities/phase';
import { Mixture } from '@domain/entities/mixture';
import { MultiphaseSystem } from '@domain/entities/multiphase-system';
import { Mass } from '@root-modules/units/quantities';
import { PureSubstance } from '@domain/entities/pure-substance';
import { Oil } from '@domain/entities/oil';

const water = new PureSubstance('Water', 18.015, 8.07, 1730, 233, 1.0)
  .withHansen(15.6, 16.0, 42.3);
const oil = new Oil('Almond Oil', 800, 6.0, 10, 1, true, 0, 0, 0, 0.9)
  .withHansen(16.0, 3.0, 4.0);

function makePhase(entity: typeof water | typeof oil, grams: number) {
  const mix = new Mixture();
  mix.addComponent(entity, new Mass(grams, 'g'));
  return new Phase(mix, new Mass(grams, 'g'), 25);
}

describe('PhaseTopologyHelper (Топология фаз)', () => {
  it('isAqueousPhase: вода → true', () => {
    const p = makePhase(water, 50);
    expect(PhaseTopologyHelper.isAqueousPhase(p)).toBe(true);
  });

  it('isAqueousPhase: масло → false', () => {
    const p = makePhase(oil, 50);
    expect(PhaseTopologyHelper.isAqueousPhase(p)).toBe(false);
  });

  it('findAqueousPhase возвращает водную фазу', () => {
    const sys = new MultiphaseSystem([makePhase(oil, 20), makePhase(water, 80)], []);
    const aq = PhaseTopologyHelper.findAqueousPhase(sys);
    expect(aq).not.toBeNull();
    expect(aq!.composition.getComponents()[0].entity.getName()).toBe('Water');
  });

  it('findOilPhase возвращает масляную фазу', () => {
    const sys = new MultiphaseSystem([makePhase(water, 80), makePhase(oil, 20)], []);
    const oilP = PhaseTopologyHelper.findOilPhase(sys);
    expect(oilP).not.toBeNull();
    expect(oilP!.composition.getComponents()[0].entity.getName()).toBe('Almond Oil');
  });

  it('resolveEmulsionRoles: O/W → вода сплошная, масло дисперсное', () => {
    const sys = new MultiphaseSystem([makePhase(water, 80), makePhase(oil, 20)], []);
    sys.setEmulsionType('O/W');
    const roles = PhaseTopologyHelper.resolveEmulsionRoles(sys);
    expect(roles).not.toBeNull();
    expect(roles!.continuousPhase.composition.getComponents()[0].entity.getName()).toBe('Water');
    expect(roles!.dispersedPhase.composition.getComponents()[0].entity.getName()).toBe('Almond Oil');
  });

  it('resolveEmulsionRoles: W/O → масло сплошное, вода дисперсная', () => {
    const sys = new MultiphaseSystem([makePhase(water, 80), makePhase(oil, 20)], []);
    sys.setEmulsionType('W/O');
    const roles = PhaseTopologyHelper.resolveEmulsionRoles(sys);
    expect(roles).not.toBeNull();
    expect(roles!.continuousPhase.composition.getComponents()[0].entity.getName()).toBe('Almond Oil');
    expect(roles!.dispersedPhase.composition.getComponents()[0].entity.getName()).toBe('Water');
  });

  it('resolveEmulsionRoles: одна фаза → null', () => {
    const sys = new MultiphaseSystem([makePhase(water, 100)], []);
    expect(PhaseTopologyHelper.resolveEmulsionRoles(sys)).toBeNull();
  });
});
