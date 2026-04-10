import { describe, it, expect } from '../../core/testing/mini-runner';
import { PureSubstance } from '../../core/entities/pure-substance';
import { Mixture } from '../../core/entities/mixture';
import { Moles } from '../../core/units/quantities';
import { IActivityModel } from '../../core/thermodynamics/activity-model.interface';

export function runThermodynamicsIntegrationTests() {
    describe('Thermodynamics Integration (Неидеальность)', () => {
        const water = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0);
        const ethanol = new PureSubstance('Ethanol', 46.07, 8.20417, 1642.89, 230.300, 0.789);

        it('должен учитывать коэффициенты активности в смеси', () => {
            const mixture = new Mixture();
            mixture.addComponent(water, new Moles(0.5, 'mol'));
            mixture.addComponent(ethanol, new Moles(0.5, 'mol'));

            const t = 78;
            const idealPressure = mixture.getVaporPressure(t);

            const nonIdealModel: IActivityModel = {
                getActivityCoefficients: () => new Map([[water, 1.2], [ethanol, 1.2]])
            };
            
            mixture.setActivityModel(nonIdealModel);
            const nonIdealPressure = mixture.getVaporPressure(t);

            expect(nonIdealPressure).toBeGreaterThan(idealPressure);
        });
    });
}
