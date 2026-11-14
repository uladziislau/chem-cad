/**
 * Неизменяемый объект-значение (Value Object) концентрации компонента в смеси/растворе.
 * Предотвращает ошибки размерностей и путаницу между молярностью, моляльностью и массовой долей.
 */
export class Concentration {
  private constructor(
    public readonly molarityMolPerL: number,
    public readonly massFractionPercent: number,
    public readonly moleFraction: number
  ) {
    Object.freeze(this);
  }

  public static fromMolesAndVolume(
    moles: number,
    volumeLiters: number,
    totalMassGrams: number,
    soluteMassGrams: number,
    totalMoles: number
  ): Concentration {
    if (volumeLiters <= 0) throw new Error('Объем раствора должен быть строго положительным');
    if (totalMassGrams <= 0) throw new Error('Масса раствора должна быть строго положительной');

    const molarity = moles / volumeLiters;
    const massFraction = (soluteMassGrams / totalMassGrams) * 100;
    const moleFraction = totalMoles > 0 ? moles / totalMoles : 0;

    return new Concentration(molarity, massFraction, moleFraction);
  }

  public static fromMolarity(molarity: number): Concentration {
    return new Concentration(Math.max(0, molarity), 0, 0);
  }

  public static fromMassFraction(percent: number): Concentration {
    const clamped = Math.max(0, Math.min(100, percent));
    return new Concentration(0, clamped, clamped / 100);
  }
}
