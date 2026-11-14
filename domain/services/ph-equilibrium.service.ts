import { DomainPhase } from '@domain/entities/domain-phase';
import { AcidBaseAspect } from '../aspects/acid-base.aspect';
import { ElectrolyteAspect } from '../aspects/electrolyte.aspect';
import { ChemicalSpecies } from '@domain/entities/chemical-species';

export interface TitrationPoint {
  readonly titrantVolumeMl: number;
  readonly ph: number;
}

interface AcidBaseItem {
  aspect: AcidBaseAspect;
  molarity: number;
}

const DEFAULT_TITRANT_SOLVENT = new ChemicalSpecies('titrant_water', 'Вода растворителя', 'Aqua', 18.015, 1.0);

/**
 * Доменный сервис строгого расчета кислотно-основного равновесия и pH.
 * Решает уравнение электронейтральности с учетом коэффициентов активности Дэвиса и ионной силы.
 */
export class PHEquilibriumService {
  private static readonly KW = 1e-14;
  private static readonly TOLERANCE = 1e-4;

  /**
   * Рассчитывает ионную силу водной фазы I = 0.5 * Σ(c_i * z_i^2)
   * с учетом сильных электролитов (солей) и ионизированных форм кислот/оснований при текущем pH.
   */
  public static calculateIonicStrength(waterPhase: DomainPhase, ph = 7.0): number {
    const volumeLiters = waterPhase.getTotalVolumeMl() / 1000.0;
    if (volumeLiters <= 0) return 0;

    let ionicStrength = this.computeBackgroundSaltIonicStrength(waterPhase, volumeLiters);
    const acidBaseSpecies = this.extractAcidBaseSpecies(waterPhase, volumeLiters);

    for (const item of acidBaseSpecies) {
      const fractions = item.aspect.profile.getSpeciesFractions(ph);
      const n = item.aspect.pKaValues.length;
      for (let k = 0; k < fractions.length; k++) {
        const z = item.aspect.isBase ? (n - k) : k;
        if (z !== 0) {
          ionicStrength += 0.5 * item.molarity * fractions[k] * z * z;
        }
      }
    }

    const hPlus = Math.pow(10, -ph);
    const ohMinus = this.KW / hPlus;
    ionicStrength += 0.5 * (hPlus + ohMinus);

    return ionicStrength;
  }

  /**
   * Коэффициент активности однозарядного иона γ_1 по уравнению Дэвиса (25°C)
   */
  public static getActivityCoefficientGamma1(ionicStrengthM: number): number {
    if (ionicStrengthM <= 0) return 1.0;
    const boundedI = Math.min(0.5, ionicStrengthM);
    const sqrtI = Math.sqrt(boundedI);
    const log10Gamma = -0.509 * (sqrtI / (1.0 + sqrtI) - 0.3 * boundedI);
    return Math.pow(10, log10Gamma);
  }

  /**
   * Рассчитывает точный равновесный pH водной фазы с учетом неидеальности (Дэвис)
   */
  public static calculateEquilibriumPH(waterPhase: DomainPhase): number {
    const volumeLiters = waterPhase.getTotalVolumeMl() / 1000.0;
    if (volumeLiters <= 0) return 7.0;

    const acidBaseSpecies = this.extractAcidBaseSpecies(waterPhase, volumeLiters);
    if (acidBaseSpecies.length === 0) return 7.0;

    const saltIonicStrength = this.computeBackgroundSaltIonicStrength(waterPhase, volumeLiters);
    return this.bisectRoot(acidBaseSpecies, saltIonicStrength);
  }

  /**
   * Моделирует кривую титрования: нейтрализация кислоты щелочью с учетом реального разбавления водой титранта
   */
  public static simulateTitration(
    initialPhase: DomainPhase,
    titrantSpecies: ChemicalSpecies,
    titrantMolarity: number,
    maxTitrantVolumeMl: number,
    stepsCount = 10
  ): TitrationPoint[] {
    const points: TitrationPoint[] = [];
    const stepMl = maxTitrantVolumeMl / stepsCount;
    const solventSpecies = this.findSolventSpecies(initialPhase) ?? DEFAULT_TITRANT_SOLVENT;

    for (let i = 0; i <= stepsCount; i++) {
      const addedMl = i * stepMl;
      const addedMoles = (addedMl / 1000.0) * titrantMolarity;
      const addedMassG = titrantSpecies.molesToMassGrams(addedMoles);
      const soluteVolumeMl = titrantSpecies.massGramsToVolumeMl(addedMassG);
      const dilutionWaterMl = Math.max(0, addedMl - soluteVolumeMl);

      const testPhase = new DomainPhase(`titration_${i}`, initialPhase.name, initialPhase.temperatureCelsius);
      for (const comp of initialPhase.getAllComponents()) {
        testPhase.addComponent(comp.species, comp.massGrams);
      }
      testPhase.addComponent(titrantSpecies, addedMassG);
      if (dilutionWaterMl > 0) {
        testPhase.addComponent(solventSpecies, dilutionWaterMl * solventSpecies.densityGPerMl);
      }

      const ph = this.calculateEquilibriumPH(testPhase);
      points.push({ titrantVolumeMl: addedMl, ph });
    }

    return points;
  }

  private static computeBackgroundSaltIonicStrength(phase: DomainPhase, volumeLiters: number): number {
    let ionicStrength = 0;
    for (const record of phase.getAllComponents()) {
      const elec = record.species.getAspect<ElectrolyteAspect>(ElectrolyteAspect.TYPE);
      if (elec) {
        const molarity = record.species.massGramsToMoles(record.massGrams) / volumeLiters;
        ionicStrength += molarity * elec.ionicStrengthMultiplier;
      }
    }
    return ionicStrength;
  }

  private static findSolventSpecies(phase: DomainPhase): ChemicalSpecies | null {
    for (const record of phase.getAllComponents()) {
      const nameLower = record.species.name.toLowerCase();
      if (nameLower.includes('water') || nameLower.includes('вода') || nameLower.includes('aqua')) {
        return record.species;
      }
    }
    return null;
  }

  private static extractAcidBaseSpecies(phase: DomainPhase, volumeLiters: number): AcidBaseItem[] {
    const result: AcidBaseItem[] = [];
    for (const record of phase.getAllComponents()) {
      const aspect = record.species.getAspect<AcidBaseAspect>(AcidBaseAspect.TYPE);
      if (aspect) {
        const moles = record.species.massGramsToMoles(record.massGrams);
        result.push({ aspect, molarity: moles / volumeLiters });
      }
    }
    return result;
  }

  private static calculateResidual(ph: number, species: readonly AcidBaseItem[], saltIonicStrength: number): number {
    const aHPlus = Math.pow(10, -ph);
    let speciesIonicStrength = 0;
    let netSpeciesCharge = 0;

    for (const item of species) {
      const fractions = item.aspect.profile.getSpeciesFractions(ph);
      const n = item.aspect.pKaValues.length;
      for (let k = 0; k < fractions.length; k++) {
        const z = item.aspect.isBase ? (n - k) : -k;
        netSpeciesCharge += z * fractions[k] * item.molarity;
        if (z !== 0) {
          speciesIonicStrength += 0.5 * item.molarity * fractions[k] * z * z;
        }
      }
    }

    const totalI = saltIonicStrength + speciesIonicStrength;
    const gamma1 = this.getActivityCoefficientGamma1(totalI);
    const hPlusConc = aHPlus / gamma1;
    const ohMinusConc = this.KW / (aHPlus * gamma1);

    return hPlusConc - ohMinusConc + netSpeciesCharge;
  }

  private static bisectRoot(species: readonly AcidBaseItem[], saltIonicStrength: number): number {
    let low = 0.0;
    let high = 14.0;

    let fLow = this.calculateResidual(low, species, saltIonicStrength);
    const fHigh = this.calculateResidual(high, species, saltIonicStrength);

    if (fLow < 0 && fHigh < 0) return 0.0;
    if (fLow > 0 && fHigh > 0) return 14.0;

    for (let iter = 0; iter < 100; iter++) {
      const mid = (low + high) / 2.0;
      const fMid = this.calculateResidual(mid, species, saltIonicStrength);

      if (Math.abs(fMid) < this.TOLERANCE || (high - low) / 2.0 < this.TOLERANCE) {
        return mid;
      }

      if ((fLow > 0 && fMid > 0) || (fLow < 0 && fMid < 0)) {
        low = mid;
        fLow = fMid;
      } else {
        high = mid;
      }
    }

    return (low + high) / 2.0;
  }
}
