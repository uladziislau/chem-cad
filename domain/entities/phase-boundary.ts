import { IPhaseBoundary } from './phase-boundary.interface';
import { IPhase } from './phase.interface';
import { MixtureComponent } from './mixture';
import { Moles } from '@root-modules/units/quantities';
import { ISurfactant } from './surfactant.interface';

export class PhaseBoundary implements IPhaseBoundary {
    public surfactants: MixtureComponent[] = [];

    constructor(
        public readonly phaseA: IPhase,
        public readonly phaseB: IPhase,
        private readonly baseTension = 50.0 // мН/м (типично для вода/масло)
    ) {}

    getBaseTension(): number {
        return this.baseTension;
    }

    addSurfactant(surfactant: ISurfactant, amount: Moles): void {
        const molesValue = amount.to('mol');
        const existing = this.surfactants.find(s => s.entity === surfactant);
        if (existing) {
            existing.moles += molesValue;
        } else {
            this.surfactants.push({ entity: surfactant, moles: molesValue });
        }
    }

    getInterfacialTension(): number {
        // Модель снижения натяжения на основе объемной концентрации (моль/л),
        // что гарантирует масштабную инвариантность при изменении размера партии.
        let tensionReduction = 0;
        const totalMoles = this.surfactants.reduce((sum, s) => sum + s.moles, 0);

        if (totalMoles === 0) return this.baseTension;

        const volL = Math.max(0.001, this.phaseA.getVolume().to('l') + this.phaseB.getVolume().to('l'));

        for (const s of this.surfactants) {
            const surfactant = s.entity as ISurfactant;
            const efficiency = 1.0 / (1.0 + Math.abs(surfactant.hlb - 10) * 0.1);
            const molarity = s.moles / volL;

            tensionReduction += efficiency * Math.log1p(molarity * 200) * 10;
        }

        const finalTension = this.baseTension - tensionReduction;
        return Math.max(0.1, finalTension);
    }
}
