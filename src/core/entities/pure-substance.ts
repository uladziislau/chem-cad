import { IChemicalEntity } from './chemical-entity.interface';
import { Mass, Moles } from '../units/quantities';
import { HansenParameters } from '../thermodynamics/hansen-parameters';

export type ElectrolyteType = 'acid' | 'base' | 'salt' | 'neutral';

export class PureSubstance implements IChemicalEntity {
    private hansen?: HansenParameters;
    private pKas?: number[];
    private electrolyteType: ElectrolyteType = 'neutral';
    private solubilityWater = 1000; // г/100мл, 1000 = неограниченно
    private saltingOutConstant = 0.1; // Константа Сеченова

    constructor(
        public readonly name: string,
        public readonly molarMass: number,
        // Константы для уравнения Антуана: log10(P) = A - (B / (T + C))
        private readonly antoineA: number,
        private readonly antoineB: number,
        private readonly antoineC: number,
        public readonly density = 1.0, // г/мл
        public readonly meltingPoint = 0, // °C
        private readonly viscosityA = 0.01, // Коэффициент предэкспоненты
        private readonly viscosityB = 1500,  // Энергия активации вязкого течения (K)
        public readonly ionicCharge = 0
    ) {}

    getMass(): number {
        return this.molarMass;
    }

    getMeltingPoint(): number {
        return this.meltingPoint;
    }

    getPKas(): number[] | undefined {
        return this.pKas;
    }

    getElectrolyteType(): ElectrolyteType {
        return this.electrolyteType;
    }

    public withElectrolyte(type: ElectrolyteType, pKas?: number | number[]): this {
        this.electrolyteType = type;
        if (pKas !== undefined) {
            this.pKas = Array.isArray(pKas) ? pKas : [pKas];
        }
        return this;
    }

    getIonicCharge(): number {
        return this.ionicCharge;
    }

    public withHansen(dD: number, dP: number, dH: number): this {
        this.hansen = new HansenParameters(dD, dP, dH);
        return this;
    }

    public withSolubility(gramsPer100ml: number, saltingOutK = 0.1): this {
        this.solubilityWater = gramsPer100ml;
        this.saltingOutConstant = saltingOutK;
        return this;
    }

    getSolubilityWater(temperatureCelsius: number, ionicStrength: number): number {
        // 1. Базовая растворимость
        let s = this.solubilityWater;
        
        // 2. Температурная коррекция (упрощенно: +1% на градус выше 25°C)
        const tempFactor = 1 + (temperatureCelsius - 25) * 0.01;
        s *= Math.max(0.1, tempFactor);

        // 3. Эффект высаливания (Уравнение Сеченова: log(S0/S) = K*I)
        // S = S0 / 10^(K*I)
        const saltingOutFactor = Math.pow(10, this.saltingOutConstant * ionicStrength);
        
        return s / saltingOutFactor;
    }

    getHansenParameters(): HansenParameters | undefined {
        return this.hansen;
    }

    getName(): string {
        return this.name;
    }

    getDensity(): number {
        // В будущем можно добавить температурную зависимость плотности
        return this.density;
    }

    getViscosity(temperatureCelsius: number): number {
        // Модель Аррениуса: eta = A * exp(B / T_kelvin)
        const tKelvin = temperatureCelsius + 273.15;
        return this.viscosityA * Math.exp(this.viscosityB / tKelvin);
    }

    getVaporPressure(temperatureCelsius: number): number {
        // Закон Антуана
        const logP = this.antoineA - (this.antoineB / (temperatureCelsius + this.antoineC));
        return Math.pow(10, logP);
    }

    massToMoles(mass: Mass): Moles {
        const grams = mass.to('g');
        return new Moles(grams / this.molarMass, 'mol');
    }

    molesToMass(moles: Moles): Mass {
        const molValue = moles.to('mol');
        return new Mass(molValue * this.molarMass, 'g');
    }

    getSpecificHeatCapacity(temperatureCelsius?: number): number {
        // Упрощенная модель: вода имеет высокую теплоемкость (~4.18 Дж/(г*К)), 
        // органические вещества (масла, спирты) - около 2.0 Дж/(г*К).
        const nameLower = this.name.toLowerCase();
        let baseCp = 2.0;

        if (nameLower.includes('water') || nameLower.includes('вода') || nameLower.includes('aqua')) {
            baseCp = 4.184;
        } else if (nameLower.includes('glycerin') || nameLower.includes('глицерин')) {
            baseCp = 2.4;
        }

        // Небольшая температурная зависимость для реализма
        return baseCp + (temperatureCelsius || 25) * 0.0005;
    }
}
