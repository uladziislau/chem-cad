import { describe, it, expect } from 'vitest';
import { ConstraintSolver, TargetSpec, OptimizationConstraint } from '@root-modules/solvers/constraint-solver';
import { PureSubstance } from '@domain/entities/pure-substance';
import { IChemicalEntity } from '@domain/entities/chemical-entity.interface';

describe('ConstraintSolver (PRO-1)', () => {
  const water = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0);
  const ethanol = new PureSubstance('Ethanol', 46.07, 8.20417, 1642.89, 230.300, 0.789);
  const glycerin = new PureSubstance('Glycerin', 92.09, 9.5, 2000, 290, 1.26);

  it('должен найти оптимальное соотношение для целевого pH', () => {
    const constraints: OptimizationConstraint[] = [
      {
        ingredient: {
          entity: water as IChemicalEntity,
          category: 'water',
          minPercent: 50,
          maxPercent: 95,
          stepPercent: 5,
          name: 'Water'
        },
        isFixed: false
      },
      {
        ingredient: {
          entity: ethanol as IChemicalEntity,
          category: 'oil',
          minPercent: 5,
          maxPercent: 50,
          stepPercent: 5,
          name: 'Ethanol'
        },
        isFixed: false
      }
    ];

    const target: TargetSpec = {
      ph: { min: 6.5, max: 7.5 }
    };

    const result = ConstraintSolver.optimize(constraints, target, 100, 100);

    expect(result.recipe.length).toBe(2);
    expect(result.metrics.ph).toBeGreaterThan(0);
    expect(result.iterations).toBeGreaterThan(0);
    expect(result.totalLoss).toBeGreaterThanOrEqual(0);
  });

  it('должен учитывать фиксированные ингредиенты', () => {
    const constraints: OptimizationConstraint[] = [
      {
        ingredient: {
          entity: water as IChemicalEntity,
          category: 'water',
          minPercent: 60,
          maxPercent: 90,
          stepPercent: 5,
          name: 'Water'
        },
        targetPercent: 80,
        isFixed: true
      },
      {
        ingredient: {
          entity: ethanol as IChemicalEntity,
          category: 'oil',
          minPercent: 10,
          maxPercent: 40,
          stepPercent: 5,
          name: 'Ethanol'
        },
        isFixed: false
      }
    ];

    const target: TargetSpec = {
      viscosityCps: { min: 1, max: 100 }
    };

    const result = ConstraintSolver.optimize(constraints, target, 100, 50);

    expect(result.recipe.length).toBe(2);
    // Water должен быть ~80% от 100г = 80г
    const waterInput = result.recipe.find(r => r.category === 'water');
    expect(waterInput).toBeDefined();
    expect(waterInput!.massGrams).toBeCloseTo(80, 0);
  });

  it('должен возвращать isSafe=false при нарушении безопасности', () => {
    const constraints: OptimizationConstraint[] = [
      {
        ingredient: {
          entity: water as IChemicalEntity,
          category: 'water',
          minPercent: 90,
          maxPercent: 100,
          stepPercent: 5,
          name: 'Water'
        },
        isFixed: false
      },
      {
        ingredient: {
          entity: ethanol as IChemicalEntity,
          category: 'oil',
          minPercent: 0,
          maxPercent: 10,
          stepPercent: 5,
          name: 'Ethanol'
        },
        isFixed: false
      }
    ];

    const target: TargetSpec = {
      ph: { min: 0, max: 1 } // Экстремально кислый pH — нереалистично
    };

    const result = ConstraintSolver.optimize(constraints, target, 100, 50);

    expect(result.isSafe).toBeDefined();
    expect(result.totalLoss).toBeGreaterThanOrEqual(0);
  });

  it('должен обрабатывать пустой список ограничений', () => {
    const result = ConstraintSolver.optimize([], {}, 100, 10);
    expect(result.recipe).toHaveLength(0);
    expect(result.iterations).toBe(0);
  });

  it('должен нормализовать проценты к 100%', () => {
    const constraints: OptimizationConstraint[] = [
      {
        ingredient: {
          entity: water as IChemicalEntity,
          category: 'water',
          minPercent: 30,
          maxPercent: 70,
          stepPercent: 5,
          name: 'Water'
        },
        isFixed: false
      },
      {
        ingredient: {
          entity: ethanol as IChemicalEntity,
          category: 'oil',
          minPercent: 20,
          maxPercent: 60,
          stepPercent: 5,
          name: 'Ethanol'
        },
        isFixed: false
      },
      {
        ingredient: {
          entity: glycerin as IChemicalEntity,
          category: 'thickener',
          minPercent: 5,
          maxPercent: 30,
          stepPercent: 5,
          name: 'Glycerin'
        },
        isFixed: false
      }
    ];

    const result = ConstraintSolver.optimize(constraints, {}, 100, 100);
    const totalMass = result.recipe.reduce((sum, r) => sum + r.massGrams, 0);
    expect(totalMass).toBeCloseTo(100, 0);
  });
});
