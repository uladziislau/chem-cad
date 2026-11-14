import { describe, it, expect } from 'vitest';
import { PureSubstance } from '../../../core/entities/pure-substance';
import { Mass, Volume } from '../../../core/units/quantities';

describe('Unit Safety (Физические размерности ChemCore)', () => {
  const water = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0);

  it('должен безопасно конвертировать массу в моли', () => {
    const mass = new Mass(18.015, 'g');
    const moles = water.massToMoles(mass);
    console.log(`[DIMENSIONS] 18.015g H2O -> ${moles.to('mol')} mol`);
    expect(moles.to('mol')).toBeCloseTo(1, 4);
  });

  it('должен корректно конвертировать килограммы в граммы и миллиграммы', () => {
    const massKg = new Mass(0.5, 'kg');
    expect(massKg.to('g')).toBe(500);
    expect(massKg.to('mg')).toBe(500000);
  });

  it('должен корректно конвертировать литры в миллилитры', () => {
    const vol = new Volume(0.25, 'l');
    expect(vol.to('ml')).toBe(250);
  });
});
