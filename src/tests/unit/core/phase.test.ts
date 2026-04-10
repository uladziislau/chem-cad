import { describe, it, expect } from '../../../core/testing/mini-runner';
import { PureSubstance } from '../../../core/entities/pure-substance';
import { Mixture } from '../../../core/entities/mixture';
import { Phase } from '../../../core/entities/phase';
import { Mass } from '../../../core/units/quantities';

export function runPhaseTests() {
    describe('Phase (Макроскопические свойства)', () => {
        const water = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0);
        const ethanol = new PureSubstance('Ethanol', 46.07, 8.20417, 1642.89, 230.300, 0.789);

        it('должен рассчитывать плотность и объем чистой фазы', () => {
            const waterMix = new Mixture();
            waterMix.addComponent(water, new Mass(100, 'g'));
            const waterPhase = new Phase(waterMix, new Mass(100, 'g'));
            
            expect(waterPhase.getDensity()).toBeCloseTo(1.0, 1);
            expect(waterPhase.getVolume().to('ml')).toBeCloseTo(100, 1);
        });

        it('должен рассчитывать плотность смеси (вода + этанол)', () => {
            const mix = new Mixture();
            mix.addComponent(water, new Mass(50, 'g'));
            mix.addComponent(ethanol, new Mass(50, 'g'));
            
            const phase = new Phase(mix, new Mass(100, 'g'));
            // Density = 100 / (50/1.0 + 50/0.789) = 0.882
            expect(phase.getDensity()).toBeCloseTo(0.882, 2);
        });
    });
}
