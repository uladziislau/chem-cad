import { IMultiphaseSystem } from '../entities/multiphase-system.interface';
import { FormulationSolver } from './formulation-solver';

/**
 * Решатель для углубленного анализа стабильности эмульсий
 */
export class StabilitySolver {
    /**
     * Рассчитывает скорость седиментации или кремирования (мм/день)
     * На основе закона Стокса
     */
    static calculateSeparationRate(system: IMultiphaseSystem): number {
        if (system.phases.length < 2) return 0;

        // Freeze Lock: если хотя бы одна фаза застыла, макроскопическое движение прекращается
        if (system.phases.some(p => p.isSolid())) return 0;

        const continuousPhase = system.phases[0];
        const dispersedPhase = system.phases[1];

        const rho_c = continuousPhase.getDensity(); // г/мл
        const rho_d = dispersedPhase.getDensity(); // г/мл
        const eta = continuousPhase.getViscosity() * 0.001; // Па*с (cP -> Pa*s)
        
        const r = (system.getDropletSize() / 2) * 1e-6; // радиус в метрах
        const g = 9.81; // м/с^2

        // Скорость в м/с: v = 2/9 * r^2 * g * (rho_d - rho_c) / eta
        // Умножаем на 1000 т.к. плотность в г/мл (1000 кг/м3)
        const deltaRho = (rho_d - rho_c) * 1000;
        const velocityMS = (2/9) * Math.pow(r, 2) * g * deltaRho / eta;

        // Конвертируем в мм/день для удобства технолога
        const velocityMmDay = velocityMS * 1000 * 60 * 60 * 24;

        return velocityMmDay;
    }

    /**
     * Прогноз времени жизни эмульсии до видимого расслоения (дни)
     */
    static predictShelfLife(system: IMultiphaseSystem, temperatureCelsius = 25): number {
        const rate = Math.abs(this.calculateSeparationRate(system));
        if (rate === 0) return 365 * 2; // 2 года если идеально стабильно

        // Условно: расслоение на 5 мм считается критическим
        const criticalSeparationMm = 5.0;
        const baseLife = criticalSeparationMm / rate;

        // 1. Химический фактор стабильности (HLB)
        const hlbMismatch = FormulationSolver.calculateHLBMismatch(system);
        const hlbFactor = Math.exp(-hlbMismatch / 1.5);

        // 2. Термодинамический фактор (HLD)
        // При HLD ≈ 0 межфазное натяжение минимально, что способствует коалесценции макроэмульсий.
        // Оптимальная стабильность макроэмульсий обычно при |HLD| > 1
        const hld = FormulationSolver.calculateHLD(system, temperatureCelsius);
        const hldFactor = Math.min(1.0, Math.abs(hld) / 0.5);

        // Учитываем индекс стабильности системы, HLB и HLD факторы
        return baseLife * system.getStabilityIndex() * hlbFactor * hldFactor;
    }
}
