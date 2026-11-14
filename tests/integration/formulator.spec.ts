import { describe, it, expect } from 'vitest';
import { Oil } from '@domain/entities/oil';
import { Surfactant } from '@domain/entities/surfactant';
import { AutoFormulator } from '@root-modules/solvers/auto-formulator';
import { Mass } from '@root-modules/units/quantities';
import { PureSubstance } from '@domain/entities/pure-substance';
import { ChemicalEngine } from '@root-modules/engine/chemical-engine';
import { SimulationContext } from '@root-modules/engine/simulation-context';
import { ChemTelemetry } from '@root-modules/testing/test-telemetry';

describe('AutoFormulator Integration (Автоматическая оптимизация рецептур и эмульсий)', () => {
  const water = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0);
  const almondOil = new Oil('Almond Oil', 800, 6.0, 0, 0, false, 0, 0, 0, 0.9);
  const surfactantsDB = [
    new Surfactant('Span 80', 428.6, 4.3, 15.0, 1, true),
    new Surfactant('Tween 80', 1310, 15.0, 45.0, 2, true)
  ];

  it('должен подобрать оптимальную рецептуру эмульсии под требуемый HLB', () => {
    const report = AutoFormulator.optimizeEmulsion(
      almondOil, new Mass(20, 'g'),
      water, new Mass(75, 'g'),
      surfactantsDB, new Mass(5, 'g')
    );

    console.log(`\n┌─ [AUTO FORMULATOR REPORT] Оптимизация эмульсии ───────────────────`);
    console.log(`│ Стоимость:     $${report.totalCost.toFixed(2)}`);
    console.log(`│ ПАВ в смеси:   ${report.surfactantsUsed.map(s => s.name).join(', ')}`);
    console.log(`│ Раздражение:   ${report.averageIrritation.toFixed(1)} / 10`);
    console.log(`└──────────────────────────────────────────────────────────────────`);

    expect(report.totalCost).toBeGreaterThan(0);
    expect(report.mixture).toBeDefined();
    expect(report.surfactantsUsed.length).toBeGreaterThan(0);
  });

  it('должен рассчитать полный физический профиль крема через ChemicalEngine', () => {
    const inputs = [
      { entity: water, massGrams: 75, category: 'water' },
      { entity: almondOil, massGrams: 20, category: 'oil' },
      { entity: surfactantsDB[1], massGrams: 5, category: 'surfactant' }
    ];
    const context = new SimulationContext(25, 1, 3000, 10);
    const result = ChemicalEngine.runSimulation(inputs, context);

    ChemTelemetry.logSimulation('Cold-Process Almond Lotion (20% Oil, 5% Tween 80)', result);

    expect(result.metrics.viscosity).toBeGreaterThan(0);
    expect(result.metrics.ph).toBeCloseTo(7.0, 0.5);
    expect(result.system.getEmulsionType()).toBe('O/W');
    expect(result.safety.isSafe).toBe(true);
  });
});
