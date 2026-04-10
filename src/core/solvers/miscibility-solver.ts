import { HansenParameters } from '../thermodynamics/hansen-parameters';

export interface IMiscibilityReport {
  isMiscible: boolean;
  redScore: number; // Relative Energy Difference
  distanceRa: number;
  message: string;
}

export class MiscibilitySolver {
  /**
   * Оценивает смешиваемость двух фаз (или компонентов) на основе параметров Хансена.
   * RED (Relative Energy Difference) = Ra / R0
   * RED < 1: Полная смешиваемость
   * RED ~ 1: Частичная смешиваемость / Граница
   * RED > 1: Расслоение (Immiscible)
   */
  public static calculateMiscibility(
    solute: HansenParameters, 
    solvent: HansenParameters, 
    interactionRadiusR0: number = 8.0 // Эмпирический радиус взаимодействия
  ): IMiscibilityReport {
    const ra = solute.distanceTo(solvent);
    const red = ra / interactionRadiusR0;

    const isMiscible = red <= 1.0;
    let message = '';

    if (red < 0.5) message = 'Идеальная смешиваемость (Истинный раствор)';
    else if (red <= 1.0) message = 'Хорошая смешиваемость';
    else if (red <= 1.5) message = 'Частичная смешиваемость (Требуется эмульгатор/со-растворитель)';
    else message = 'Полное расслоение фаз (Несмешивающиеся жидкости)';

    return {
      isMiscible,
      redScore: red,
      distanceRa: ra,
      message
    };
  }
}
