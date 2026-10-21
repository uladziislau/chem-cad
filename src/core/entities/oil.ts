import { PureSubstance } from './pure-substance';
import { IOil } from './surfactant.interface';

function fallback<T>(value: T | undefined, defaultValue: T): T {
    return value === undefined ? defaultValue : value;
}

export class Oil extends PureSubstance implements IOil {
    public readonly requiredHlb: number;
    public readonly pricePerKg: number;
    public readonly irritationIndex: number;
    public readonly isEcoCertified: boolean;
    public readonly eacn: number;

    constructor(
        name: string,
        molarMass: number,
        requiredHlb: number,
        pricePerKg?: number,
        irritationIndex?: number,
        isEcoCertified?: boolean,
        antoineA?: number,
        antoineB?: number,
        antoineC?: number,
        density?: number,
        meltingPoint?: number,
        viscosityA?: number,
        viscosityB?: number,
        ionicCharge?: number,
        eacn?: number
    ) {
        super(
            name,
            molarMass,
            fallback(antoineA, 0),
            fallback(antoineB, 0),
            fallback(antoineC, 0),
            fallback(density, 0.9),
            fallback(meltingPoint, 0),
            fallback(viscosityA, 0.0001),
            fallback(viscosityB, 3000),
            fallback(ionicCharge, 0)
        );
        this.requiredHlb = requiredHlb;
        this.pricePerKg = fallback(pricePerKg, 0);
        this.irritationIndex = fallback(irritationIndex, 0);
        this.isEcoCertified = fallback(isEcoCertified, false);
        this.eacn = fallback(eacn, 10);
    }
}
