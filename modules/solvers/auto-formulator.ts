import { IOil, ISurfactant } from '@domain/entities/surfactant.interface';
import { Mixture, MixtureComponent } from '@domain/entities/mixture';
import { EmulsionSolver } from './emulsion-solver';
import { PureSubstance } from '@domain/entities/pure-substance';
import { Mass, Moles } from '@root-modules/units/quantities';
import { Phase } from '@domain/entities/phase';
import { PhaseBoundary } from '@domain/entities/phase-boundary';
import { MultiphaseSystem } from '@domain/entities/multiphase-system';
import { DetergencySolver } from './detergency-solver';
import { DryingSolver } from './drying-solver';
import { FormulationReport, IFormulationTargets, IOptimizationCriteria } from './auto-formulator.types';

export type { FormulationReport, IFormulationTargets, IOptimizationCriteria };

/**
 * Результат перебора одной пары ПАВ с оценкой солверами.
 */
interface CandidateScore extends FormulationReport {
    totalScore: number;
}

export class AutoFormulator {
    /**
     * Умная оптимизация рецептуры на основе множества критериев.
     * Если переданы targets — каждый кандидат оценивается DetergencySolver
     * и DryingSolver, а нарушения целей добавляют штраф к итоговому score.
     */
    static optimizeEmulsion(
        oilPhase: IOil,
        oilMass: Mass,
        waterPhase: PureSubstance,
        waterMass: Mass,
        availableSurfactants: ISurfactant[],
        totalSurfactantMass: Mass = new Mass(5, 'g'),
        targets?: IFormulationTargets,
        temperatureCelsius = 25
    ): FormulationReport {
        const criteria: IOptimizationCriteria = {
            targetHLB: oilPhase.requiredHlb,
            weights: { price: 0.5, irritation: 0.5 }
        };

        // 1. Фильтрация
        let candidates = availableSurfactants;
        if (criteria.requireEco) {
            candidates = candidates.filter(s => s.isEcoCertified);
        }

        const { lowHLB, highHLB } = this.splitByHlb(candidates, criteria.targetHLB);

        // 2. Перебор всех возможных пар и скоринг
        const options: CandidateScore[] = [];

        for (const sA of lowHLB) {
            for (const sB of highHLB) {
                const candidate = this.evaluateCandidate(
                    sA, sB, criteria, oilPhase, oilMass, waterPhase, waterMass,
                    totalSurfactantMass, targets, temperatureCelsius
                );
                if (candidate) options.push(candidate);
            }
        }

        if (options.length === 0) {
            throw new Error('Не найдено подходящих вариантов рецептуры');
        }

        // 3. Выбор лучшего по взвешенному Score
        return options.sort((a, b) => a.totalScore - b.totalScore)[0] as FormulationReport;
    }

    private static splitByHlb(surfactants: ISurfactant[], targetHLB: number): { lowHLB: ISurfactant[]; highHLB: ISurfactant[] } {
        const lowHLB = surfactants.filter(s => s.hlb < targetHLB);
        const highHLB = surfactants.filter(s => s.hlb >= targetHLB);
        if (lowHLB.length === 0 || highHLB.length === 0) {
            throw new Error('Невозможно подобрать оптимальную пару ПАВ');
        }
        return { lowHLB, highHLB };
    }

    private static evaluateCandidate(
        sA: ISurfactant, sB: ISurfactant, criteria: IOptimizationCriteria,
        oilPhase: IOil, oilMass: Mass, waterPhase: PureSubstance, waterMass: Mass,
        totalSurfactantMass: Mass, targets: IFormulationTargets | undefined, temperatureCelsius: number
    ): CandidateScore | null {
        try {
            const blend = EmulsionSolver.calculateSurfactantBlend(sA, sB, criteria.targetHLB);

            const mixture = new Mixture();
            mixture.addComponent(waterPhase, waterMass);
            mixture.addComponent(oilPhase, oilMass);

            const massA = blend.surfactantAAmount * totalSurfactantMass.to('g');
            const massB = blend.surfactantBAmount * totalSurfactantMass.to('g');

            mixture.addComponent(sA, new Mass(massA, 'g'));
            mixture.addComponent(sB, new Mass(massB, 'g'));

            const totalCost = (massA / 1000 * sA.pricePerKg) + (massB / 1000 * sB.pricePerKg);
            const avgIrritation = (blend.surfactantAAmount * sA.irritationIndex) + (blend.surfactantBAmount * sB.irritationIndex);

            const report: FormulationReport = {
                mixture,
                totalCost,
                averageIrritation: avgIrritation,
                isEco: sA.isEcoCertified && sB.isEcoCertified,
                surfactantsUsed: [
                    { name: sA.name, amount: massA },
                    { name: sB.name, amount: massB }
                ]
            };

            // Оценка солверами, если заданы целевые показатели
            const penalty = this.evaluateTargets(report, mixture, targets, temperatureCelsius);

            const totalScore =
                totalCost * criteria.weights.price +
                avgIrritation * criteria.weights.irritation +
                penalty;

            return { ...report, totalScore } as CandidateScore;
        } catch {
            return null;
        }
    }

    private static evaluateTargets(
        report: FormulationReport, mixture: Mixture,
        targets: IFormulationTargets | undefined, temperatureCelsius: number
    ): number {
        if (!targets) return 0;

        const wantsDetergency = targets.minDetergencyScore !== undefined;
        const wantsDrying = targets.maxTouchDryTimeMin !== undefined ||
            targets.maxFullDryTimeMin !== undefined;

        if (!wantsDetergency && !wantsDrying) return 0;

        const system = this.buildEvaluationSystem(mixture, temperatureCelsius);
        let penalty = 0;

        if (wantsDetergency) {
            penalty += this.scoreDetergency(report, system, targets.minDetergencyScore!);
        }

        if (wantsDrying) {
            penalty += this.scoreDrying(report, system, targets, temperatureCelsius);
        }

        return penalty;
    }

    private static scoreDetergency(report: FormulationReport, system: MultiphaseSystem, minScore: number): number {
        const det = DetergencySolver.evaluate(system);
        report.detergencyScore = det.score;
        if (det.score < minScore) {
            return (minScore - det.score) / 100;
        }
        return 0;
    }

    private static scoreDrying(report: FormulationReport, system: MultiphaseSystem, targets: IFormulationTargets, temperatureCelsius: number): number {
        const dry = DryingSolver.evaluate(system, temperatureCelsius);
        report.touchDryTimeMin = dry.touchDryTimeMin;
        report.fullDryTimeMin = dry.fullDryTimeMin;
        report.dryingMechanism = dry.mechanism;

        let penalty = 0;
        if (targets.maxTouchDryTimeMin !== undefined &&
            dry.touchDryTimeMin > targets.maxTouchDryTimeMin) {
            penalty += (dry.touchDryTimeMin - targets.maxTouchDryTimeMin) / Math.max(targets.maxTouchDryTimeMin, 1);
        }
        if (targets.maxFullDryTimeMin !== undefined &&
            dry.fullDryTimeMin > targets.maxFullDryTimeMin) {
            penalty += (dry.fullDryTimeMin - targets.maxFullDryTimeMin) / Math.max(targets.maxFullDryTimeMin, 1);
        }
        return penalty;
    }

    /**
     * Строит MultiphaseSystem из итоговой Mixture для оценки солверами.
     * Компоненты классифицируются: масло (IOil) → масляная фаза,
     * ПАВ (hlb) → граница фаз (или водная фаза при одной фазе),
     * остальное → водная фаза.
     */
    private static buildEvaluationSystem(mixture: Mixture, temperatureCelsius: number): MultiphaseSystem {
        const { aqueous, oil, surfactantComponents } = this.classifyComponents(mixture);

        const massOf = (mix: Mixture): number =>
            mix.getComponents().reduce((sum, c) => sum + c.moles * c.entity.getMass(), 0);

        const phases: Phase[] = [];
        const boundaries: PhaseBoundary[] = [];
        const aqMass = massOf(aqueous);
        const oilMassVal = massOf(oil);

        if (aqMass > 0) phases.push(new Phase(aqueous, new Mass(aqMass, 'g'), temperatureCelsius));
        if (oilMassVal > 0) phases.push(new Phase(oil, new Mass(oilMassVal, 'g'), temperatureCelsius));

        if (phases.length === 0) {
            this.addAllComponentsPhase(mixture, phases, temperatureCelsius);
        } else if (phases.length === 1) {
            this.addSurfactantsToPhase(phases[0], surfactantComponents);
        } else {
            this.addSurfactantsToBoundary(phases, surfactantComponents, boundaries);
        }

        return new MultiphaseSystem(phases, boundaries);
    }

    private static classifyComponents(mixture: Mixture): {
        aqueous: Mixture;
        oil: Mixture;
        surfactantComponents: { entity: ISurfactant; moles: number }[];
    } {
        const aqueous = new Mixture();
        const oil = new Mixture();
        const surfactantComponents: { entity: ISurfactant; moles: number }[] = [];

        const components: MixtureComponent[] = mixture.getComponents();
        for (const c of components) {
            const entity = c.entity;
            const mass = new Mass(c.moles * entity.getMass(), 'g');
            if ('hlb' in entity && typeof entity.hlb === 'number') {
                surfactantComponents.push({ entity: entity as unknown as ISurfactant, moles: c.moles });
            } else if ('requiredHlb' in entity || entity.getName().toLowerCase().includes('oil')) {
                oil.addComponent(entity, mass);
            } else {
                aqueous.addComponent(entity, mass);
            }
        }

        return { aqueous, oil, surfactantComponents };
    }

    private static addAllComponentsPhase(mixture: Mixture, phases: Phase[], temperatureCelsius: number): void {
        const all = new Mixture();
        for (const c of mixture.getComponents()) {
            all.addComponent(c.entity, new Mass(c.moles * c.entity.getMass(), 'g'));
        }
        const total = all.getComponents().reduce((sum, c) => sum + c.moles * c.entity.getMass(), 0);
        if (total > 0) phases.push(new Phase(all, new Mass(total, 'g'), temperatureCelsius));
    }

    private static addSurfactantsToPhase(phase: Phase, surfactantComponents: { entity: ISurfactant; moles: number }[]): void {
        let extra = 0;
        for (const s of surfactantComponents) {
            const mass = s.moles * s.entity.getMass();
            if (mass > 0) {
                phase.composition.addComponent(s.entity, new Mass(mass, 'g'));
                extra += mass;
            }
        }
        if (extra > 0) {
            (phase as { totalMass: Mass }).totalMass = new Mass(phase.totalMass.to('g') + extra, 'g');
        }
    }

    private static addSurfactantsToBoundary(phases: Phase[], surfactantComponents: { entity: ISurfactant; moles: number }[], boundaries: PhaseBoundary[]): void {
        const boundary = new PhaseBoundary(phases[0], phases[1], 50);
        for (const s of surfactantComponents) {
            boundary.addSurfactant(s.entity, new Moles(s.moles, 'mol'));
        }
        boundaries.push(boundary);
    }

    /**
     * Упрощенный метод (совместимость)
     */
    static createStableEmulsion(
        oilPhase: IOil,
        oilAmount: number,
        waterPhase: PureSubstance,
        waterAmount: number,
        availableSurfactants: ISurfactant[],
        totalSurfactantAmount = 5.0
    ): Mixture {
        const report = this.optimizeEmulsion(
            oilPhase, new Mass(oilAmount, 'g'),
            waterPhase, new Mass(waterAmount, 'g'),
            availableSurfactants, new Mass(totalSurfactantAmount, 'g')
        );
        return report.mixture;
    }
}
