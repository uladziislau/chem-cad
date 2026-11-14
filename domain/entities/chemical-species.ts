import { IChemicalAspect } from '../aspects/chemical-aspect.interface';

/**
 * Доменная сущность химического вида (Chemical Species).
 * Представляет индивидуальное химическое соединение с набором аспектов.
 */
export class ChemicalSpecies {
  private readonly aspects = new Map<string, IChemicalAspect>();

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly inciName: string,
    public readonly molarMassGPerMol: number,
    public readonly densityGPerMl: number,
    public readonly casNumber?: string,
    initialAspects: IChemicalAspect[] = []
  ) {
    if (molarMassGPerMol <= 0) throw new Error('Молярная масса должна быть строго положительной');
    if (densityGPerMl <= 0) throw new Error('Плотность должна быть строго положительной');

    for (const aspect of initialAspects) {
      this.aspects.set(aspect.aspectType, aspect);
    }
  }

  public withAspect(aspect: IChemicalAspect): this {
    this.aspects.set(aspect.aspectType, aspect);
    return this;
  }

  public getAspect<T extends IChemicalAspect>(aspectType: string): T | null {
    return (this.aspects.get(aspectType) as T) ?? null;
  }

  public hasAspect(aspectType: string): boolean {
    return this.aspects.has(aspectType);
  }

  public getAllAspectTypes(): string[] {
    return Array.from(this.aspects.keys());
  }

  /**
   * Конвертирует массу в граммах в количество молей
   */
  public massGramsToMoles(massGrams: number): number {
    return massGrams / this.molarMassGPerMol;
  }

  /**
   * Конвертирует моли в массу в граммах
   */
  public molesToMassGrams(moles: number): number {
    return moles * this.molarMassGPerMol;
  }

  /**
   * Конвертирует массу в граммах в объем в мл через плотность
   */
  public massGramsToVolumeMl(massGrams: number): number {
    return massGrams / this.densityGPerMl;
  }
}
