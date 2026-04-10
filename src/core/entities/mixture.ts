import { IChemicalEntity } from './chemical-entity.interface';
import { Mass, Moles, PhysicalQuantity } from '../units/quantities';
import { IActivityModel } from '../thermodynamics/activity-model.interface';
import { IdealActivityModel } from '../thermodynamics/ideal-model';
import { HansenParameters } from '../thermodynamics/hansen-parameters';

export interface MixtureComponent {
    entity: IChemicalEntity;
    moles: number; // Внутреннее хранение всегда в молях для точности
}

export class Mixture implements IChemicalEntity {
    private components: MixtureComponent[] = [];
    private activityModel: IActivityModel = new IdealActivityModel();

    setActivityModel(model: IActivityModel): void {
        this.activityModel = model;
    }

    getComponents(): MixtureComponent[] {
        return [...this.components];
    }

    addComponent(entity: IChemicalEntity, amount: PhysicalQuantity): void {
        let molesValue: number;
        if (amount instanceof Moles) {
            molesValue = amount.to('mol');
        } else if (amount instanceof Mass) {
            molesValue = entity.massToMoles(amount).to('mol');
        } else {
            // Если передан Volume, конвертируем в массу через плотность, затем в моли
            const density = entity.getDensity(); // г/мл
            const volumeMl = amount.to('ml');
            const mass = new Mass(volumeMl * density, 'g');
            molesValue = entity.massToMoles(mass).to('mol');
        }
        this.components.push({ entity, moles: molesValue });
    }

    getMass(): number {
        const totalMoles = this.getTotalMoles();
        // Средняя молярная масса смеси
        return this.components.reduce((sum, c) => {
            const moleFraction = c.moles / totalMoles;
            return sum + (c.entity.getMass() * moleFraction);
        }, 0);
    }

    getDensity(temperatureCelsius?: number): number {
        const totalMoles = this.getTotalMoles();
        let totalMass = 0;
        let totalVolume = 0;

        for (const c of this.components) {
            const moleFraction = c.moles / totalMoles;
            const mass = moleFraction * c.entity.getMass();
            const density = c.entity.getDensity(temperatureCelsius);
            
            totalMass += mass;
            totalVolume += mass / density;
        }

        return totalVolume === 0 ? 1.0 : totalMass / totalVolume;
    }

    getVaporPressure(temperatureCelsius: number): number {
        const totalMoles = this.getTotalMoles();
        const componentsData = this.components.map(c => ({
            entity: c.entity,
            moleFraction: c.moles / totalMoles
        }));

        // Получаем коэффициенты активности из модели (неидеальность)
        const gammas = this.activityModel.getActivityCoefficients(componentsData, temperatureCelsius);

        // Закон Рауля с учетом коэффициентов активности: P = sum(P_pure * x * gamma)
        return componentsData.reduce((totalPressure, c) => {
            const gamma = gammas.get(c.entity) || 1.0;
            const partialPressure = c.entity.getVaporPressure(temperatureCelsius) * c.moleFraction * gamma;
            return totalPressure + partialPressure;
        }, 0);
    }

    massToMoles(mass: Mass): Moles {
        const massValue = this.getMass();
        return new Moles(mass.to('g') / (massValue || 1), 'mol');
    }

    molesToMass(moles: Moles): Mass {
        return new Mass(moles.to('mol') * this.getMass(), 'g');
    }

    getSpecificHeatCapacity(temperatureCelsius?: number): number {
        let totalMassGrams = 0;
        
        // Сначала находим общую массу смеси
        for (const c of this.components) {
            totalMassGrams += c.moles * c.entity.getMass();
        }
        
        if (totalMassGrams === 0) return 4.184; // По умолчанию как у воды

        // Теплоемкость смеси = сумма произведений массовых долей на теплоемкости компонентов
        let totalHeatCapacity = 0;
        for (const c of this.components) {
            const massGrams = c.moles * c.entity.getMass();
            const massFraction = massGrams / totalMassGrams;
            totalHeatCapacity += massFraction * c.entity.getSpecificHeatCapacity(temperatureCelsius);
        }

        return totalHeatCapacity;
    }

    getViscosity(temperatureCelsius: number): number {
        const totalMoles = this.getTotalMoles();
        if (this.components.length === 0 || totalMoles === 0) return 1.0;

        // Логарифмическое правило смешивания (Arrhenius mixing rule)
        // ln(eta_mix) = sum(x_i * ln(eta_i))
        let lnEtaSum = 0;
        for (const c of this.components) {
            const moleFraction = c.moles / totalMoles;
            const eta = c.entity.getViscosity(temperatureCelsius);
            lnEtaSum += moleFraction * Math.log(Math.max(0.001, eta));
        }

        return Math.exp(lnEtaSum);
    }

    getMeltingPoint(): number {
        // Упрощение: точка плавления смеси определяется самым тугоплавким компонентом
        // (если воск застыл, вся фаза теряет текучесть)
        if (this.components.length === 0) return -273.15;
        let maxTm = -273.15;
        for (const c of this.components) {
            maxTm = Math.max(maxTm, c.entity.getMeltingPoint());
        }
        return maxTm;
    }

    getPKas(): number[] | undefined {
        // Для смеси pKa не имеет прямого смысла, возвращаем undefined
        return undefined;
    }

    getElectrolyteType(): 'acid' | 'base' | 'salt' | 'neutral' {
        return 'neutral';
    }

    getIonicCharge(): number {
        // Возвращаем 0, так как Mixture сама по себе не является ионом
        return 0;
    }

    getHansenParameters(): HansenParameters | undefined {
        const totalMoles = this.getTotalMoles();
        if (totalMoles === 0 || this.components.length === 0) return undefined;

        let totalVolume = 0;
        const volumes = this.components.map(c => {
            const mass = c.moles * c.entity.getMass();
            const vol = mass / c.entity.getDensity();
            totalVolume += vol;
            return { component: c, volume: vol };
        });

        if (totalVolume === 0) return undefined;

        let dD = 0, dP = 0, dH = 0;
        let hasHansen = false;

        for (const item of volumes) {
            const h = item.component.entity.getHansenParameters();
            if (h) {
                hasHansen = true;
                const volFraction = item.volume / totalVolume;
                dD += h.dD * volFraction;
                dP += h.dP * volFraction;
                dH += h.dH * volFraction;
            }
        }

        return hasHansen ? new HansenParameters(dD, dP, dH) : undefined;
    }

    getSolubilityWater(temperatureCelsius: number, ionicStrength: number): number {
        if (this.components.length === 0) return 1000;
        return Math.min(...this.components.map(c => c.entity.getSolubilityWater(temperatureCelsius, ionicStrength)));
    }

    getName(): string {
        return 'Mixture';
    }

    private getTotalMoles(): number {
        return this.components.reduce((acc, c) => acc + c.moles, 0);
    }
}
