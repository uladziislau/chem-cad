import { IChemicalAspect } from './chemical-aspect.interface';

/**
 * Аспект сильного электролита (соли, минеральные добавки).
 * Позволяет точно вычислять ионную силу I = 0.5 * Σ(c_i * z_i^2) и соленость водной фазы.
 */
export class ElectrolyteAspect implements IChemicalAspect {
  public static readonly TYPE = 'ElectrolyteAspect';
  public readonly aspectType = ElectrolyteAspect.TYPE;

  public readonly ionicStrengthMultiplier: number;

  constructor(
    public readonly cationCharge = 1,
    public readonly anionCharge = 1,
    public readonly cationStoichiometry = 1,
    public readonly anionStoichiometry = 1
  ) {
    // Например: NaCl -> 0.5*(1*1^2 + 1*1^2) = 1
    // CaCl2 -> 0.5*(1*2^2 + 2*1^2) = 3
    // MgSO4 -> 0.5*(1*2^2 + 1*2^2) = 4
    this.ionicStrengthMultiplier =
      0.5 * (cationStoichiometry * cationCharge * cationCharge + anionStoichiometry * anionCharge * anionCharge);
    Object.freeze(this);
  }
}
