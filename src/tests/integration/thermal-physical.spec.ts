import { describe, it, expect } from 'vitest';
import { MultiphaseSystem } from '../../core/entities/multiphase-system';
import { Phase } from '../../core/entities/phase';
import { Mixture } from '../../core/entities/mixture';
import { PhaseBoundary } from '../../core/entities/phase-boundary';
import { Mass } from '../../core/units/quantities';
import { StabilitySolver } from '../../core/solvers/stability-solver';
import { PureSubstance } from '../../core/entities/pure-substance';
import { Oil } from '../../core/entities/oil';
import { ChemTelemetry } from '../../core/testing/test-telemetry';

describe('Thermal & Physical Integration (Термическая кинетика, Аррениус и Stokes)', () => {
  const water = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0, 0, 0.001, 1900);
  const sheaButter = new Oil('Shea Butter', 850, 8.0, 0, 0, false, 0, 0, 0, 0.92, 35, 0.0001, 4000);

  it('вязкость должна падать при нагреве по закону Аррениуса (Arrhenius Chain)', () => {
    const waterPhase = new Phase(new Mixture(), new Mass(100, 'g'), 20);
    waterPhase.composition.addComponent(water, new Mass(100, 'g'));

    const visc20 = waterPhase.getViscosity();

    // Нагреваем до 80°C
    waterPhase.temperatureCelsius = 80;
    const visc80 = waterPhase.getViscosity();

    ChemTelemetry.logThermalDynamics('Водная фаза (Аррениус)', {
      temp1: 20, visc1: visc20,
      temp2: 80, visc2: visc80
    });

    expect(visc80).toBeLessThan(visc20);
  });

  it('стабильность эмульсии должна снижаться при нагреве (Stokes Chain)', () => {
    const waterPhase = new Phase(new Mixture(), new Mass(80, 'g'), 20);
    waterPhase.composition.addComponent(water, new Mass(80, 'g'));

    const oilPhase = new Phase(new Mixture(), new Mass(20, 'g'), 20);
    oilPhase.composition.addComponent(sheaButter, new Mass(20, 'g'));

    const system = new MultiphaseSystem([waterPhase, oilPhase], [new PhaseBoundary(waterPhase, oilPhase, 30)]);
    const shelfLife20 = StabilitySolver.predictShelfLife(system, 20);

    // Нагреваем всю систему до 60°C
    waterPhase.temperatureCelsius = 60;
    oilPhase.temperatureCelsius = 60;
    const shelfLife60 = StabilitySolver.predictShelfLife(system, 60);

    ChemTelemetry.logThermalDynamics('Крем с маслом Ши (Срок стабильности)', {
      temp1: 20, visc1: waterPhase.getViscosity(), shelfLife1: shelfLife20,
      temp2: 60, visc2: waterPhase.getViscosity(), shelfLife2: shelfLife60
    });

    expect(shelfLife60).toBeLessThan(shelfLife20);
  });

  it('фаза должна застывать ниже точки плавления (Phase Transition)', () => {
    const oilPhase = new Phase(new Mixture(), new Mass(100, 'g'), 40);
    oilPhase.composition.addComponent(sheaButter, new Mass(100, 'g'));

    const isSolid40 = oilPhase.isSolid();

    // Охлаждаем до 20°C (Tm масла Ши = 35°C)
    oilPhase.temperatureCelsius = 20;
    const isSolid20 = oilPhase.isSolid();

    console.log(`[PHASE TRANSITION] Масло Ши (Тпл = 35°C):`);
    console.log(`  • 40°C: Твердое = ${isSolid40} (Жидкое масло)`);
    console.log(`  • 20°C: Твердое = ${isSolid20} (Кристаллизовалось/застыло)`);

    expect(isSolid40).toBe(false);
    expect(isSolid20).toBe(true);
  });

  it('застывание фазы должно блокировать седиментацию (Freeze Lock)', () => {
    const waterPhase = new Phase(new Mixture(), new Mass(80, 'g'), 20);
    waterPhase.composition.addComponent(water, new Mass(80, 'g'));

    const oilPhase = new Phase(new Mixture(), new Mass(20, 'g'), 20);
    oilPhase.composition.addComponent(sheaButter, new Mass(20, 'g'));

    const system = new MultiphaseSystem([waterPhase, oilPhase], [new PhaseBoundary(waterPhase, oilPhase, 30)]);
    const rate = StabilitySolver.calculateSeparationRate(system);

    console.log(`[FREEZE LOCK] Скорость расслоения при застывшем масле: ${rate.toFixed(8)} см/с (Седиментация заблокирована)`);

    expect(Math.abs(rate)).toBeLessThan(0.0001);
  });
});
