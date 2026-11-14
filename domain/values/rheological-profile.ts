/**
 * Неизменяемый объект-значение (Value Object) реологического профиля жидкости/геля.
 * Описывает неньютоновское поведение по уравнению Гершеля-Балкли:
 * τ = τ0 + K * γ̇^n
 * η_app(γ̇) = τ / γ̇ = τ0 / γ̇ + K * γ̇^(n - 1)
 */
export class RheologicalProfile {
  constructor(
    public readonly yieldStressPa: number,        // Предел текучести τ0 (Па). Если > 0 — вещество держит форму в покое
    public readonly consistencyIndexK: number,     // Индекс консистенции K (Па·с^n)
    public readonly flowBehaviorIndexN: number,    // Индекс поведения течения n: n < 1 (псевдопластик/разжижение), n = 1 (ньютоновская), n > 1 (дилатант)
    public readonly restingViscosityCp = 0         // Вязкость в состоянии предельного покоя
  ) {
    Object.freeze(this);
  }

  /**
   * Рассчитывает кажущуюся динамическую вязкость (cP) при заданной скорости сдвига γ̇ (с^-1).
   * 1 Па·с = 1000 сП (сантипуаз).
   */
  public getApparentViscosityCp(shearRateSMinus1: number): number {
    const shearRate = Math.max(1e-4, shearRateSMinus1);

    // τ = τ0 + K * (γ̇^n)  [Па]
    const shearStressPa = this.yieldStressPa + this.consistencyIndexK * Math.pow(shearRate, this.flowBehaviorIndexN);

    // η = τ / γ̇  [Па·с] -> [сП]
    const viscosityPaS = shearStressPa / shearRate;
    return viscosityPaS * 1000.0;
  }

  /**
   * Является ли жидкость псевдопластичной со сдвиговым разжижением (Shear-Thinning)
   */
  public get isShearThinning(): boolean {
    return this.flowBehaviorIndexN < 0.95;
  }

  /**
   * Обладает ли система пластичностью (держит ли каплю/горку без растекания под силой тяжести)
   */
  public get hasYieldStress(): boolean {
    return this.yieldStressPa > 0.5;
  }
}
