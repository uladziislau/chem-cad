import { IPhaseBoundary } from './phase-boundary.interface';
import { IPhase } from './phase.interface';
import { MixtureComponent } from './mixture';
import { Moles } from '../units/quantities';
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
        // Упрощенная модель снижения натяжения (модель Ленгмюра-Шишковского)
        // γ = γ0 - Σ(Δγ_i)
        // Для прототипа: каждый моль ПАВ на границе снижает натяжение 
        // в зависимости от его эффективности (HLB).
        
        let tensionReduction = 0;
        const totalMoles = this.surfactants.reduce((sum, s) => sum + s.moles, 0);
        
        if (totalMoles === 0) return this.baseTension;

        for (const s of this.surfactants) {
            const surfactant = s.entity as ISurfactant;
            // Коэффициент эффективности: ПАВ с HLB ближе к 10 (сбалансированные) 
            // обычно лучше снижают натяжение на границе масло/вода.
            const efficiency = 1.0 / (1.0 + Math.abs(surfactant.hlb - 10) * 0.1);
            
            // Логарифмическая зависимость от концентрации (примерная)
            tensionReduction += efficiency * Math.log1p(s.moles * 1000) * 10;
        }

        const finalTension = this.baseTension - tensionReduction;
        
        // Натяжение не может быть отрицательным, минимум ~0.1 мН/м для сверхнизких систем
        return Math.max(0.1, finalTension);
    }
}
