import { describe, it, expect } from 'vitest';
import { ChemicalSpecies } from '../../core/domain/entities/chemical-species';
import { DomainPhase } from '../../core/domain/entities/domain-phase';
import { DomainPhaseBoundary } from '../../core/domain/entities/domain-phase-boundary';
import { ColloidalSystem } from '../../core/domain/entities/colloidal-system';
import { ElectrokineticAspect } from '../../core/domain/aspects/electrokinetic.aspect';
import { DropletSpectrum } from '../../core/domain/values/droplet-spectrum';
import { ColloidalStabilityService } from '../../core/domain/services/colloidal-stability.service';

describe('Domain ColloidalStabilityService (Энергетические барьеры DLVO и дзета-потенциал)', () => {
  const water = new ChemicalSpecies('water', 'Вода', 'Aqua', 18.015, 1.0);
  const oil = new ChemicalSpecies('mineral_oil', 'Минеральное масло', 'Paraffinum Liquidum', 300.0, 0.85);
  
  // Анионный стабилизатор эмульсии (высокий отрицательный дзета-потенциал -45 мВ)
  const anionicStabilizer = new ChemicalSpecies('stabilizer', 'Анионный стабилизатор', 'Sodium Stearate', 306.46, 1.02)
    .withAspect(new ElectrokineticAspect(
      -48.0, // стандартный дзета-потенциал -48 мВ
      3.2,   // pI изоэлектрическая точка
      -6.5   // поверхностный заряд
    ));

  it('должен рассчитывать сжатие дебаевской длины экранирования при росте ионной силы', () => {
    const waterPhase = new DomainPhase('phase_w', 'Вода');
    waterPhase.addComponent(water, 80.0);
    const oilPhase = new DomainPhase('phase_o', 'Масло');
    oilPhase.addComponent(oil, 20.0);

    const boundary = new DomainPhaseBoundary(waterPhase, oilPhase);
    boundary.adsorbSurfactant(anionicStabilizer, 0.002);

    const system = new ColloidalSystem([waterPhase, oilPhase], [boundary]);
    system.setDropletSpectrum(DropletSpectrum.monoDisperse(2.5));

    // 1. Деионизированная среда (низкая соленость I = 0.001 M)
    const dlvoPure = ColloidalStabilityService.evaluateDLVO(system, { ph: 7.0, ionicStrengthM: 0.001 });

    // 2. Высокая соленость (морская вода / электролиты I = 0.5 M)
    const dlvoSalted = ColloidalStabilityService.evaluateDLVO(system, { ph: 7.0, ionicStrengthM: 0.5 });

    console.log(`\n┌─ [DLVO DEBYE SCREENING] Влияние электролитов на двойной слой ───────────`);
    console.log(`│ Соленость I = 0.001M: Дебаевская толщина κ^-1 = ${dlvoPure.debyeLengthNm.toFixed(2)} нм, ζ = ${dlvoPure.surfacePotentialMv.toFixed(1)} мВ, Барьер = ${dlvoPure.energyBarrierKbT.toFixed(1)} kBT`);
    console.log(`│ Соленость I = 0.500M: Дебаевская толщина κ^-1 = ${dlvoSalted.debyeLengthNm.toFixed(2)} нм, ζ = ${dlvoSalted.surfacePotentialMv.toFixed(1)} мВ, Барьер = ${dlvoSalted.energyBarrierKbT.toFixed(1)} kBT`);
    console.log(`└─────────────────────────────────────────────────────────────────────────`);

    expect(dlvoPure.debyeLengthNm).toBeGreaterThan(dlvoSalted.debyeLengthNm);
    expect(dlvoPure.isAggregativelyStable).toBe(true);
    expect(dlvoSalted.energyBarrierKbT).toBeLessThan(dlvoPure.energyBarrierKbT);
  });

  it('должен прогнозировать потерю устойчивости при приближении pH к изоэлектрической точке (pI = 3.2)', () => {
    const waterPhase = new DomainPhase('phase_w', 'Вода');
    waterPhase.addComponent(water, 80.0);
    const oilPhase = new DomainPhase('phase_o', 'Масло');
    oilPhase.addComponent(oil, 20.0);

    const boundary = new DomainPhaseBoundary(waterPhase, oilPhase);
    boundary.adsorbSurfactant(anionicStabilizer, 0.002);

    const system = new ColloidalSystem([waterPhase, oilPhase], [boundary]);
    system.setDropletSpectrum(DropletSpectrum.monoDisperse(2.5));

    const dlvoNeutral = ColloidalStabilityService.evaluateDLVO(system, { ph: 7.0, ionicStrengthM: 0.01 });
    const dlvoAcid = ColloidalStabilityService.evaluateDLVO(system, { ph: 3.3, ionicStrengthM: 0.01 });

    console.log(`\n┌─ [DLVO ISOELECTRIC CHARGE COLLAPSE] Влияние pH на стабильность ─────────`);
    console.log(`│ pH 7.0: ζ = ${dlvoNeutral.surfacePotentialMv.toFixed(1)} мВ ➔ Барьер = ${dlvoNeutral.energyBarrierKbT.toFixed(1)} kBT [СТАБИЛЬНА: ${dlvoNeutral.stabilityGrade}]`);
    console.log(`│ pH 3.3: ζ = ${dlvoAcid.surfacePotentialMv.toFixed(1)} мВ ➔ Барьер = ${dlvoAcid.energyBarrierKbT.toFixed(1)} kBT [КОАЛЕСЦЕНЦИЯ: ${dlvoAcid.stabilityGrade}]`);
    console.log(`└─────────────────────────────────────────────────────────────────────────`);

    expect(Math.abs(dlvoAcid.surfacePotentialMv)).toBeLessThan(Math.abs(dlvoNeutral.surfacePotentialMv));
    expect(dlvoAcid.energyBarrierKbT).toBeLessThan(dlvoNeutral.energyBarrierKbT);
  });
});
