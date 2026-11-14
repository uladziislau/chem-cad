import { IChemicalAspect } from './chemical-aspect.interface';

/**
 * Аспект летучести и давления насыщенного пара (уравнение Антуана).
 */
export class VolatilityAspect implements IChemicalAspect {
  public static readonly TYPE = 'VolatilityAspect';
  public readonly aspectType = VolatilityAspect.TYPE;

  constructor(
    public readonly antoineA: number,
    public readonly antoineB: number,
    public readonly antoineC: number,
    public readonly boilingPointCelsius: number,
    public readonly heatOfVaporizationKJPerMol = 40.7
  ) {
    Object.freeze(this);
  }

  /**
   * Давление насыщенного пара при температуре T (°C) в мм рт. ст. (mmHg)
   */
  public getVaporPressureMmHg(temperatureCelsius: number): number {
    if (this.antoineA === 0 && this.antoineB === 0) return 0;
    const exponent = this.antoineA - this.antoineB / (temperatureCelsius + this.antoineC);
    return Math.pow(10, exponent);
  }
}
