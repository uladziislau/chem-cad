import { describe, it, expect } from 'vitest';
import { MultiphaseSystem } from '../../core/entities/multiphase-system';
import { Phase } from '../../core/entities/phase';
import { Mixture } from '../../core/entities/mixture';
import { PhaseBoundary } from '../../core/entities/phase-boundary';
import { Mass } from '../../core/units/quantities';
import { ViscositySolver } from '../../core/solvers/viscosity-solver';
import { StabilitySolver } from '../../core/solvers/stability-solver';
import { PureSubstance } from '../../core/entities/pure-substance';
import { Oil } from '../../core/entities/oil';
import { ChemTelemetry } from '../../core/testing/test-telemetry';

describe('Physical Solvers Integration (Вязкость, седиментация Стокса и стабильность)', () => {
  const water = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0);
  const almondOil = new Oil('Almond Oil', 800, 6.0, 0, 0, false, 0, 0, 0, 0.9);

  it('должен рассчитывать вязкость эмульсии выше, чем у чистой дисперсионной среды (Эйнштейн/Бринкман)', () => {
    const waterPhase = new Phase(new Mixture(), new Mass(80, 'g'));
    waterPhase.composition.addComponent(water, new Mass(80, 'g'));

    const oilPhase = new Phase(new Mixture(), new Mass(20, 'g'));
    oilPhase.composition.addComponent(almondOil, new Mass(20, 'g'));

    const system = new MultiphaseSystem([waterPhase, oilPhase], []);
    const waterViscosity = waterPhase.getViscosity();
    const emulsionViscosity = ViscositySolver.calculateEmulsionViscosity(system);

    console.log(`[VISCOSITY EMULSION]:`);
    console.log(`  • Вода (сплошная фаза 80%): ${waterViscosity.toFixed(2)} cP`);
    console.log(`  • Эмульсия М/В (20% масла):  ${emulsionViscosity.toFixed(2)} cP [Увеличение на +${(emulsionViscosity - waterViscosity).toFixed(2)} cP]`);

    expect(emulsionViscosity).toBeGreaterThan(waterViscosity);
  });

  it('должен рассчитывать скорость расслоения и срок стабильности по закону Стокса', () => {
    const waterPhase = new Phase(new Mixture(), new Mass(50, 'g'));
    waterPhase.composition.addComponent(water, new Mass(50, 'g'));

    const oilPhase = new Phase(new Mixture(), new Mass(50, 'g'));
    oilPhase.composition.addComponent(almondOil, new Mass(50, 'g'));

    const system = new MultiphaseSystem([waterPhase, oilPhase], [new PhaseBoundary(waterPhase, oilPhase, 50)]);
    const rate = StabilitySolver.calculateSeparationRate(system);
    const shelfLife = StabilitySolver.predictShelfLife(system);

    ChemTelemetry.logSystemProfile('Stokes Sedimentation Analysis', system, {
      'Separation Rate': `${rate.toExponential(4)} см/с (Кремирование/Всплытие)`,
      'Predicted Shelf Life': `${shelfLife.toFixed(0)} дней`
    });

    // Плотность масла 0.9 < 1.0, значит скорость отрицательная (всплытие)
    expect(rate).toBeLessThan(0);
    expect(shelfLife).toBeGreaterThan(0);
  });
});
