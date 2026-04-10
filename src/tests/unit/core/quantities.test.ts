import { describe, it, expect } from '../../../core/testing/mini-runner';
import { PureSubstance } from '../../../core/entities/pure-substance';
import { Mass } from '../../../core/units/quantities';

export function runQuantitiesTests() {
    describe('Unit Safety (Размерности)', () => {
        const water = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0);

        it('должен безопасно конвертировать массу в моли', () => {
            const mass = new Mass(18.015, 'g');
            const moles = water.massToMoles(mass);
            expect(moles.to('mol')).toBeCloseTo(1, 4);
        });
    });
}
