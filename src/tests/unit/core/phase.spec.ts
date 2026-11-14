import { describe, it, expect } from 'vitest';
import { PureSubstance } from '../../../core/entities/pure-substance';
import { Mixture } from '../../../core/entities/mixture';
import { Phase } from '../../../core/entities/phase';
import { Mass } from '../../../core/units/quantities';

describe('Phase (Макроскопические свойства фаз)', () => {
  const water = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0);
  const ethanol = new PureSubstance('Ethanol', 46.07, 8.20417, 1642.89, 230.300, 0.789);

  it('должен рассчитывать плотность и объем чистой водной фазы', () => {
    const waterMix = new Mixture();
    waterMix.addComponent(water, new Mass(100, 'g'));
    const waterPhase = new Phase(waterMix, new Mass(100, 'g'));

    const density = waterPhase.getDensity();
    const volume = waterPhase.getVolume().to('ml');
    console.log(`[PHASE PURE] Water 100g -> Density: ${density.toFixed(3)} g/ml, Volume: ${volume.toFixed(1)} ml`);

    expect(density).toBeCloseTo(1.0, 1);
    expect(volume).toBeCloseTo(100, 1);
  });

  it('должен рассчитывать плотность смеси (вода + этанол)', () => {
    const mix = new Mixture();
    mix.addComponent(water, new Mass(50, 'g'));
    mix.addComponent(ethanol, new Mass(50, 'g'));

    const phase = new Phase(mix, new Mass(100, 'g'));
    const density = phase.getDensity();
    const volume = phase.getVolume().to('ml');
    console.log(`[PHASE MIX] Water (50g) + Ethanol (50g) -> Density: ${density.toFixed(3)} g/ml, Total Vol: ${volume.toFixed(1)} ml`);

    // Density = 100 / (50/1.0 + 50/0.789) = 0.882 г/мл
    expect(density).toBeCloseTo(0.882, 2);
  });
});
