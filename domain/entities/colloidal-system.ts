import { DomainPhase } from './domain-phase';
import { DomainPhaseBoundary } from './domain-phase-boundary';
import { DropletSpectrum } from '../values/droplet-spectrum';
import { SurfaceActiveAspect } from '../aspects/surface-active.aspect';
import { LipophilicAspect } from '../aspects/lipophilic.aspect';
import { ElectrolyteAspect } from '../aspects/electrolyte.aspect';
import { AcidBaseAspect } from '../aspects/acid-base.aspect';

export type EmulsionMorphology = 'O/W' | 'W/O' | 'Multiple' | 'Solution' | 'Suspension';

export interface HLDCalculationOptions {
  readonly eacn?: number;
  readonly salinityWeightPercent?: number;
  readonly temperatureCelsius?: number;
}

const POLAR_SOLVENT_TOKENS = ['water', 'вода', 'aqua', 'glycerin', 'глицерин'];

/**
 * Корневой агрегат дисперсной коллоидной системы (Colloidal System Aggregate Root).
 * Координирует фазовую морфологию, границы раздела и гранулометрический спектр.
 */
export class ColloidalSystem {
  private dropletSpectrum: DropletSpectrum = DropletSpectrum.monoDisperse(10.0);

  constructor(
    public readonly phases: DomainPhase[] = [],
    public readonly boundaries: DomainPhaseBoundary[] = []
  ) {}

  public getDropletSpectrum(): DropletSpectrum {
    return this.dropletSpectrum;
  }

  public setDropletSpectrum(spectrum: DropletSpectrum): void {
    this.dropletSpectrum = spectrum;
  }

  public getTotalMassGrams(): number {
    let mass = 0;
    for (const phase of this.phases) {
      mass += phase.getTotalMassGrams();
    }
    return mass;
  }

  /**
   * Семантический поиск водной/полярной фазы
   */
  public findAqueousPhase(): DomainPhase | null {
    return this.phases.find(phase => this.isPhasePolar(phase)) ?? this.phases[0] ?? null;
  }

  /**
   * Семантический поиск масляной/неполярной фазы
   */
  public findOilPhase(): DomainPhase | null {
    const aqueous = this.findAqueousPhase();
    return this.phases.find(phase => phase !== aqueous) ?? null;
  }

  /**
   * Определяет морфологию дисперсной системы с учетом HLD и катастрофической инверсии фаз (φ > 0.74)
   */
  public getMorphology(): EmulsionMorphology {
    if (this.phases.length <= 1) return 'Solution';

    const waterPhase = this.findAqueousPhase();
    const oilPhase = this.findOilPhase();
    if (!waterPhase || !oilPhase) return 'Solution';

    const volWater = waterPhase.getTotalVolumeMl();
    const volOil = oilPhase.getTotalVolumeMl();
    const totalVol = volWater + volOil;
    if (totalVol <= 0) return 'Solution';

    const phiOil = volOil / totalVol;
    const phiWater = volWater / totalVol;

    // 1. Геометрический предел плотной упаковки жестких сфер: катастрофическая инверсия фаз
    if (phiOil > 0.74) return 'W/O';
    if (phiWater > 0.74) return 'O/W';

    // 2. Термодинамическая кривизна ПАВ (HLD)
    if (this.hasBoundarySurfactants()) {
      const hld = this.calculateHLD();
      if (hld < -0.5) return 'O/W';
      if (hld > 0.5) return 'W/O';
    }

    // 3. Переходная зона HLD ≈ 0 или эмульсия без ПАВ: преобладание объема
    return phiWater >= phiOil ? 'O/W' : 'W/O';
  }

  /**
   * Полный расчет HLD (Hydrophilic-Lipophilic Difference) с учетом EACN масла,
   * солености водной фазы, температуры и типа ПАВ (ионный/неионный).
   */
  public calculateHLD(options?: HLDCalculationOptions): number {
    const eacn = options?.eacn ?? this.resolveOilEacn();
    const salinity = options?.salinityWeightPercent ?? this.resolveAqueousSalinityPercent();
    const temp = options?.temperatureCelsius ?? this.resolveSystemTemperature();

    let weightedHld = 0;
    let totalSurfactantMoles = 0;

    for (const boundary of this.boundaries) {
      for (const record of boundary.getAdsorbedSurfactants()) {
        const surfAspect = record.species.getAspect<SurfaceActiveAspect>(SurfaceActiveAspect.TYPE);
        if (!surfAspect) continue;

        const hldSingle = this.computeSingleSurfactantHLD(surfAspect, eacn, salinity, temp);
        weightedHld += hldSingle * record.moles;
        totalSurfactantMoles += record.moles;
      }
    }

    if (totalSurfactantMoles <= 0) return -1.0;
    return weightedHld / totalSurfactantMoles;
  }

  private computeSingleSurfactantHLD(
    surf: SurfaceActiveAspect,
    eacn: number,
    salinity: number,
    tempCelsius: number
  ): number {
    const k = 0.17;
    const deltaT = tempCelsius - 25.0;

    if (surf.surfactantType === 'nonionic') {
      const b = 0.13;
      const aT = 0.06; // Неионные ПАВ дегидратируются при нагреве (HLD растет)
      return b * salinity - k * eacn + surf.characteristicCurvatureCc + aT * deltaT;
    }

    // Ионные и амфотерные ПАВ: логарифмический вклад соли и отрицательный aT
    const aT = -0.01;
    const saltTerm = Math.log(1.0 + 1.7 * Math.max(0, salinity));
    return saltTerm - k * eacn + surf.characteristicCurvatureCc + aT * deltaT;
  }

  private resolveOilEacn(): number {
    const oilPhase = this.findOilPhase();
    if (!oilPhase) return 10.0;

    let weightedEacn = 0;
    let lipoMass = 0;

    for (const record of oilPhase.getAllComponents()) {
      const lipo = record.species.getAspect<LipophilicAspect>(LipophilicAspect.TYPE);
      if (lipo) {
        weightedEacn += lipo.eacn * record.massGrams;
        lipoMass += record.massGrams;
      }
    }

    return lipoMass > 0 ? weightedEacn / lipoMass : 10.0;
  }

  private resolveAqueousSalinityPercent(): number {
    const waterPhase = this.findAqueousPhase();
    if (!waterPhase) return 0;

    const totalMass = waterPhase.getTotalMassGrams();
    if (totalMass <= 0) return 0;

    let saltMass = 0;
    for (const record of waterPhase.getAllComponents()) {
      if (record.species.hasAspect(ElectrolyteAspect.TYPE)) {
        saltMass += record.massGrams;
      }
    }
    return (saltMass / totalMass) * 100.0;
  }

  private resolveSystemTemperature(): number {
    return this.phases[0]?.temperatureCelsius ?? 25.0;
  }

  private hasBoundarySurfactants(): boolean {
    return this.boundaries.some(b =>
      b.getAdsorbedSurfactants().some(s => s.species.hasAspect(SurfaceActiveAspect.TYPE))
    );
  }

  private isPhasePolar(phase: DomainPhase): boolean {
    const hasWaterToken = phase.getAllComponents().some(record => {
      const nameLower = record.species.name.toLowerCase();
      return (
        POLAR_SOLVENT_TOKENS.some(token => nameLower.includes(token)) ||
        record.species.hasAspect(AcidBaseAspect.TYPE) ||
        record.species.hasAspect(ElectrolyteAspect.TYPE)
      );
    });
    if (hasWaterToken) return true;

    const hansen = phase.getAverageHansenVector();
    return hansen !== null && (hansen.polarP + hansen.hydrogenH) > 18;
  }
}
