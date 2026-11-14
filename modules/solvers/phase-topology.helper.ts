import { IPhase } from '@domain/entities/phase.interface';
import { IMultiphaseSystem } from '@domain/entities/multiphase-system.interface';

export interface EmulsionPhaseRoles {
  readonly continuousPhase: IPhase;
  readonly dispersedPhase: IPhase;
}

const POLAR_KEYWORDS = ['water', 'вода', 'aqua', 'glycerin', 'глицерин', 'ethanol', 'этанол', 'isopropanol'];

/**
 * Семантический помощник для определения полярности и ролей фаз
 * без жесткой привязки к позиционным индексам [0] и [1].
 */
export class PhaseTopologyHelper {
  /**
   * Определяет, является ли фаза водной/полярной на основе её состава и параметров Хансена.
   */
  public static isAqueousPhase(phase: IPhase): boolean {
    const components = phase.composition.getComponents();
    if (components.length === 0) return false;

    for (const comp of components) {
      const nameLower = comp.entity.getName().toLowerCase();
      if (POLAR_KEYWORDS.some(keyword => nameLower.includes(keyword))) {
        return true;
      }
      if (comp.entity.getElectrolyteType() !== 'neutral') {
        return true;
      }
    }

    const hansen = phase.composition.getHansenParameters();
    if (hansen && (hansen.dP + hansen.dH) > 18) {
      return true;
    }

    return false;
  }

  /**
   * Находит водную/полярную фазу в многофазной системе (или null, если система полностью безводная).
   */
  public static findAqueousPhase(system: IMultiphaseSystem): IPhase | null {
    return system.phases.find(phase => this.isAqueousPhase(phase)) ?? null;
  }

  /**
   * Находит масляную/неполярную фазу в многофазной системе.
   */
  public static findOilPhase(system: IMultiphaseSystem): IPhase | null {
    return system.phases.find(phase => !this.isAqueousPhase(phase)) ?? null;
  }

  /**
   * Определяет сплошную (непрерывную) и дисперсную фазы эмульсии с учетом типа O/W или W/O.
   */
  public static resolveEmulsionRoles(system: IMultiphaseSystem): EmulsionPhaseRoles | null {
    if (system.phases.length < 2) return null;

    const aqueous = this.findAqueousPhase(system) ?? system.phases[0];
    const oil = system.phases.find(p => p !== aqueous) ?? system.phases[1];
    const emulsionType = system.getEmulsionType();

    if (emulsionType === 'W/O') {
      return { continuousPhase: oil, dispersedPhase: aqueous };
    }

    return { continuousPhase: aqueous, dispersedPhase: oil };
  }
}
