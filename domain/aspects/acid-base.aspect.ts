import { IChemicalAspect } from './chemical-aspect.interface';
import { AcidBaseProfile } from '../values/acid-base-profile';

/**
 * Аспект кислотно-основных свойств (диссоциация, буферная емкость, заряд при pH).
 */
export class AcidBaseAspect implements IChemicalAspect {
  public static readonly TYPE = 'AcidBaseAspect';
  public readonly aspectType = AcidBaseAspect.TYPE;

  constructor(
    public readonly profile: AcidBaseProfile
  ) {
    Object.freeze(this);
  }

  public get pKaValues(): readonly number[] {
    return this.profile.pKaValues;
  }

  public get isBase(): boolean {
    return this.profile.isBase;
  }

  public getChargeAtPH(ph: number): number {
    return this.profile.getNetChargeAtPH(ph);
  }
}
