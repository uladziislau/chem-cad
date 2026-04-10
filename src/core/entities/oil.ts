import { PureSubstance } from './pure-substance';
import { IOil } from './surfactant.interface';

export class Oil extends PureSubstance implements IOil {
    constructor(
        name: string,
        molarMass: number,
        public readonly requiredHlb: number,
        public readonly pricePerKg = 0,
        public readonly irritationIndex = 0,
        public readonly isEcoCertified = false,
        antoineA = 0,
        antoineB = 0,
        antoineC = 0,
        density = 0.9,
        meltingPoint = 0,
        viscosityA = 0.0001,
        viscosityB = 3000,
        ionicCharge = 0,
        public readonly eacn: number = 10
    ) {
        super(name, molarMass, antoineA, antoineB, antoineC, density, meltingPoint, viscosityA, viscosityB, ionicCharge);
    }
}
