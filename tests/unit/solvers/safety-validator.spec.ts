import { describe, it, expect } from 'vitest';
import { SafetyValidator } from '@root-modules/solvers/safety-validator';
import { MultiphaseSystem } from '@domain/entities/multiphase-system';
import { Phase } from '@domain/entities/phase';
import { Mixture } from '@domain/entities/mixture';
import { Mass } from '@root-modules/units/quantities';
import { PureSubstance } from '@domain/entities/pure-substance';
import { Surfactant } from '@domain/entities/surfactant';
import { IChemicalEntity } from '@domain/entities/chemical-entity.interface';

const water = new PureSubstance('Water', 18.015, 8.07, 1730, 233, 1.0, 1.0);
const acid = new PureSubstance('HCl', 36.46, 7.0, 1000, 100, 1.18, 0.5, 0.01, 0.01, 0)
  .withElectrolyte('acid', [-7]);
const base = new PureSubstance('NaOH', 40.0, 10, 1000, 100, 2.13, 0.5, 0.01, 0.01, 0)
  .withElectrolyte('base', [15.7]);
const anionicSurf = new Surfactant('SLS', 288, 40, 10, 1, true, 0, 0, 0, 1.0, 0, 0.0001, 3500, -1);
const cationicSurf = new Surfactant('CTAB', 364, 10, 15, 3, false, 0, 0, 0, 1.0, 0, 0.0001, 3500, 1);

function makePhaseWith(entity: IChemicalEntity, grams: number) {
  const mix = new Mixture();
  mix.addComponent(entity, new Mass(grams, 'g'));
  return new Phase(mix, new Mass(grams, 'g'), 25);
}

describe('SafetyValidator (Проверка безопасности)', () => {
  it('чистая вода → нет проблем', () => {
    const aq = makePhaseWith(water, 100);
    const sys = new MultiphaseSystem([aq], []);
    expect(SafetyValidator.validate(sys, 7.0)).toHaveLength(0);
  });

  it('pH < 2 → critical EXTREME_ACIDITY', () => {
    const aq = makePhaseWith(water, 100);
    const sys = new MultiphaseSystem([aq], []);
    const issues = SafetyValidator.validate(sys, 1.0);
    expect(issues.some(i => i.code === 'EXTREME_ACIDITY')).toBe(true);
    expect(issues.find(i => i.code === 'EXTREME_ACIDITY')?.level).toBe('critical');
  });

  it('pH > 12 → critical EXTREME_ALKALINITY', () => {
    const aq = makePhaseWith(water, 100);
    const sys = new MultiphaseSystem([aq], []);
    const issues = SafetyValidator.validate(sys, 13.0);
    expect(issues.some(i => i.code === 'EXTREME_ALKALINITY')).toBe(true);
  });

  it('нормальный pH → нет экстремальных проблем', () => {
    const aq = makePhaseWith(water, 100);
    const sys = new MultiphaseSystem([aq], []);
    const issues = SafetyValidator.validate(sys, 7.0);
    expect(issues.filter(i => i.level === 'critical')).toHaveLength(0);
  });

  it('пустая система → не падает', () => {
    const sys = new MultiphaseSystem([], []);
    expect(() => SafetyValidator.validate(sys, 7.0)).not.toThrow();
  });

  it('анионный + катионный ПАВ → SURF_CHARGE_CONFLICT', () => {
    const mix = new Mixture();
    mix.addComponent(water, new Mass(90, 'g'));
    mix.addComponent(anionicSurf, new Mass(5, 'g'));
    mix.addComponent(cationicSurf, new Mass(5, 'g'));
    const phase = new Phase(mix, new Mass(100, 'g'), 25);
    const sys = new MultiphaseSystem([phase], []);
    const issues = SafetyValidator.validate(sys, 7.0);
    expect(issues.some(i => i.code === 'SURF_CHARGE_CONFLICT')).toBe(true);
  });

  it('кислота + щёлочь → ACID_BASE_NEUTRALIZATION', () => {
    const mix = new Mixture();
    mix.addComponent(water, new Mass(80, 'g'));
    mix.addComponent(acid, new Mass(10, 'g'));
    mix.addComponent(base, new Mass(10, 'g'));
    const phase = new Phase(mix, new Mass(100, 'g'), 25);
    const sys = new MultiphaseSystem([phase], []);
    const issues = SafetyValidator.validate(sys, 7.0);
    expect(issues.some(i => i.code === 'ACID_BASE_NEUTRALIZATION')).toBe(true);
  });
});
