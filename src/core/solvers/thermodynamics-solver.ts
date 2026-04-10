import { IChemicalEntity } from '../entities/chemical-entity.interface';
import { IMultiphaseSystem } from '../entities/multiphase-system.interface';

export class ThermodynamicsSolver {
    /**
     * Вычисляет общую энтальпию многофазной системы (относительно 0 °C)
     * H = Σ (m_i * C_p,i * T)
     * 
     * @param system Многофазная система
     * @returns Энтальпия в Джоулях (J)
     */
    static calculateEnthalpy(system: IMultiphaseSystem): number {
        let totalEnthalpy = 0;

        for (const phase of system.phases) {
            const massGrams = phase.totalMass.to('g');
            const tempCelsius = phase.temperatureCelsius;
            
            // Получаем удельную теплоемкость фазы (смеси)
            const cp = phase.composition.getSpecificHeatCapacity(tempCelsius);
            
            // H = m * Cp * ΔT (относительно 0 °C)
            totalEnthalpy += massGrams * cp * tempCelsius;
        }

        return totalEnthalpy;
    }

    /**
     * Находит температуру кипения вещества или смеси при заданном давлении.
     * Использует численный метод бисекции (двоичного поиска).
     * 
     * @param entity Химическая сущность (чистое вещество или смесь)
     * @param targetPressure Давление окружающей среды (по умолчанию 760 мм рт. ст. = 1 атм)
     * @param tolerance Точность вычисления (в градусах Цельсия)
     * @returns Температура кипения в градусах Цельсия
     */
    static getBoilingPoint(entity: IChemicalEntity, targetPressure = 760, tolerance = 0.01): number {
        // Задаем разумные границы для поиска (от абсолютного нуля до очень высокой температуры)
        let minT = -273.15; 
        let maxT = 1000.0;
        
        let currentT = 0;
        let currentPressure = 0;
        
        // Ограничитель итераций для предотвращения бесконечного цикла
        const maxIterations = 1000;
        let iterations = 0;

        while (maxT - minT > tolerance && iterations < maxIterations) {
            currentT = (minT + maxT) / 2;
            currentPressure = entity.getVaporPressure(currentT);

            if (currentPressure < targetPressure) {
                // Давление слишком низкое, значит температура должна быть выше
                minT = currentT;
            } else {
                // Давление слишком высокое, значит температура должна быть ниже
                maxT = currentT;
            }
            iterations++;
        }

        if (iterations >= maxIterations) {
            throw new Error('Не удалось найти точку кипения: превышен лимит итераций.');
        }

        return currentT;
    }
}
