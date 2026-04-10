import { MultiphaseSystem } from '../../core/entities/multiphase-system';
import { Phase } from '../../core/entities/phase';
import { Mixture } from '../../core/entities/mixture';
import { Mass } from '../../core/units/quantities';
import { PureSubstance } from '../../core/entities/pure-substance';
import { Surfactant } from '../../core/entities/surfactant';
import { IonicSolver } from '../../core/solvers/ionic-solver';
import { SafetyValidator } from '../../core/solvers/safety-validator';

describe('Safety & Integrity Integration Test', () => {
  
  it('должен обнаруживать конфликт анионных и катионных ПАВ', () => {
    const water = new PureSubstance('Water', 18, 0, 0, 0, 1.0, 0, 0.001, 1900);
    const scs = new Surfactant('SCS', 232, 40, 12, 0, false, 0, 0, 0, 1.1, 20, 0.0001, 3000, -1); // Anionic
    const cetrimonium = new Surfactant('Cetrimonium', 320, 15, 18, 0, false, 0, 0, 0, 0.9, 0, 0.0001, 2500, 1); // Cationic

    const phase = new Phase(new Mixture(), new Mass(100, 'g'), 25);
    phase.composition.addComponent(water, new Mass(80, 'g'));
    phase.composition.addComponent(scs, new Mass(10, 'g'));
    phase.composition.addComponent(cetrimonium, new Mass(10, 'g'));

    const system = new MultiphaseSystem([phase], []);
    const ph = IonicSolver.calculatePH(system);
    const issues = SafetyValidator.validate(system, ph);

    const hasSurfConflict = issues.some(i => i.code === 'SURF_CHARGE_CONFLICT');
    expect(hasSurfConflict).toBe(true);
  });

  it('должен предупреждать о нейтрализации кислоты и щелочи', () => {
    const water = new PureSubstance('Water', 18, 0, 0, 0, 1.0, 0, 0.001, 1900);
    const acid = new PureSubstance('Citric Acid', 192, 0, 0, 0, 1.6, 150, 0.001, 2000, 0).withElectrolyte('acid', 3.1);
    const base = new PureSubstance('NaOH', 40, 0, 0, 0, 2.1, 318, 0.001, 1800, 1).withElectrolyte('base', 13.8);

    const phase = new Phase(new Mixture(), new Mass(100, 'g'), 25);
    phase.composition.addComponent(water, new Mass(80, 'g'));
    phase.composition.addComponent(acid, new Mass(10, 'g'));
    phase.composition.addComponent(base, new Mass(10, 'g'));

    const system = new MultiphaseSystem([phase], []);
    const ph = IonicSolver.calculatePH(system);
    const issues = SafetyValidator.validate(system, ph);

    const hasNeutralization = issues.some(i => i.code === 'ACID_BASE_NEUTRALIZATION');
    expect(hasNeutralization).toBe(true);
  });

  it('должен выставлять критический уровень при экстремальном pH', () => {
    const water = new PureSubstance('Water', 18, 0, 0, 0, 1.0, 0, 0.001, 1900);
    const strongBase = new PureSubstance('NaOH', 40, 0, 0, 0, 2.1, 318, 0.001, 1800, 1).withElectrolyte('base', 13.8);

    const phase = new Phase(new Mixture(), new Mass(100, 'g'), 25);
    phase.composition.addComponent(water, new Mass(50, 'g'));
    phase.composition.addComponent(strongBase, new Mass(50, 'g'));

    const system = new MultiphaseSystem([phase], []);
    const ph = IonicSolver.calculatePH(system);
    
    // pH должен быть очень высоким
    expect(ph).toBeGreaterThan(12);

    const issues = SafetyValidator.validate(system, ph);
    const hasExtremeAlkalinity = issues.some(i => i.code === 'EXTREME_ALKALINITY' && i.level === 'critical');
    expect(hasExtremeAlkalinity).toBe(true);
  });
});
