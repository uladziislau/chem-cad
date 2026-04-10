export class MolecularDynamicsEngine {
  /**
   * Рассчитывает потенциал Леннард-Джонса (Ван-дер-Ваальсовы силы) между двумя не связанными атомами.
   * V(r) = 4 * epsilon * [ (sigma/r)^12 - (sigma/r)^6 ]
   * Это основа фолдинга белков и агрегатных состояний веществ.
   * 
   * @param r Расстояние между атомами
   * @param epsilon Глубина потенциальной ямы (сила притяжения)
   * @param sigma Расстояние, на котором потенциал равен нулю
   */
  static calculateLennardJonesPotential(r: number, epsilon = 0.1, sigma = 3.0): number {
    if (r === 0) return Infinity; // Защита от сингулярности

    const sr = sigma / r;
    const sr6 = Math.pow(sr, 6);
    const sr12 = Math.pow(sr, 12);

    // (sr12) - отталкивание на близких расстояниях (электронные оболочки перекрываются)
    // (sr6) - притяжение на дальних расстояниях (дисперсионные силы)
    return 4 * epsilon * (sr12 - sr6);
  }

  /**
   * Рассчитывает силу взаимодействия (производная потенциала по расстоянию F = -dV/dr).
   * Положительная сила = отталкивание, Отрицательная = притяжение.
   */
  static calculateLennardJonesForce(r: number, epsilon = 0.1, sigma = 3.0): number {
    if (r === 0) return 0;

    const sr = sigma / r;
    const sr6 = Math.pow(sr, 6);
    const sr12 = Math.pow(sr, 12);

    return (24 * epsilon / r) * (2 * sr12 - sr6);
  }
}
