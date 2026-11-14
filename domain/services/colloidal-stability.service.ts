import { ColloidalSystem } from '../entities/colloidal-system';
import { DLVOPotential } from '../values/dlvo-potential';
import { ElectrokineticAspect } from '../aspects/electrokinetic.aspect';
import { PHEquilibriumService } from './ph-equilibrium.service';

export interface StabilityEvaluationContext {
  readonly ph: number;
  readonly ionicStrengthM?: number;
  readonly temperatureCelsius?: number;
}

/**
 * Доменный сервис оценки коллоидной стабильности дисперсий и эмульсий по теории DLVO.
 * Рассчитывает высоту потенциального барьера отталкивания V_max между каплями.
 */
export class ColloidalStabilityService {
  private static readonly KB = 1.380649e-23; // Дж/К
  private static readonly HAMAKER_CONSTANT_J = 1.2e-20; // Константа Гамакера для капель масла в воде (Дж)

  /**
   * Рассчитывает потенциальный профиль DLVO для дисперсной системы
   */
  public static evaluateDLVO(
    system: ColloidalSystem,
    context: StabilityEvaluationContext
  ): DLVOPotential {
    const tempK = (context.temperatureCelsius ?? 25.0) + 273.15;
    const aqueousPhase = system.findAqueousPhase();
    const autoIonic = aqueousPhase
      ? PHEquilibriumService.calculateIonicStrength(aqueousPhase, context.ph)
      : 1e-5;
    const ionicStrength = Math.max(1e-5, context.ionicStrengthM ?? autoIonic);

    // 1. Дебаевская длина экранирования κ^-1 (нм) в воде при 25°C: κ^-1 ≈ 0.304 / sqrt(I) нм
    const debyeLengthNm = 0.304 / Math.sqrt(ionicStrength);

    // 2. Эффективный дзета-потенциал поверхности ζ (мВ)
    const zetaPotentialMv = this.determineSystemZetaMv(system, context.ph, ionicStrength);

    // 3. Радиус капель R (м)
    const dropletRadiusM = (system.getDropletSpectrum().d32Microns * 1e-6) / 2.0;

    // 4. Диэлектрическая проницаемость сплошной фазы (вода 78.5, масло 2.5 при W/O)
    const epsilonR = system.getMorphology() === 'W/O' ? 2.5 : 78.5;

    // 5. Поиск максимума потенциального барьера V_max(h) = V_repulsion(h) + V_attraction(h)
    const energyBarrierKbT = this.calculateBarrierKbT(debyeLengthNm, zetaPotentialMv, dropletRadiusM, tempK, epsilonR);

    return new DLVOPotential(debyeLengthNm, zetaPotentialMv, energyBarrierKbT);
  }

  private static determineSystemZetaMv(
    system: ColloidalSystem,
    ph: number,
    ionicStrength: number
  ): number {
    for (const boundary of system.boundaries) {
      for (const record of boundary.getAdsorbedSurfactants()) {
        const electroAspect = record.species.getAspect<ElectrokineticAspect>(ElectrokineticAspect.TYPE);
        if (electroAspect) {
          return electroAspect.calculateEffectiveZetaMv(ph, ionicStrength);
        }
      }
    }
    return -25.0 / Math.sqrt(1.0 + ionicStrength * 10.0);
  }

  private static calculateBarrierKbT(
    debyeLengthNm: number,
    zetaMv: number,
    radiusM: number,
    tempK: number,
    epsilonR: number
  ): number {
    const kappaM = 1.0 / (debyeLengthNm * 1e-9);
    const epsilon0 = 8.854e-12; // Ф/м
    const psi0V = zetaMv / 1000.0;
    const thermalEnergyJ = this.KB * tempK;

    // Мелкая сетка 0.05 нм в ближней зоне (0.25..5.0 нм), чтобы не пропускать узкий пик при высоких соленостях
    let maxBarrierJ = 0;
    maxBarrierJ = this.scanRangeMaxJ(0.25, 5.0, 0.05, maxBarrierJ, kappaM, epsilon0, epsilonR, radiusM, psi0V);
    maxBarrierJ = this.scanRangeMaxJ(5.25, 25.0, 0.25, maxBarrierJ, kappaM, epsilon0, epsilonR, radiusM, psi0V);

    return maxBarrierJ / thermalEnergyJ;
  }

  private static scanRangeMaxJ(
    startNm: number,
    endNm: number,
    stepNm: number,
    currentMaxJ: number,
    kappaM: number,
    epsilon0: number,
    epsilonR: number,
    radiusM: number,
    psi0V: number
  ): number {
    let maxJ = currentMaxJ;
    for (let hNm = startNm; hNm <= endNm; hNm += stepNm) {
      const hM = hNm * 1e-9;
      const repulsionJ = 2.0 * Math.PI * epsilon0 * epsilonR * radiusM * (psi0V * psi0V) * Math.log(1.0 + Math.exp(-kappaM * hM));
      const attractionJ = -(this.HAMAKER_CONSTANT_J * radiusM) / (12.0 * hM);
      const netEnergyJ = repulsionJ + attractionJ;
      if (netEnergyJ > maxJ) {
        maxJ = netEnergyJ;
      }
    }
    return maxJ;
  }
}
