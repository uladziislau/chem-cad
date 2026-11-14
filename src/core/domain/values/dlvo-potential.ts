/**
 * Неизменяемый объект-значение (Value Object) энергетического профиля стабильности по теории DLVO.
 * Описывает баланс сил притяжения Ван-дер-Ваальса и электростатического отталкивания ДЭС.
 */
export class DLVOPotential {
  constructor(
    public readonly debyeLengthNm: number,         // Толщина двойного электрического слоя (дебаевская длина экранирования κ^-1)
    public readonly surfacePotentialMv: number,     // Эффективный потенциал поверхности капли (близок к дзета-потенциалу ζ)
    public readonly energyBarrierKbT: number,       // Высота потенциального барьера отталкивания в единицах k_B*T
    public readonly primaryMinimumDistanceNm = 0.4  // Расстояние коалесценции (первичный минимум)
  ) {
    Object.freeze(this);
  }

  /**
   * Является ли коллоидная система агрегативно устойчивой к коалесценции (слипанию капель)
   * По критерию Дерягина-Ландау: барьер V_max должен превышать 20-25 k_B*T, чтобы тепловое броуновское
   * движение не могло преодолеть отталкивание.
   */
  public get isAggregativelyStable(): boolean {
    return this.energyBarrierKbT >= 20.0;
  }

  /**
   * Степень электростатической защиты эмульсии
   */
  public get stabilityGrade(): 'metastable' | 'stable' | 'rapid_coalescence' {
    if (this.energyBarrierKbT >= 25.0) return 'stable';
    if (this.energyBarrierKbT >= 10.0) return 'metastable';
    return 'rapid_coalescence';
  }
}
