import { IMultiphaseSystem } from '../entities/multiphase-system.interface';
import { PhaseTopologyHelper } from './phase-topology.helper';

export interface ISolubilityIssue {
    entityName: string;
    excessMass: number;
    limit: number;
}

/**
 * Решатель для проверки пределов растворимости компонентов.
 */
export class SolubilitySolver {
    /**
     * Проверяет все компоненты водной фазы на перенасыщение.
     * @returns Список компонентов, превысивших предел растворимости.
     */
    static checkSaturation(system: IMultiphaseSystem, ionicStrength: number): ISolubilityIssue[] {
        const issues: ISolubilityIssue[] = [];
        const waterPhase = PhaseTopologyHelper.findAqueousPhase(system);
        if (!waterPhase) return issues;

        const temp = waterPhase.temperatureCelsius;
        const volMl = waterPhase.getVolume().to('ml');

        if (volMl <= 0) return issues;

        const components = waterPhase.composition.getComponents();

        for (const comp of components) {
            const entity = comp.entity;
            const solubilityLimit = entity.getSolubilityWater(temp, ionicStrength); // г/100мл
            
            if (solubilityLimit >= 1000) continue; // Условно неограниченная растворимость

            const currentMass = comp.moles * entity.getMass();
            const maxMass = (solubilityLimit / 100) * volMl;

            if (currentMass > maxMass + 0.0001) { // Допуск на точность
                issues.push({
                    entityName: entity.getName(),
                    excessMass: currentMass - maxMass,
                    limit: solubilityLimit
                });
            }
        }

        return issues;
    }
}
