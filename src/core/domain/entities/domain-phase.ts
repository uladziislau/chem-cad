import { ChemicalSpecies } from './chemical-species';
import { HansenVector } from '../values/hansen-vector';
import { HansenSolubilityAspect } from '../aspects/hansen-solubility.aspect';

export interface PhaseComponentRecord {
  readonly species: ChemicalSpecies;
  massGrams: number;
}

/**
 * Агрегат гомогенной термодинамической фазы (Phase Aggregate).
 * Управляет объемом, плотностью, составом и уравнениями состояния при заданных T и P.
 */
export class DomainPhase {
  private readonly components = new Map<string, PhaseComponentRecord>();

  constructor(
    public readonly id: string,
    public readonly name: string,
    public temperatureCelsius = 25,
    public pressureAtm = 1.0
  ) {}

  public addComponent(species: ChemicalSpecies, massGrams: number): this {
    if (massGrams <= 0) return this;

    const existing = this.components.get(species.id);
    if (existing) {
      existing.massGrams += massGrams;
    } else {
      this.components.set(species.id, { species, massGrams });
    }
    return this;
  }

  public getComponent(speciesId: string): PhaseComponentRecord | null {
    return this.components.get(speciesId) ?? null;
  }

  public getAllComponents(): readonly PhaseComponentRecord[] {
    return Array.from(this.components.values());
  }

  public getTotalMassGrams(): number {
    let total = 0;
    for (const record of this.components.values()) {
      total += record.massGrams;
    }
    return total;
  }

  /**
   * Суммарный объем фазы в мл (с учетом аддитивности идеальных объемов)
   */
  public getTotalVolumeMl(): number {
    let totalVol = 0;
    for (const record of this.components.values()) {
      totalVol += record.species.massGramsToVolumeMl(record.massGrams);
    }
    return totalVol;
  }

  /**
   * Эффективная плотность фазы (г/мл)
   */
  public getDensityGPerMl(): number {
    const totalMass = this.getTotalMassGrams();
    const totalVol = this.getTotalVolumeMl();
    if (totalVol <= 0) return 1.0;
    return totalMass / totalVol;
  }

  /**
   * Общее количество молей в фазе
   */
  public getTotalMoles(): number {
    let totalMoles = 0;
    for (const record of this.components.values()) {
      totalMoles += record.species.massGramsToMoles(record.massGrams);
    }
    return totalMoles;
  }

  /**
   * Усредненный вектор параметров растворимости Хансена для фазы
   */
  public getAverageHansenVector(): HansenVector | null {
    const totalMass = this.getTotalMassGrams();
    if (totalMass <= 0) return null;

    let sumD = 0;
    let sumP = 0;
    let sumH = 0;
    let weightedMass = 0;

    for (const record of this.components.values()) {
      const hansenAspect = record.species.getAspect<HansenSolubilityAspect>(HansenSolubilityAspect.TYPE);
      if (hansenAspect) {
        sumD += hansenAspect.vector.dispersionD * record.massGrams;
        sumP += hansenAspect.vector.polarP * record.massGrams;
        sumH += hansenAspect.vector.hydrogenH * record.massGrams;
        weightedMass += record.massGrams;
      }
    }

    if (weightedMass <= 0) return null;
    return new HansenVector(sumD / weightedMass, sumP / weightedMass, sumH / weightedMass);
  }
}
