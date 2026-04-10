import { IPhase } from './phase.interface';
import { IPhaseBoundary } from './phase-boundary.interface';
import { Mixture } from './mixture';

export interface IMultiphaseSystem {
    readonly phases: IPhase[];
    readonly boundaries: IPhaseBoundary[];
    
    /**
     * Средний размер капель дисперсной фазы (мкм)
     */
    getDropletSize(): number;

    /**
     * Рассчитывает индекс стабильности системы (0.0 - 1.0)
     * 1.0 - абсолютно стабильная, 0.0 - мгновенное расслоение
     */
    getStabilityIndex(): number;

    /**
     * Возвращает суммарный химический состав всей системы
     */
    getGlobalComposition(): Mixture;

    /**
     * Симулирует старение системы
     * @param hours время в часах
     */
    simulateAging(hours: number): void;

    /**
     * Тип эмульсии: O/W (масло в воде), W/O (вода в масле), Multiple (множественная)
     */
    getEmulsionType(): 'O/W' | 'W/O' | 'Multiple' | 'Unknown';

    /**
     * Устанавливает тип эмульсии
     */
    setEmulsionType(type: 'O/W' | 'W/O' | 'Multiple' | 'Unknown'): void;
}
