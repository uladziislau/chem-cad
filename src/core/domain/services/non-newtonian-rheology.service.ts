import { ColloidalSystem } from '../entities/colloidal-system';
import { RheologicalProfile } from '../values/rheological-profile';
import { PolymericNetworkAspect } from '../aspects/polymeric-network.aspect';
import { PHEquilibriumService } from './ph-equilibrium.service';

export interface RheologyEvaluationOptions {
  readonly ph: number;
  readonly ionicStrengthM?: number;
  readonly continuousPhaseViscosityCp?: number;
}

/**
 * Доменный сервис расчета неньютоновской реологии Гершеля-Балкли.
 * Вычисляет предел текучести (Yield Stress) и сдвиговое разжижение (Shear Thinning).
 */
export class NonNewtonianRheologyService {
  /**
   * Рассчитывает полный реологический профиль системы по уравнению Гершеля-Балкли:
   * τ = τ0 + K * γ̇^n
   */
  public static calculateSystemProfile(
    system: ColloidalSystem,
    options: RheologyEvaluationOptions
  ): RheologicalProfile {
    const aqueousPhase = system.findAqueousPhase();
    const computedI = aqueousPhase
      ? PHEquilibriumService.calculateIonicStrength(aqueousPhase, options.ph)
      : 0.001;
    const ionicStrength = options.ionicStrengthM ?? Math.max(0.001, computedI);
    const baseViscosity = options.continuousPhaseViscosityCp ?? 1.0;

    // 1. Полимерный вклад в реологию
    const polymerContribution = this.evaluatePolymerNetwork(system, options.ph, ionicStrength);

    // 2. Эмульсионный вклад с учетом реальной морфологии (O/W vs W/O)
    const emulsionContribution = this.evaluateEmulsionCrowding(system);

    // 3. Синтез реологических параметров Гершеля-Балкли
    const yieldStressPa = polymerContribution.yieldStressPa + emulsionContribution.yieldStressPa;
    const consistencyK = (baseViscosity / 1000.0) + polymerContribution.consistencyK + emulsionContribution.consistencyK;
    const flowBehaviorN = Math.min(polymerContribution.flowBehaviorN, emulsionContribution.flowBehaviorN);

    return new RheologicalProfile(yieldStressPa, consistencyK, flowBehaviorN, polymerContribution.restingViscosityCp);
  }

  /**
   * Оценивает гидрогелевую сетку полимеров (с синергетическим суммированием нескольких загустителей)
   */
  private static evaluatePolymerNetwork(
    system: ColloidalSystem,
    ph: number,
    ionicStrength: number
  ): { yieldStressPa: number; consistencyK: number; flowBehaviorN: number; restingViscosityCp: number } {
    let yieldPowerSum = 0;
    let totalConsistency = 0;
    let minFlowIndex = 1.0;
    let totalRestingCp = 0;

    for (const phase of system.phases) {
      const phaseMass = phase.getTotalMassGrams();
      if (phaseMass <= 0) continue;

      for (const record of phase.getAllComponents()) {
        const networkAspect = record.species.getAspect<PolymericNetworkAspect>(PolymericNetworkAspect.TYPE);
        if (!networkAspect) continue;

        const polymerWeightPercent = (record.massGrams / phaseMass) * 100.0;
        const expansionFactor = networkAspect.calculateChainExpansionFactor(ph, ionicStrength);

        const effectiveConcentration = polymerWeightPercent * expansionFactor;
        const yieldPa = Math.pow(effectiveConcentration * 4.0, 1.8);
        yieldPowerSum += Math.pow(yieldPa, 1.5);

        totalConsistency += Math.pow(effectiveConcentration * 5.0, 1.5);

        const localN = Math.max(0.2, 1.0 - expansionFactor * 0.7);
        minFlowIndex = Math.min(minFlowIndex, localN);

        totalRestingCp += effectiveConcentration * networkAspect.intrinsicViscosityBaseDlPerG * 8000.0;
      }
    }

    const yieldStressPa = yieldPowerSum > 0 ? Math.pow(yieldPowerSum, 1.0 / 1.5) : 0;

    return {
      yieldStressPa,
      consistencyK: totalConsistency,
      flowBehaviorN: minFlowIndex,
      restingViscosityCp: totalRestingCp
    };
  }

  /**
   * Оценивает вклад капель эмульсии: доля дисперсной фазы берется строго по морфологии (O/W vs W/O),
   * что позволяет корректно моделировать концентрированные кремы (φ > 0.55 вплоть до 0.74).
   */
  private static evaluateEmulsionCrowding(
    system: ColloidalSystem
  ): { yieldStressPa: number; consistencyK: number; flowBehaviorN: number } {
    if (system.phases.length < 2) {
      return { yieldStressPa: 0, consistencyK: 0, flowBehaviorN: 1.0 };
    }

    const waterPhase = system.findAqueousPhase();
    const oilPhase = system.findOilPhase();
    if (!waterPhase || !oilPhase) {
      return { yieldStressPa: 0, consistencyK: 0, flowBehaviorN: 1.0 };
    }

    const volWater = waterPhase.getTotalVolumeMl();
    const volOil = oilPhase.getTotalVolumeMl();
    const totalVol = volWater + volOil;
    if (totalVol <= 0) return { yieldStressPa: 0, consistencyK: 0, flowBehaviorN: 1.0 };

    const morphology = system.getMorphology();
    const dispersedVol = morphology === 'W/O' ? volWater : volOil;
    const phiDispersed = dispersedVol / totalVol;

    // Упаковка Кригера-Догерти (φ_max = 0.78 для полидисперсных капель)
    const phiMax = 0.78;
    const safePhi = Math.min(phiDispersed, 0.75);
    const kriegerFactor = Math.pow(1.0 - safePhi / phiMax, -2.5 * phiMax);

    // При плотной упаковке капель (phi > 0.55) капли деформируются, создавая предел текучести и псевдопластичность
    if (phiDispersed > 0.55) {
      const crowdingExcess = phiDispersed - 0.55;
      return {
        yieldStressPa: crowdingExcess * 35.0,
        consistencyK: crowdingExcess * 12.0 + (kriegerFactor - 1.0) * 0.5,
        flowBehaviorN: Math.max(0.35, 1.0 - crowdingExcess * 1.8)
      };
    }

    return {
      yieldStressPa: 0,
      consistencyK: (kriegerFactor - 1.0) * 0.25,
      flowBehaviorN: Math.max(0.8, 1.0 - phiDispersed * 0.3)
    };
  }
}
