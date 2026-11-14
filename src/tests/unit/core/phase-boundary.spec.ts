import { describe, it, expect } from 'vitest';
import { PureSubstance } from '@domain/entities/pure-substance';
import { Mixture } from '@domain/entities/mixture';
import { Phase } from '@domain/entities/phase';
import { PhaseBoundary } from '@domain/entities/phase-boundary';
import { Oil } from '@domain/entities/oil';
import { Surfactant } from '@domain/entities/surfactant';
import { Mass, Moles } from '@root-modules/units/quantities';

describe('PhaseBoundary (Поверхностные явления и адсорбция ПАВ)', () => {
  const water = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0);
  const almondOil = new Oil('Almond Oil', 800, 6.0, 0, 0, false, 0, 0, 0, 0.9);
  const tween80 = new Surfactant('Tween 80', 1310, 15.0, 45.0, 2, true);

  it('должен снижать межфазное натяжение при добавлении ПАВ (Изотерма Гиббса)', () => {
    const waterPhase = new Phase(new Mixture(), new Mass(100, 'g'));
    waterPhase.composition.addComponent(water, new Mass(100, 'g'));

    const oilPhase = new Phase(new Mixture(), new Mass(100, 'g'));
    oilPhase.composition.addComponent(almondOil, new Mass(100, 'g'));

    const boundary = new PhaseBoundary(waterPhase, oilPhase, 50.0);
    const initialTension = boundary.getInterfacialTension();

    boundary.addSurfactant(tween80, new Moles(0.01, 'mol'));
    const reducedTension = boundary.getInterfacialTension();

    console.log(`[INTERFACE IFT] Вода / Миндальное масло:`);
    console.log(`  • До ввода ПАВ:   ${initialTension.toFixed(2)} мН/м`);
    console.log(`  • После Tween 80: ${reducedTension.toFixed(2)} мН/м  [Снижение на ${(initialTension - reducedTension).toFixed(2)} мН/м]`);

    expect(initialTension).toBe(50.0);
    expect(reducedTension).toBeLessThan(initialTension);
    expect(reducedTension).toBeGreaterThan(0);
  });
});
