import { IMultiphaseSystem } from './multiphase-system.interface';
import { IPhase } from './phase.interface';
import { IPhaseBoundary } from './phase-boundary.interface';
import { Mixture } from './mixture';
import { Moles, Mass } from '../units/quantities';

export class MultiphaseSystem implements IMultiphaseSystem {
    private dropletSize = 10.0; // мкм по умолчанию
    private emulsionType: 'O/W' | 'W/O' | 'Multiple' | 'Unknown' = 'Unknown';

    constructor(
        public readonly phases: IPhase[],
        public readonly boundaries: IPhaseBoundary[]
    ) {}

    getTotalMass(): Mass {
        let totalGrams = 0;
        for (const phase of this.phases) {
            totalGrams += phase.totalMass.to('g');
        }
        return new Mass(totalGrams, 'g');
    }

    getEmulsionType(): 'O/W' | 'W/O' | 'Multiple' | 'Unknown' {
        return this.emulsionType;
    }

    setEmulsionType(type: 'O/W' | 'W/O' | 'Multiple' | 'Unknown'): void {
        this.emulsionType = type;
    }

    getDropletSize(): number {
        return this.dropletSize;
    }

    setDropletSize(sizeMicrons: number): void {
        this.dropletSize = Math.max(0.1, sizeMicrons);
    }

    getGlobalComposition(): Mixture {
        const globalMix = new Mixture();
        for (const phase of this.phases) {
            const phaseMix = phase.composition;
            for (const comp of phaseMix.getComponents()) {
                globalMix.addComponent(comp.entity, new Moles(comp.moles, 'mol'));
            }
        }
        return globalMix;
    }

    getStabilityIndex(): number {
        if (this.phases.length < 2 || this.boundaries.length === 0) return 1.0;

        // Упрощенная модель стабильности (на основе закона Стокса и IFT)
        // v = 2/9 * r^2 * g * (rho_p - rho_f) / eta
        
        const boundary = this.boundaries[0];
        const ift = boundary.getInterfacialTension();
        
        // Чем ниже IFT, тем стабильнее эмульсия (обычно)
        const iftFactor = Math.max(0.1, 1.0 - ift / 100);
        
        // Чем меньше капли, тем стабильнее
        const sizeFactor = Math.max(0.1, 1.0 - this.dropletSize / 100);
        
        // Индекс стабильности как комбинация факторов
        return (iftFactor * 0.6 + sizeFactor * 0.4);
    }

    simulateAging(hours: number): void {
        // Со временем капли растут (коалесценция/оствальдовское созревание)
        // Скорость роста зависит от стабильности
        const stability = this.getStabilityIndex();
        const growthRate = (1.0 - stability) * 2.0; // мкм в час
        
        this.dropletSize += growthRate * hours;
    }
}
