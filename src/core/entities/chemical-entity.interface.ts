import { Mass, Moles } from '../units/quantities';
import { HansenParameters } from '../thermodynamics/hansen-parameters';

export interface IChemicalEntity {
    /**
     * Возвращает массу сущности (молярную для чистого вещества, среднюю для смеси)
     */
    getMass(): number;

    /**
     * Возвращает давление насыщенного пара при заданной температуре
     * @param temperatureCelsius Температура в градусах Цельсия
     * @returns Давление в мм рт. ст. (или другой согласованной единице)
     */
    getVaporPressure(temperatureCelsius: number): number;

    /**
     * Возвращает плотность сущности (г/мл)
     * @param temperatureCelsius Температура в градусах Цельсия (опционально)
     */
    getDensity(temperatureCelsius?: number): number;

    /**
     * Конвертирует массу в моли для данной сущности
     */
    massToMoles(mass: Mass): Moles;

    /**
     * Конвертирует моли в массу для данной сущности
     */
    molesToMass(moles: Moles): Mass;

    /**
     * Возвращает удельную теплоемкость (Дж / (г * К))
     * @param temperatureCelsius Температура в градусах Цельсия (опционально)
     */
    getSpecificHeatCapacity(temperatureCelsius?: number): number;

    /**
     * Возвращает динамическую вязкость (cP) при заданной температуре
     * @param temperatureCelsius Температура в градусах Цельсия
     */
    getViscosity(temperatureCelsius: number): number;

    /**
     * Возвращает точку плавления (°C)
     */
    getMeltingPoint(): number;

    /**
     * Возвращает pKa (для кислот/оснований). Может быть массивом для многоосновных кислот.
     */
    getPKas(): number[] | undefined;

    /**
     * Возвращает тип электролита
     */
    getElectrolyteType(): 'acid' | 'base' | 'salt' | 'neutral';

    /**
     * Возвращает название сущности
     */
    getName(): string;

    /**
     * Возвращает заряд иона (для электролитов)
     */
    getIonicCharge(): number;

    /**
     * Возвращает параметры растворимости Хансена (если применимо)
     */
    getHansenParameters(): HansenParameters | undefined;

    /**
     * Возвращает растворимость в воде (г/100мл) при заданной температуре и ионной силе
     * @param temperatureCelsius Температура в градусах Цельсия
     * @param ionicStrength Ионная сила раствора
     */
    getSolubilityWater(temperatureCelsius: number, ionicStrength: number): number;
}
