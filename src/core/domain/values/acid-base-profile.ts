/**
 * Профиль кислотно-основных свойств (Acid-Base Profile).
 * Описывает многоступенчатую связанную диссоциацию полипротонных кислот и оснований
 * через точное полиномиальное распределение ионных форм (α_k).
 */
export class AcidBaseProfile {
  public readonly pKaValues: readonly number[];

  constructor(
    pKa: number[],
    public readonly isBase = false
  ) {
    // Сортируем pKa по возрастанию (для кислот pKa1 < pKa2 < pKa3)
    this.pKaValues = Object.freeze([...pKa].sort((a, b) => a - b));
    Object.freeze(this);
  }

  /**
   * Степень диссоциации по выбранной ступени (для оценки отдельного перехода)
   */
  public getDegreeOfDissociation(ph: number, stepIndex = 0): number {
    const pKa = this.pKaValues[stepIndex];
    if (pKa === undefined) return 0;

    const delta = ph - pKa;
    if (delta > 6) return 1;
    if (delta < -6) return 0;

    const ratio = Math.pow(10, delta);
    return ratio / (1 + ratio);
  }

  /**
   * Точные мольные доли всех ступеней [α_0, α_1, ..., α_n] для связанного равновесия:
   * - Для кислоты: α_0 — полностью протонированная форма H_nA, α_k — форма H_(n-k)A^(k-).
   * - Для основания (сопряженной кислоты): α_0 — полностью протонированная BH_n^(n+), α_n — свободное B.
   */
  public getSpeciesFractions(ph: number): readonly number[] {
    const n = this.pKaValues.length;
    if (n === 0) return [1];

    // Используем логарифмическое нормирование для полной защиты от переполнения при любых pH и n
    const logTerms: number[] = [-n * ph];
    let maxLog = logTerms[0];

    for (let k = 0; k < n; k++) {
      const nextLog = logTerms[k] + (ph - this.pKaValues[k]);
      logTerms.push(nextLog);
      if (nextLog > maxLog) {
        maxLog = nextLog;
      }
    }

    const scaledWeights = logTerms.map(lt => Math.pow(10, lt - maxLog));
    const denominator = scaledWeights.reduce((sum, w) => sum + w, 0);

    return scaledWeights.map(w => w / denominator);
  }

  /**
   * Чистый средний электрический заряд молекулы при заданном значении pH
   */
  public getNetChargeAtPH(ph: number): number {
    const n = this.pKaValues.length;
    if (n === 0) return 0;

    const fractions = this.getSpeciesFractions(ph);
    let charge = 0;

    if (this.isBase) {
      // Форма k обладает положительным зарядом +(n - k)
      for (let k = 0; k < n; k++) {
        charge += (n - k) * fractions[k];
      }
      return charge;
    }

    // Форма k обладает отрицательным зарядом -k
    for (let k = 1; k <= n; k++) {
      charge -= k * fractions[k];
    }
    return charge;
  }
}
