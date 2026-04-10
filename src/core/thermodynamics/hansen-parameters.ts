export class HansenParameters {
  /**
   * Параметры растворимости Хансена (HSP)
   * @param dD Dispersion (Дисперсионные силы Ван-дер-Ваальса)
   * @param dP Polarity (Дипольные силы)
   * @param dH Hydrogen bonding (Водородные связи)
   */
  constructor(
    public readonly dD: number,
    public readonly dP: number,
    public readonly dH: number
  ) {}

  /**
   * Вычисляет "расстояние" (Ra) между двумя молекулами в пространстве Хансена.
   * Формула: Ra^2 = 4(dD1 - dD2)^2 + (dP1 - dP2)^2 + (dH1 - dH2)^2
   * Множитель 4 перед дисперсионным членом эмпирически выведен Чарльзом Хансеном 
   * для преобразования пространства в сферическое.
   */
  public distanceTo(other: HansenParameters): number {
    return Math.sqrt(
      4 * Math.pow(this.dD - other.dD, 2) +
      Math.pow(this.dP - other.dP, 2) +
      Math.pow(this.dH - other.dH, 2)
    );
  }
}
