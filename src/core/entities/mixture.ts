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
        if (molesValue <= 0) return;

        const existing = this.components.find(c => c.entity === entity);
        if (existing) {
            existing.moles += molesValue;
        } else {
            this.components.push({ entity, moles: molesValue });
        }
    }

    getMass(): number {
        const totalMoles = this.getTotalMoles();
        if (totalMoles <= 0) return 0;

        // Средняя молярная масса смеси
        return this.components.reduce((sum, c) => {
            const moleFraction = c.moles / totalMoles;
            return sum + (c.entity.getMass() * moleFraction);
        }, 0);
    }

    getDensity(temperatureCelsius?: number): number {
        const totalMoles = this.getTotalMoles();
        if (totalMoles <= 0) return 1.0;

        let totalMass = 0;
        let totalVolume = 0;

        for (const c of this.components) {
            const moleFraction = c.moles / totalMoles;
            const mass = moleFraction * c.entity.getMass();
            const rawDensity = c.entity.getDensity(temperatureCelsius);
            const safeDensity = rawDensity > 0 ? rawDensity : 1.0;

            totalMass += mass;
            totalVolume += mass / safeDensity;
        }

        return totalVolume <= 0 ? 1.0 : totalMass / totalVolume;
    }

    getVaporPressure(temperatureCelsius: number): number {
        const totalMoles = this.getTotalMoles();
        if (totalMoles <= 0) return 0;

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
        if (this.components.length === 0) return -273.15;

        const totalMass = this.getTotalMassGrams();
        if (totalMass <= 0) return -273.15;

        const dominant = this.findDominantComponent();
        const isAqueousMatrix = this.isSolventWater(dominant);

        // Если основная фаза — жидкий/водный раствор, растворенные соли и ионные полимеры
        // не замораживают раствор до температуры плавления кристаллической соли (801°C),
        // а понижают точку замерзания (криоскопия).
        if (isAqueousMatrix) {
            return this.calculateAqueousFreezingPoint(dominant, totalMass);
        }

        // Для неводных/жировых фаз кристаллизацию определяют структурообразующие
        // нейтральные компоненты (воски, баттеры, жирные спирты) с долей >= 5% масс.
        return this.calculateStructuringMeltingPoint(dominant, totalMass);
    }

    private getTotalMassGrams(): number {
        return this.components.reduce((sum, c) => sum + c.moles * c.entity.getMass(), 0);
    }

    private findDominantComponent(): MixtureComponent {
        let dominant = this.components[0];
        let maxMass = -1;
        for (const c of this.components) {
            const mass = c.moles * c.entity.getMass();
            if (mass > maxMass) {
                maxMass = mass;
                dominant = c;
            }
        }
        return dominant;
    }

    private isSolventWater(component: MixtureComponent): boolean {
        const name = component.entity.getName().toLowerCase();
        return name.includes('water') || name.includes('вода') || name.includes('aqua');
    }

    private calculateAqueousFreezingPoint(solvent: MixtureComponent, totalMass: number): number {
        const baseTm = solvent.entity.getMeltingPoint();
        let saltMoles = 0;
        let maxNeutralStructuringTm = baseTm;

        for (const c of this.components) {
            const massFraction = (c.moles * c.entity.getMass()) / totalMass;
            if (c.entity.getElectrolyteType() !== 'neutral' || c.entity.getIonicCharge() !== 0) {
                saltMoles += c.moles;
            } else if (massFraction >= 0.05) {
                maxNeutralStructuringTm = Math.max(maxNeutralStructuringTm, c.entity.getMeltingPoint());
            }
        }

        const waterMassKg = Math.max(1e-6, (solvent.moles * solvent.entity.getMass()) / 1000);
        const cryoscopicDrop = Math.min(21.0, 1.86 * (saltMoles * 2) / waterMassKg);
        return Math.max(maxNeutralStructuringTm, baseTm) === baseTm ? baseTm - cryoscopicDrop : maxNeutralStructuringTm;
    }

    private calculateStructuringMeltingPoint(dominant: MixtureComponent, totalMass: number): number {
        let maxTm = dominant.entity.getMeltingPoint();
        for (const c of this.components) {
            const massFraction = (c.moles * c.entity.getMass()) / totalMass;
            const isDissolvedElectrolyte = c.entity.getElectrolyteType() !== 'neutral' || c.entity.getIonicCharge() !== 0;
            if (!isDissolvedElectrolyte && massFraction >= 0.05) {
                maxTm = Math.max(maxTm, c.entity.getMeltingPoint());
            }
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
