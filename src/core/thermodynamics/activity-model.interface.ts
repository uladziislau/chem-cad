import { IChemicalEntity } from '../entities/chemical-entity.interface';

export interface MixtureComponentData {
    entity: IChemicalEntity;
    moleFraction: number;
}

/**
 * Интерфейс для моделей расчета коэффициентов активности (неидеальность смеси)
 */
export interface IActivityModel {
    /**
     * Возвращает коэффициенты активности (gamma) для компонентов смеси
     * @param components Список компонентов и их мольных долей
     * @param temperatureCelsius Температура
     */
    getActivityCoefficients(
        components: MixtureComponentData[],
        temperatureCelsius: number
    ): Map<IChemicalEntity, number>;
}
