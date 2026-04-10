import { IActivityModel, MixtureComponentData } from './activity-model.interface';
import { IChemicalEntity } from '../entities/chemical-entity.interface';

/**
 * Идеальная модель (Закон Рауля в чистом виде)
 * Все коэффициенты активности равны 1.0
 */
export class IdealActivityModel implements IActivityModel {
    getActivityCoefficients(
        components: MixtureComponentData[]
    ): Map<IChemicalEntity, number> {
        const gammas = new Map<IChemicalEntity, number>();
        for (const comp of components) {
            gammas.set(comp.entity, 1.0);
        }
        return gammas;
    }
}
