import { IChemicalAspect } from './chemical-aspect.interface';

/**
 * Аспект липофильных свойств (для масел, эмолентов, восков).
 * Хранит эквивалентное алкановое число углерода (EACN) для теории HLD и требуемый HLB.
 */
export class LipophilicAspect implements IChemicalAspect {
  public static readonly TYPE = 'LipophilicAspect';
  public readonly aspectType = LipophilicAspect.TYPE;

  constructor(
    public readonly eacn = 10.0,
    public readonly requiredHlb = 7.0
  ) {
    Object.freeze(this);
  }
}
