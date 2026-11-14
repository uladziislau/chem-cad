/**
 * Спектр гранулометрического распределения капель эмульсии (Particle Size Distribution).
 * Вместо одной условной точки моделирует реальный разброс капель по размерам.
 */
export class DropletSpectrum {
  constructor(
    public readonly d10Microns: number, // 10% объема капель меньше этого диаметра
    public readonly d32Microns: number, // Заутеровский средний диаметр (площадь поверхности)
    public readonly d50Microns: number, // Медианный диаметр
    public readonly d90Microns: number  // 90% объема капель меньше этого диаметра
  ) {
    if (d10Microns <= 0 || d32Microns <= 0 || d50Microns <= 0 || d90Microns <= 0) {
      throw new Error('Размеры капель должны быть строго положительными');
    }
    Object.freeze(this);
  }

  public static monoDisperse(diameterMicrons: number): DropletSpectrum {
    const d = Math.max(0.05, diameterMicrons);
    return new DropletSpectrum(d * 0.8, d, d, d * 1.25);
  }

  /**
   * Индекс полидисперсности (Span): Span = (d90 - d10) / d50
   * Чем меньше Span, тем уже распределение капель и стабильнее эмульсия к созреванию Оствальда.
   */
  public get polydispersitySpan(): number {
    return (this.d90Microns - this.d10Microns) / this.d50Microns;
  }

  /**
   * Доля крупных капель (> 20 мкм), склонных к быстрому гравитационному расслоению (Стоксу)
   */
  public get isCoarseEmulsion(): boolean {
    return this.d90Microns > 25.0;
  }
}
