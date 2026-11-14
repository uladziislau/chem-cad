import { IChemicalAspect } from './chemical-aspect.interface';

export type PolymerCrosslinkType = 'physical_entanglement' | 'chemical_covalent' | 'associative_hydrophobic';

/**
 * Аспект полимерных сеток и структурообразования (Polymeric Network Aspect).
 * Моделирует переход "компактный клубок -> трехмерная гелевая сетка" в зависимости от ионизации и экранирования.
 */
export class PolymericNetworkAspect implements IChemicalAspect {
  public static readonly TYPE = 'PolymericNetworkAspect';
  public readonly aspectType = PolymericNetworkAspect.TYPE;

  constructor(
    public readonly pKaOfPolyacid: number,          // pKa функциональных кислотных групп (например 4.5-5.0 для полиакриловой кислоты)
    public readonly intrinsicViscosityBaseDlPerG: number, // Базовая характеристическая вязкость компактного клубка [η]0
    public readonly maxExpansionRatio = 40.0,       // Максимальный коэффициент увеличения гидродинамического объема при нейтрализации
    public readonly criticalSaltMolarity = 0.05,    // Критическая ионная сила, при которой происходит экранирование и схлопывание геля
    public readonly crosslinkType: PolymerCrosslinkType = 'physical_entanglement'
  ) {
    Object.freeze(this);
  }

  /**
   * Вычисляет фактор разворачивания полимерной цепи α_coil ∈ [0, 1] при текущем pH и ионной силе I (M).
   */
  public calculateChainExpansionFactor(ph: number, ionicStrengthM: number): number {
    // 1. Степень ионизации кислотных групп: α_ion = 10^(pH - pKa) / (1 + 10^(pH - pKa))
    const delta = ph - this.pKaOfPolyacid;
    const ratio = Math.pow(10, Math.max(-5, Math.min(5, delta)));
    const ionizationDegree = ratio / (1 + ratio);

    // 2. Фактор экранирования зарядов электролитами по теории полиэлектролитов де Гене
    // Высокая ионная сила сжимает двойной слой вокруг полимерной нити
    const screeningFactor = 1.0 / (1.0 + Math.sqrt(Math.max(0, ionicStrengthM) / this.criticalSaltMolarity));

    // Итоговое набухание/разворачивание
    return Math.max(0.02, ionizationDegree * screeningFactor);
  }
}
