import { MultiphaseSystem } from '../entities/multiphase-system';
import { Phase } from '../entities/phase';
import { Mixture } from '../entities/mixture';
import { PhaseBoundary } from '../entities/phase-boundary';
import { Mass } from '../units/quantities';
import { SimulationContext } from './simulation-context';

// Solvers
import { ViscositySolver } from '../solvers/viscosity-solver';
import { StabilitySolver } from '../solvers/stability-solver';
import { ThermodynamicsSolver } from '../solvers/thermodynamics-solver';
import { FormulationSolver } from '../solvers/formulation-solver';
import { ProcessSolver } from '../solvers/process-solver';
import { IonicSolver } from '../solvers/ionic-solver';
import { SafetyValidator, ISafetyIssue } from '../solvers/safety-validator';
import { MiscibilitySolver, IMiscibilityReport } from '../solvers/miscibility-solver';
import { SolubilitySolver, ISolubilityIssue } from '../solvers/solubility-solver';
import { IChemicalEntity } from '../entities/chemical-entity.interface';
import { ISurfactant } from '../entities/surfactant.interface';

import { FormulationEntity } from '../entities/formulation-entity';
import { ManufacturingProcess } from './process-step.interface';
import { RawIngredientInput } from './types';

export interface SimulationResult {
  system: MultiphaseSystem;
  context: SimulationContext;
  metrics: {
    viscosity: number;
    stabilityDays: number;
    enthalpy: number;
    actualHLB: number;
    hld: number;
    ionicStrength: number;
    miscibility: IMiscibilityReport | null;
    ph: number;
    solubilityIssues: ISolubilityIssue[];
  };
  safety: {
    isSafe: boolean;
    issues: ISafetyIssue[];
  };
}

/**
 * Оркестратор решателей (Solver Orchestrator).
 * Определяет строгую последовательность вычислений (DAG - Directed Acyclic Graph).
 */
export class ChemicalEngine {
  public static runSimulation(inputs: RawIngredientInput[], context: SimulationContext): SimulationResult {
    // 0. Распаковка вложенных рецептур (Композиция композиций)
    const flattenedInputs = this.flattenInputs(inputs);

    // ШАГ 1: Инициализация и распределение по фазам (Базовая топология)
    const system = this.buildBaseSystem(flattenedInputs, context);

    // ШАГ 2: Термодинамика и Смешиваемость (Определяет, останутся ли фазы раздельными)
    let miscibility: IMiscibilityReport | null = null;
    if (system.phases.length >= 2) {
      const phase1Hansen = system.phases[0].composition.getHansenParameters();
      const phase2Hansen = system.phases[1].composition.getHansenParameters();
      if (phase1Hansen && phase2Hansen) {
        miscibility = MiscibilitySolver.calculateMiscibility(phase1Hansen, phase2Hansen);
        // TODO в будущем: если RED < 1, мы должны слить две фазы в одну (Истинный раствор)
      }
    }

    // ШАГ 3: Кинетика и Процесс (Размер капель зависит от фаз и энергии перемешивания)
    if (system.phases.length > 1 && context.mixingSpeedRpm > 0) {
      const dropletSize = ProcessSolver.calculateDropletSize(system, context.mixingSpeedRpm, context.mixingTimeMinutes);
      system.setDropletSize(dropletSize);
    }

    // ШАГ 4: Ионные равновесия (pH, ионная сила - влияют на вязкость полимеров)
    const ionicStrength = IonicSolver.calculateIonicStrength(system);
    const ph = IonicSolver.calculatePH(system);

    // ШАГ 4.1: Проверка растворимости (зависит от ионной силы)
    const solubilityIssues = SolubilitySolver.checkSaturation(system, ionicStrength);

    // ШАГ 5: Физические макросвойства (Вязкость зависит от размера капель, ионной силы и температуры)
    const viscosity = ViscositySolver.calculateEmulsionViscosity(system); // В будущем передавать context.temperature

    // ШАГ 6: Стабильность (Зависит от вязкости, размера капель и разницы плотностей)
    const hld = FormulationSolver.calculateHLD(system, context.temperatureCelsius);
    const stabilityDays = system.phases.length < 2 ? 730 : StabilitySolver.predictShelfLife(system, context.temperatureCelsius);

    // ШАГ 7: Энергетика и HLB
    const enthalpy = system.phases.length > 0 ? ThermodynamicsSolver.calculateEnthalpy(system) : 0;
    const actualHLB = FormulationSolver.calculateSystemHLB(system);
    
    // Определяем тип эмульсии
    const emulsionType = FormulationSolver.predictEmulsionType(system, context.temperatureCelsius);
    system.setEmulsionType(emulsionType);

    // ШАГ 8: Валидация безопасности (Финальная проверка всего состояния)
    const safetyIssues = SafetyValidator.validate(system, ph);

    return {
      system,
      context,
      metrics: {
        viscosity,
        stabilityDays,
        enthalpy,
        actualHLB,
        hld,
        ionicStrength,
        miscibility,
        ph,
        solubilityIssues
      },
      safety: {
        isSafe: safetyIssues.length === 0 && solubilityIssues.length === 0,
        issues: safetyIssues
      }
    };
  }

  /**
   * Симулирует полный технологический процесс шаг за шагом.
   * Возвращает массив состояний системы после каждого этапа.
   */
  public static runProcess(process: ManufacturingProcess): SimulationResult[] {
    const results: SimulationResult[] = [];
    const accumulatedInputs: RawIngredientInput[] = [];
    let currentTemperature = 25;

    for (const step of process.steps) {
      if (step.ingredients) {
        accumulatedInputs.push(...step.ingredients);
      }

      if (step.targetTemperature !== undefined) {
        currentTemperature = step.targetTemperature;
      }

      const context = new SimulationContext(
        currentTemperature,
        1,
        step.rpm || 0,
        step.durationMinutes
      );

      // Важно: мы запускаем симуляцию на накопленных ингредиентах
      const result = this.runSimulation(accumulatedInputs, context);
      results.push(result);
    }

    return results;
  }

  private static flattenInputs(inputs: RawIngredientInput[], multiplier = 1): RawIngredientInput[] {
    const result: RawIngredientInput[] = [];
    for (const input of inputs) {
      if (input.entity instanceof FormulationEntity) {
        const recipe = input.entity.getRecipe();
        const formulationTotalMass = recipe.reduce((sum, item) => sum + item.massGrams, 0);
        const fraction = formulationTotalMass > 0 ? input.massGrams / formulationTotalMass : 0;
        
        const unpacked = this.flattenInputs(recipe, multiplier * fraction);
        result.push(...unpacked);
      } else {
        result.push({
          entity: input.entity,
          massGrams: input.massGrams * multiplier,
          category: input.category
        });
      }
    }
    return result;
  }

  private static buildBaseSystem(inputs: RawIngredientInput[], context: SimulationContext): MultiphaseSystem {
    const waterPhase = new Phase(new Mixture(), new Mass(0, 'g'), context.temperatureCelsius);
    const oilPhase = new Phase(new Mixture(), new Mass(0, 'g'), context.temperatureCelsius);
    const surfactants: RawIngredientInput[] = [];

    let waterMass = 0;
    let oilMass = 0;

    for (const input of inputs) {
      const mass = new Mass(input.massGrams, 'g');
      if (input.category === 'water' || input.category === 'active' || input.category === 'solvent' || input.category === 'thickener') {
        waterPhase.composition.addComponent(input.entity, mass);
        waterMass += input.massGrams;
      } else if (input.category === 'oil') {
        oilPhase.composition.addComponent(input.entity, mass);
        oilMass += input.massGrams;
      } else if (input.category === 'surfactant') {
        surfactants.push(input);
      } else {
        waterPhase.composition.addComponent(input.entity, mass);
        waterMass += input.massGrams;
      }
    }

    // Обновляем массы фаз
    (waterPhase as any).totalMass = new Mass(waterMass, 'g');
    (oilPhase as any).totalMass = new Mass(oilMass, 'g');

    const phases: Phase[] = [];
    if (waterPhase.composition.getComponents().length > 0) phases.push(waterPhase);
    if (oilPhase.composition.getComponents().length > 0) phases.push(oilPhase);

    const boundaries: PhaseBoundary[] = [];
    if (phases.length > 1) {
      const boundary = new PhaseBoundary(phases[0], phases[1], 50); // Базовое натяжение 50 мН/м
      for (const surf of surfactants) {
        const moles = surf.entity.massToMoles(new Mass(surf.massGrams, 'g'));
        boundary.addSurfactant(surf.entity as unknown as ISurfactant, moles);
      }
      boundaries.push(boundary);
    } else if (surfactants.length > 0 && phases.length > 0) {
      phases[0].composition.addComponent(surfactants[0].entity, new Mass(surfactants[0].massGrams, 'g'));
    }

    return new MultiphaseSystem(phases, boundaries);
  }
}
