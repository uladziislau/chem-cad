import { IChemicalAspect } from './chemical-aspect.interface';
import { HansenVector } from '../values/hansen-vector';

/**
 * Аспект термодинамической растворимости по Хансену.
 */
export class HansenSolubilityAspect implements IChemicalAspect {
  public static readonly TYPE = 'HansenSolubilityAspect';
  public readonly aspectType = HansenSolubilityAspect.TYPE;

  constructor(
    public readonly vector: HansenVector,
    public readonly interactionRadiusR0 = 8.0 // Радиус сферы растворимости
  ) {
    Object.freeze(this);
  }
}
