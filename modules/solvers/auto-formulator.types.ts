import { Mixture } from '@domain/entities/mixture';

export interface IOptimizationCriteria {
    targetHLB: number;
    maxPricePerKg?: number;
    requireEco?: boolean;
    weights: { price: number; irritation: number };
}

/** Целевые показатели рецептуры, проверяемые солверами. */
export interface IFormulationTargets {
    /** Минимальный балл моющей способности DetergencySolver (0–100). */
    minDetergencyScore?: number;
    /** Максимальное время высыхания DryingSolver до «сухого на отлип», мин. */
    maxTouchDryTimeMin?: number;
    /** Максимальное время полной полимеризации DryingSolver, мин. */
    maxFullDryTimeMin?: number;
}

export interface FormulationReport {
    mixture: Mixture;
    totalCost: number;
    averageIrritation: number;
    isEco: boolean;
    surfactantsUsed: { name: string, amount: number }[];
    /** Балл моющей способности (0–100), если оценивался. */
    detergencyScore?: number;
    /** Время «сухого на отлип», мин, если оценивалось. */
    touchDryTimeMin?: number;
    /** Время полной полимеризации, мин, если оценивалось. */
    fullDryTimeMin?: number;
    /** Механизм высыхания. */
    dryingMechanism?: 'evaporation' | 'oxidation' | 'hybrid';
}

