import { PureSubstance } from './pure-substance';
import { ISurfactant } from './surfactant.interface';

export class Surfactant extends PureSubstance implements ISurfactant {
    constructor(
        name: string,
        molarMass: number,
        public readonly hlb: number,
        public readonly pricePerKg = 0,
        public readonly irritationIndex = 0,
        public readonly isEcoCertified = false,
        antoineA = 0,
        antoineB = 0,
        antoineC = 0,
        density = 1.0,
        meltingPoint = 0,
        viscosityA = 0.0001,
        viscosityB = 3500,
        ionicCharge = 0,
        public readonly cc: number = 0
    ) {
        super(name, molarMass, antoineA, antoineB, antoineC, density, meltingPoint, viscosityA, viscosityB, ionicCharge);
    }
}
