import { describe, it, expect } from 'vitest';
import { MultiphaseSystem } from '../../../core/entities/multiphase-system';
import { Phase } from '../../../core/entities/phase';
import { Mixture } from '../../../core/entities/mixture';
import { PhaseBoundary } from '../../../core/entities/phase-boundary';
import { Mass } from '../../../core/units/quantities';
import { ChemTelemetry } from '../../../core/testing/test-telemetry';

describe('MultiphaseSystem (Эмульсионный контейнер и коалесценция)', () => {
  it('должен рассчитывать индекс стабильности', () => {
    const phase1 = new Phase(new Mixture(), new Mass(100, 'g'));
    const phase2 = new Phase(new Mixture(), new Mass(100, 'g'));
    const boundary = new PhaseBoundary(phase1, phase2, 50.0);

    const system = new MultiphaseSystem([phase1, phase2], [boundary]);
    const stability = system.getStabilityIndex();

    ChemTelemetry.logSystemProfile('Initial Emulsion Setup', system, {
      'Stability Index': stability.toFixed(3),
      'Initial Droplet d32': `${system.getDropletSize()} µm`
    });

    expect(stability).toBeGreaterThan(0);
    expect(stability).toBeLessThanOrEqual(1.0);
  });

  it('должен симулировать старение и коалесценцию капель (Ostwald Ripening)', () => {
    const phase1 = new Phase(new Mixture(), new Mass(100, 'g'));
    const phase2 = new Phase(new Mixture(), new Mass(100, 'g'));
    const boundary = new PhaseBoundary(phase1, phase2, 50.0);
    const system = new MultiphaseSystem([phase1, phase2], [boundary]);

    const initialSize = system.getDropletSize();
    system.simulateAging(24); // 24 часа старения
    const agedSize = system.getDropletSize();

    console.log(`[AGING KINETICS] 24-Hour Aging:`);
    console.log(`  • Начальный диаметр капель d32: ${initialSize.toFixed(2)} µm`);
    console.log(`  • Диаметр после 24ч старения:   ${agedSize.toFixed(2)} µm  [Рост +${(agedSize - initialSize).toFixed(2)} µm]`);

    expect(agedSize).toBeGreaterThan(initialSize);
  });
});
