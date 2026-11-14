import { describe, it, expect } from 'vitest';
import { EmulsionSolver } from '@root-modules/solvers/emulsion-solver';
import { Surfactant } from '@domain/entities/surfactant';

describe('EmulsionSolver (HLB-блендинг ПАВ)', () => {
  const lowHLB = new Surfactant('Span-80', 428, 4.3, 10, 1);
  const highHLB = new Surfactant('Tween-80', 1310, 15.0, 8, 1);

  it('целевой HLB между ПАВ → корректная пропорция', () => {
    const r = EmulsionSolver.calculateSurfactantBlend(lowHLB, highHLB, 10);
    // fractionA = (10 - 15) / (4.3 - 15) = (-5)/(-10.7) ≈ 0.467
    expect(r.surfactantAAmount).toBeCloseTo(0.467, 2);
    expect(r.surfactantAAmount + r.surfactantBAmount).toBeCloseTo(1.0);
  });

  it('целевой HLB = HLB первого → вся фаза A', () => {
    const r = EmulsionSolver.calculateSurfactantBlend(lowHLB, highHLB, 4.3);
    expect(r.surfactantAAmount).toBeCloseTo(1.0);
    expect(r.surfactantBAmount).toBeCloseTo(0.0);
  });

  it('целевой HLB выше диапазона → ошибка', () => {
    expect(() => EmulsionSolver.calculateSurfactantBlend(lowHLB, highHLB, 20))
      .toThrow('Невозможно достичь HLB');
  });

  it('одинаковые HLB → 50/50', () => {
    const a = new Surfactant('A', 100, 10, 5, 1);
    const b = new Surfactant('B', 200, 10, 5, 1);
    const r = EmulsionSolver.calculateSurfactantBlend(a, b, 10);
    expect(r.surfactantAAmount).toBeCloseTo(0.5);
    expect(r.surfactantBAmount).toBeCloseTo(0.5);
  });
});
