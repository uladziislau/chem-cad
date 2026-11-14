import { IChemicalAspect } from './chemical-aspect.interface';

/**
 * Аспект электрокинетических свойств границы раздела (Electrokinetic Aspect).
 * Описывает двойной электрический слой (ДЭС) капель эмульсии или частиц дисперсии.
 */
export class ElectrokineticAspect implements IChemicalAspect {
  public static readonly TYPE = 'ElectrokineticAspect';
  public readonly aspectType = ElectrokineticAspect.TYPE;

  constructor(
    public readonly standardZetaPotentialMv: number, // Дзета-потенциал при нейтральном pH и низкой солености (мВ)
    public readonly isoelectricPointPh = 3.0,       // Изоэлектрическая точка (pI), при которой дзета-потенциал обращается в ноль
    public readonly surfaceChargeDensityMicroCPerCm2 = -5.0 // Плотность поверхностного заряда (мкКл/см^2)
  ) {
    Object.freeze(this);
  }

  /**
   * Рассчитывает эффективный дзета-потенциал ζ (мВ) при заданном pH и ионной силе I (М).
   * При приближении pH к pI заряд падает до нуля.
   * При росте ионной силы ДЭС сжимается, снижая измеренный потенциал на плоскости скольжения.
   */
  public calculateEffectiveZetaMv(ph: number, ionicStrengthM: number): number {
    // Сдвиг от изоэлектрической точки
    const phFactor = Math.tanh((ph - this.isoelectricPointPh) / 2.0);

    // Сжатие двойного слоя электролитами: ζ ~ 1 / sqrt(I)
    const ionicFactor = 1.0 / Math.sqrt(1.0 + Math.max(0, ionicStrengthM) * 20.0);

    return this.standardZetaPotentialMv * phFactor * ionicFactor;
  }
}
