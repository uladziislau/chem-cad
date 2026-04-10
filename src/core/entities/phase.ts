import { IPhase } from './phase.interface';
import { Mixture } from './mixture';
import { Mass, Volume } from '../units/quantities';

export class Phase implements IPhase {
    constructor(
        public readonly composition: Mixture,
        public readonly totalMass: Mass,
        public temperatureCelsius = 25
    ) {}

    getDensity(): number {
        return this.composition.getDensity(this.temperatureCelsius);
    }

    getVolume(): Volume {
        const density = this.getDensity(); // г/мл
        const massGrams = this.totalMass.to('g');
        return new Volume(massGrams / density, 'ml');
    }

    getViscosity(): number {
        const baseViscosity = this.composition.getViscosity(this.temperatureCelsius);
        // Если фаза застыла, вязкость условно огромная (теряет текучесть)
        return this.isSolid() ? baseViscosity * 1000000 : baseViscosity;
    }

    isSolid(): boolean {
        return this.temperatureCelsius < this.composition.getMeltingPoint();
    }
}
