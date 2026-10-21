import { PureSubstance } from './pure-substance';
import { ISurfactant } from './surfactant.interface';

function fallback<T>(value: T | undefined, defaultValue: T): T {
    return value === undefined ? defaultValue : value;
}

export class Surfactant extends PureSubstance implements ISurfactant {
    public readonly hlb: number;
    public readonly pricePerKg: number;
    public readonly irritationIndex: number;
    public readonly isEcoCertified: boolean;
    public readonly cc: number;

    constructor(
        name: string,
        molarMass: number,
        hlb: number,
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
        cc?: number
    ) {
        super(
            name,
            molarMass,
            fallback(antoineA, 0),
            fallback(antoineB, 0),
            fallback(antoineC, 0),
            fallback(density, 1.0),
            fallback(meltingPoint, 0),
            fallback(viscosityA, 0.0001),
            fallback(viscosityB, 3500),
            fallback(ionicCharge, 0)
        );
        this.hlb = hlb;
        this.pricePerKg = fallback(pricePerKg, 0);
        this.irritationIndex = fallback(irritationIndex, 0);
        this.isEcoCertified = fallback(isEcoCertified, false);
        this.cc = fallback(cc, 0);
    }
}
