import { IChemicalAspect } from './chemical-aspect.interface';

export type SurfactantType = 'anionic' | 'cationic' | 'nonionic' | 'amphoteric';

/**
 * Аспект поверхностно-активных свойств (ПАВ): мицеллообразование, HLD кривизна, HLB.
 */
export class SurfaceActiveAspect implements IChemicalAspect {
  public static readonly TYPE = 'SurfaceActiveAspect';
  public readonly aspectType = SurfaceActiveAspect.TYPE;

  constructor(
    public readonly surfactantType: SurfactantType,
    public readonly cmcMolesPerLiter: number,       // Критическая концентрация мицеллообразования (CMC)
    public readonly characteristicCurvatureCc: number, // Параметр Cc в теории HLD
    public readonly hlbGriffin: number,             // Гидрофильно-липофильный баланс по Гриффину (0..20)
    public readonly maxSurfaceExcessMolPerM2 = 3.5e-6 // Предельная адсорбция Г_max в уравнении Гиббса
  ) {
    Object.freeze(this);
  }
}
