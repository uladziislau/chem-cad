import { ChemicalEngine, SimulationResult } from '@root-modules/engine/chemical-engine';
import { SimulationContext } from '@root-modules/engine/simulation-context';
import { RawIngredientInput } from '@root-modules/engine/types';
import { IChemicalEntity } from '@domain/entities/chemical-entity.interface';

export interface TargetSpec {
  ph?: { min: number; max: number };
  viscosityCps?: { min: number; max: number };
  stabilityDays?: { min: number; max: number };
  hlb?: { min: number; max: number };
  ionicStrength?: { min: number; max: number };
}


export interface OptimizationConstraint {
  ingredient: {
    entity: IChemicalEntity;
    category: string;
    minPercent: number;
    maxPercent: number;
    stepPercent: number;
    name: string;
  };
  targetPercent?: number;
  isFixed?: boolean;
}

export interface OptimizationResult {
  recipe: RawIngredientInput[];
  totalLoss: number;
  metrics: {
    ph: number;
    viscosityCps: number;
    stabilityDays: number;
    hlb: number;
    ionicStrength: number;
  };
  isSafe: boolean;
  iterations: number;
  converged: boolean;
}

const DEFAULT_CONTEXT = new SimulationContext(25, 1, 3000, 30);

/**
 * Constraint-Based Formulation Solver (PRO-1).
 * Декларативный подбор рецептуры: пользователь задает целевые свойства,
 * решатель находит оптимальное соотношение ингредиентов.
 */
export class ConstraintSolver {

  static optimize(
    constraints: OptimizationConstraint[],
    targetSpecs: TargetSpec,
    baseMassGrams = 100,
    maxIterations = 500
  ): OptimizationResult {
    const variableIngredients = constraints.filter(c => !c.isFixed);
    const fixedIngredients = constraints.filter(c => c.isFixed);

    // Начальная точка: равномерное распределение или targetPercent, нормализованная к 100%
    const initialPercents = this.normalizePercents(this.initialGuess(variableIngredients), variableIngredients);
    let currentPercents = [...initialPercents];
    let bestResult = this.evaluate(currentPercents, constraints, fixedIngredients, targetSpecs, baseMassGrams, DEFAULT_CONTEXT);

    // Координатный спуск с адаптивным шагом
    let stepSize = 5.0; // процент
    let iterations = 0;
    let noImproveCount = 0;

    while (iterations < maxIterations && stepSize > 0.1) {
      let improved = false;

      for (let i = 0; i < variableIngredients.length; i++) {
        for (const direction of [-1, 1]) {
          const trial = [...currentPercents];
          trial[i] = this.clamp(trial[i] + direction * stepSize, variableIngredients[i].ingredient.minPercent, variableIngredients[i].ingredient.maxPercent);

          // Нормализация: сумма должна быть 100%
          const normalized = this.normalizePercents(trial, variableIngredients);

          const result = this.evaluate(normalized, constraints, fixedIngredients, targetSpecs, baseMassGrams, DEFAULT_CONTEXT);
          iterations++;

          if (result.totalLoss < bestResult.totalLoss) {
            bestResult = result;
            currentPercents = [...normalized];
            improved = true;
            noImproveCount = 0;
          }
        }
      }

      if (!improved) {
        noImproveCount++;
        if (noImproveCount >= variableIngredients.length * 2) {
          stepSize *= 0.5;
          noImproveCount = 0;
        }
      }
    }

    const converged = bestResult.totalLoss < 0.01;
    return { ...bestResult, iterations, converged };
  }

  private static initialGuess(constraints: OptimizationConstraint[]): number[] {
    return constraints.map(c => {
      if (c.targetPercent !== undefined) return c.targetPercent;
      const { minPercent, maxPercent } = c.ingredient;
      return (minPercent + maxPercent) / 2;
    });
  }

  private static normalizePercents(percents: number[], constraints: OptimizationConstraint[]): number[] {
    const total = percents.reduce((s, p) => s + p, 0);
    if (total <= 0) return percents;

    // Пропорциональное масштабирование к 100%
    const scale = 100 / total;
    return percents.map((p, i) => {
      const scaled = p * scale;
      return this.clamp(scaled, constraints[i].ingredient.minPercent, constraints[i].ingredient.maxPercent);
    });
  }

  private static evaluate(
    percents: number[],
    allConstraints: OptimizationConstraint[],
    fixedConstraints: OptimizationConstraint[],
    targetSpecs: TargetSpec,
    baseMassGrams: number,
    context: SimulationContext
  ): Omit<OptimizationResult, 'iterations' | 'converged'> {
    const inputs: RawIngredientInput[] = [];

    // Фиксированные ингредиенты
    for (const c of fixedConstraints) {
      inputs.push({
        entity: c.ingredient.entity,
        massGrams: (c.targetPercent ?? c.ingredient.minPercent) / 100 * baseMassGrams,
        category: c.ingredient.category
      });
    }

    // Переменные ингредиенты
    const variableConstraints = allConstraints.filter(c => !c.isFixed);
    for (let i = 0; i < variableConstraints.length; i++) {
      const c = variableConstraints[i];
      inputs.push({
        entity: c.ingredient.entity,
        massGrams: percents[i] / 100 * baseMassGrams,
        category: c.ingredient.category
      });
    }

    const simResult = ChemicalEngine.runSimulation(inputs, context);
    const loss = this.calculateLoss(simResult, targetSpecs);

    return {
      recipe: inputs,
      totalLoss: loss,
      metrics: {
        ph: simResult.metrics.ph,
        viscosityCps: simResult.metrics.viscosity,
        stabilityDays: simResult.metrics.stabilityDays,
        hlb: simResult.metrics.actualHLB,
        ionicStrength: simResult.metrics.ionicStrength
      },
      isSafe: simResult.safety.isSafe
    };
  }

  private static calculateLoss(result: SimulationResult, specs: TargetSpec): number {
    let loss = 0;

    if (specs.ph) {
      loss += this.rangePenalty(result.metrics.ph, specs.ph.min, specs.ph.max, 2.0);
    }
    if (specs.viscosityCps) {
      loss += this.rangePenalty(result.metrics.viscosity, specs.viscosityCps.min, specs.viscosityCps.max, 1.0);
    }
    if (specs.stabilityDays) {
      loss += this.rangePenalty(result.metrics.stabilityDays, specs.stabilityDays.min, specs.stabilityDays.max, 0.01);
    }
    if (specs.hlb) {
      loss += this.rangePenalty(result.metrics.actualHLB, specs.hlb.min, specs.hlb.max, 0.5);
    }
    if (specs.ionicStrength) {
      loss += this.rangePenalty(result.metrics.ionicStrength, specs.ionicStrength.min, specs.ionicStrength.max, 1.0);
    }

    // Штраф за безопасность
    if (!result.safety.isSafe) {
      loss += 100;
    }

    return loss;
  }

  private static rangePenalty(value: number, min: number, max: number, weight: number): number {
    if (value >= min && value <= max) return 0;
    const distance = value < min ? min - value : value - max;
    return distance * weight;
  }

  private static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
