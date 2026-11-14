import { describe, it, expect } from 'vitest';
import { DetergencySolver } from '@root-modules/solvers/detergency-solver';
import { MultiphaseSystem } from '@domain/entities/multiphase-system';
import { Phase } from '@domain/entities/phase';
import { Mixture } from '@domain/entities/mixture';
import { Mass } from '@root-modules/units/quantities';
import { PureSubstance } from '@domain/entities/pure-substance';
import { Oil } from '@domain/entities/oil';
import { Surfactant } from '@domain/entities/surfactant';
const water = new PureSubstance('Water', 18.015, 8.07, 1730, 233, 1.0);
const oil = new Oil('Almond Oil', 800, 6.0, 10, 1, true, 0, 0, 0, 0.9)
  .withHansen(16.0, 3.0, 4.0);
const surfactant = new Surfactant('SLS', 288, 10, 5, 1, true, 0, 0, 0, 1.0, 0, 0.0001, 3500, 0, 0);
const acid = new PureSubstance('Citric Acid', 192.12, 7.0, 1500, 250, 1.6)
  .withElectrolyte('acid', 3.1);

function makePhase(entity: typeof water | typeof oil | typeof surfactant | typeof acid, grams: number) {
  const mix = new Mixture();
  mix.addComponent(entity, new Mass(grams, 'g'));
  return new Phase(mix, new Mass(grams, 'g'), 25);
}

describe('DetergencySolver (Моющая способность)', () => {
  it('чистая вода → низкий балл', () => {
    const sys = new MultiphaseSystem([makePhase(water, 100)], []);
    const report = DetergencySolver.evaluate(sys);
    expect(report.score).toBeLessThan(45);
  });

  it('щелочной раствор с ПАВ → высокий балл', () => {
    const aq = makePhase(water, 80);
    aq.composition.addComponent(surfactant, new Mass(15, 'g'));
    aq.composition.addComponent(acid, new Mass(5, 'g'));
    const sys = new MultiphaseSystem([aq], []);
    const report = DetergencySolver.evaluate(sys);
    expect(report.score).toBeGreaterThan(40);
    expect(report.surfactantPower).toBeGreaterThan(50);
  });

  it('кислый раствор → descaling выше нейтрального', () => {
    const aq = makePhase(water, 98);
    aq.composition.addComponent(acid, new Mass(2, 'g'));
    const sys = new MultiphaseSystem([aq], []);
    const report = DetergencySolver.evaluate(sys);
    const neutral = DetergencySolver.evaluate(new MultiphaseSystem([makePhase(water, 100)], []));
    expect(report.descaling).toBeGreaterThan(neutral.descaling);
  });

  it('масляная система без ПАВ → низкая моющая способность', () => {
    const sys = new MultiphaseSystem([makePhase(oil, 100)], []);
    const report = DetergencySolver.evaluate(sys);
    expect(report.score).toBeLessThan(30);
    expect(report.degreasing).toBeLessThan(40);
  });

  it('факторы содержат pH и ионную силу', () => {
    const sys = new MultiphaseSystem([makePhase(water, 100)], []);
    const report = DetergencySolver.evaluate(sys);
    expect(report.factors).toHaveProperty('pH');
    expect(report.factors).toHaveProperty('ionicStrength');
    expect(report.factors).toHaveProperty('surfactantPercent');
    expect(report.factors).toHaveProperty('hlbBalance');
  });

  it('рекомендации генерируются для низкого балла', () => {
    const sys = new MultiphaseSystem([makePhase(water, 100)], []);
    const report = DetergencySolver.evaluate(sys);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });
});
