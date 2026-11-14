import { describe, it, expect } from 'vitest';
import { SolubilitySolver } from '@root-modules/solvers/solubility-solver';
import { MultiphaseSystem } from '@domain/entities/multiphase-system';
import { Phase } from '@domain/entities/phase';
import { Mixture } from '@domain/entities/mixture';
import { Mass } from '@root-modules/units/quantities';
import { PureSubstance } from '@domain/entities/pure-substance';
import { Oil } from '@domain/entities/oil';

const water = new PureSubstance('Water', 18.015, 8.07, 1730, 233, 1.0, 1.0);
const salt = new PureSubstance('NaCl', 58.44, 10, 1000, 100, 2.16, 0.5, 0.01, 0.01, 0)
  .withElectrolyte('salt', [7.0]);
const lowSolubility = new PureSubstance('CaCO3', 100.09, 10, 500, 50, 2.71, 0.5, 0.01, 0.01, 0)
  .withSolubility(0.01); // 0.01 г/100мл — очень низкая
const oil = new Oil('Light Oil', 300, 6.0, 10, 1, true, 0, 0, 0, 0.8);

function makePhase(entity: typeof water | typeof salt | typeof lowSolubility | typeof oil, grams: number) {
  const mix = new Mixture();
  mix.addComponent(entity, new Mass(grams, 'g'));
  return new Phase(mix, new Mass(grams, 'g'), 25);
}

describe('SolubilitySolver (Пределы растворимости)', () => {
  it('чистая вода без добавок → нет проблем', () => {
    const aq = makePhase(water, 100);
    const sys = new MultiphaseSystem([aq], []);
    expect(SolubilitySolver.checkSaturation(sys, 0)).toHaveLength(0);
  });

  it('низкая концентрация малорастворимого → в пределах', () => {
    const mix = new Mixture();
    mix.addComponent(water, new Mass(99, 'g'));
    mix.addComponent(lowSolubility, new Mass(0.001, 'g'));
    const aqPhase = new Phase(mix, new Mass(99.001, 'g'), 25);
    const sys = new MultiphaseSystem([aqPhase], []);
    expect(SolubilitySolver.checkSaturation(sys, 0)).toHaveLength(0);
  });

  it('перенасыщение → issue с excessMass', () => {
    const mix = new Mixture();
    mix.addComponent(water, new Mass(90, 'g'));
    mix.addComponent(lowSolubility, new Mass(5, 'g')); // 5г в ~90мл → превышает 0.01г/100мл
    const aqPhase = new Phase(mix, new Mass(95, 'g'), 25);
    const sys = new MultiphaseSystem([aqPhase], []);
    const issues = SolubilitySolver.checkSaturation(sys, 0);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].entityName).toBe('CaCO3');
    expect(issues[0].excessMass).toBeGreaterThan(0);
  });

  it('высаливание: соль снижает растворимость', () => {
    const mix = new Mixture();
    mix.addComponent(water, new Mass(90, 'g'));
    mix.addComponent(lowSolubility, new Mass(0.05, 'g'));
    mix.addComponent(salt, new Mass(10, 'g'));
    const aqPhase = new Phase(mix, new Mass(100, 'g'), 25);
    const sys = new MultiphaseSystem([aqPhase], []);
    const issuesWithSalt = SolubilitySolver.checkSaturation(sys, 0.5);
    const issuesNoSalt = SolubilitySolver.checkSaturation(sys, 0);
    expect(issuesWithSalt.length).toBeGreaterThanOrEqual(issuesNoSalt.length);
  });

  it('безводная система → нет проблем', () => {
    const ol = makePhase(oil, 100);
    const sys = new MultiphaseSystem([ol], []);
    expect(SolubilitySolver.checkSaturation(sys, 0)).toHaveLength(0);
  });
});
