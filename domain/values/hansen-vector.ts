/**
 * Неизменяемый вектор параметров растворимости Хансена (HSP).
 * Разделяет энергию когезии жидкости на дисперсионную, полярную и водородную составляющие.
 */
export class HansenVector {
  constructor(
    public readonly dispersionD: number, // δD: силы Ван-дер-Ваальса (МПа^0.5)
    public readonly polarP: number,       // δP: дипольные взаимодействия (МПа^0.5)
    public readonly hydrogenH: number     // δH: водородное связывание (МПа^0.5)
  ) {
    Object.freeze(this);
  }

  /**
   * Полный параметр растворимости Гильдебранда: δ_tot = sqrt(δD^2 + δP^2 + δH^2)
   */
  public get totalHildebrand(): number {
    return Math.sqrt(
      this.dispersionD * this.dispersionD +
      this.polarP * this.polarP +
      this.hydrogenH * this.hydrogenH
    );
  }

  /**
   * Расстояние Хансена Ra в сферическом пространстве (коэффициент 4 перед δD эмпирически доказан Хансеном)
   * Ra^2 = 4(δD1 - δD2)^2 + (δP1 - δP2)^2 + (δH1 - δH2)^2
   */
  public distanceTo(other: HansenVector): number {
    const deltaD = this.dispersionD - other.dispersionD;
    const deltaP = this.polarP - other.polarP;
    const deltaH = this.hydrogenH - other.hydrogenH;

    return Math.sqrt(4 * deltaD * deltaD + deltaP * deltaP + deltaH * deltaH);
  }

  /**
   * Относительное энергетическое различие (RED): RED = Ra / R0
   * RED < 1: взаимная растворимость (высокое термодинамическое сродство)
   * RED = 1: граница фазового расслоения
   * RED > 1: несмешиваемость (расслоение фаз)
   */
  public calculateRED(solvent: HansenVector, interactionRadiusR0 = 8.0): number {
    if (interactionRadiusR0 <= 0) return Infinity;
    return this.distanceTo(solvent) / interactionRadiusR0;
  }
}
