import { IChemicalEntity } from './chemical-entity.interface';
import { IMultiphaseSystem } from './multiphase-system.interface';
import { HansenParameters } from '../thermodynamics/hansen-parameters';
import { RawIngredientInput } from '../engine/types';
import { Mass, Moles } from '../units/quantities';

/**
 * Адаптер, позволяющий использовать готовую рецептуру (MultiphaseSystem)
 * как единый ингредиент (IChemicalEntity) в других рецептурах.
 * Реализует паттерн "Композиция композиций" (Nested Formulations).
 */
export class FormulationEntity implements IChemicalEntity {
    constructor(
        private name: string,
        private recipe: RawIngredientInput[],
        private system: IMultiphaseSystem
    ) {}

    getName(): string {
        return this.name;
    }

    getRecipe(): RawIngredientInput[] {
        return this.recipe;
    }

    getSystem(): IMultiphaseSystem {
        return this.system;
    }

    // --- Реализация IChemicalEntity ---
    // Для макроскопической системы эти параметры имеют условный или усредненный характер,
    // так как при симуляции движок будет "распаковывать" рецептуру на базовые компоненты.

    getMass(): number {
        // Условная молярная масса для макро-смеси
        return 1000;
    }

    getDensity(): number {
        const mass = this.system.phases.reduce((sum, p) => sum + p.totalMass.to('g'), 0);
        const vol = this.system.phases.reduce((sum, p) => sum + p.getVolume().to('ml'), 0);
        return vol > 0 ? mass / vol : 1;
    }

    getBoilingPoint(): number {
        // Упрощенно: температура кипения воды, если есть водная фаза
        return 100;
    }
    
    getMeltingPoint(): number {
        return 0;
    }

    getViscosity(): number {
        // Вязкость самой системы (эмульсии)
        return 1000;
    }

    getHansenParameters(): HansenParameters | undefined {
        // Для сложных эмульсий единый параметр Хансена не имеет физического смысла
        return undefined;
    }

    getElectrolyteType(): 'neutral' | 'acid' | 'base' | 'salt' {
        return 'neutral';
    }

    getIonicCharge(): number {
        return 0;
    }
    
    getPKas(): number[] {
        return [];
    }

    getSolubilityWater(_temperatureCelsius: number, _ionicStrength: number): number {
        // Если это прямая эмульсия (М/В) или водный раствор, она смешивается с водой
        const type = this.system.getEmulsionType();
        if (type === 'O/W' || this.system.phases.length === 1) {
            return 1000; // Неограниченно растворима/смешиваема
        }
        return 0; // Обратная эмульсия (В/М) не смешивается с водой
    }

    getVaporPressure(_temperatureCelsius: number): number {
        return 0;
    }

    massToMoles(mass: Mass): Moles {
        return new Moles(mass.to('g') / this.getMass(), 'mol');
    }

    molesToMass(moles: Moles): Mass {
        return new Mass(moles.to('mol') * this.getMass(), 'g');
    }

    getSpecificHeatCapacity(): number {
        return 4.18; // Условно как у воды
    }

    getSurfaceTension(): number {
        return 72; // Условно как у воды
    }
}
