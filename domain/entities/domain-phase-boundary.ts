import { DomainPhase } from './domain-phase';
import { ChemicalSpecies } from './chemical-species';
import { SurfaceActiveAspect } from '../aspects/surface-active.aspect';

export interface AdsorbedSurfactantRecord {
  readonly species: ChemicalSpecies;
  moles: number;
}

/**
 * Агрегат межфазной границы раздела (Phase Boundary Aggregate).
 * Управляет двумерным переходным слоем, адсорбцией ПАВ и межфазным натяжением.
 */
export class DomainPhaseBoundary {
  private readonly adsorbedSurfactants = new Map<string, AdsorbedSurfactantRecord>();

  constructor(
    public readonly phaseAlpha: DomainPhase,
    public readonly phaseBeta: DomainPhase,
    public readonly baseInterfacialTensionMNPerM = 50.0 // Чистое натяжение без ПАВ
  ) {}

  public adsorbSurfactant(species: ChemicalSpecies, moles: number): this {
    if (moles <= 0) return this;

    const existing = this.adsorbedSurfactants.get(species.id);
    if (existing) {
      existing.moles += moles;
    } else {
      this.adsorbedSurfactants.set(species.id, { species, moles });
    }
    return this;
  }

  public getAdsorbedSurfactants(): readonly AdsorbedSurfactantRecord[] {
    return Array.from(this.adsorbedSurfactants.values());
  }

  /**
   * Расчет текущего межфазного натяжения по многокомпонентной изотерме Шишковского:
   * γ = γ0 - R*T * Γ_max * ln(1 + Σ K_L,i * C_eff,i)
   * Расчет выполняется в молярной концентрации (моль/л), что обеспечивает масштабную инвариантность.
   */
  public getInterfacialTension(): number {
    if (this.adsorbedSurfactants.size === 0) {
      return this.baseInterfacialTensionMNPerM;
    }

    const totalVolumeL = (this.phaseAlpha.getTotalVolumeMl() + this.phaseBeta.getTotalVolumeMl()) / 1000.0;
    const referenceVolumeL = totalVolumeL > 0 ? totalVolumeL : 1.0;

    const R = 8.314; // Дж/(моль·К)
    const T = this.phaseAlpha.temperatureCelsius + 273.15;

    let adsorptionStrengthSum = 0;
    let weightedGammaMax = 0;

    for (const record of this.adsorbedSurfactants.values()) {
      const surfAspect = record.species.getAspect<SurfaceActiveAspect>(SurfaceActiveAspect.TYPE);
      if (!surfAspect) continue;

      const molarity = record.moles / referenceVolumeL;
      const safeCmc = Math.max(1e-7, surfAspect.cmcMolesPerLiter);
      // Выше ККМ концентрация мономеров на межфазной границе стабилизируется (мицеллярное плато)
      const effectiveMonomerM = Math.min(molarity, safeCmc * 1.2);
      const langmuirK = 20.0 / safeCmc;
      const strength = langmuirK * effectiveMonomerM;

      adsorptionStrengthSum += strength;
      weightedGammaMax += surfAspect.maxSurfaceExcessMolPerM2 * strength;
    }

    if (adsorptionStrengthSum <= 0) {
      return this.baseInterfacialTensionMNPerM;
    }

    const effectiveGammaMax = weightedGammaMax / adsorptionStrengthSum;
    const deltaPi = (R * T * effectiveGammaMax * 1000) * Math.log(1 + adsorptionStrengthSum);
    const tension = this.baseInterfacialTensionMNPerM - Math.max(0, deltaPi);

    return Math.max(0.1, tension);
  }
}
