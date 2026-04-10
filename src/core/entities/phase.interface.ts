import { Mixture } from './mixture';
import { Mass, Volume } from '../units/quantities';

export interface IPhase {
    readonly composition: Mixture;
    readonly temperatureCelsius: number;
    readonly totalMass: Mass;

    getVolume(): Volume;
    getDensity(): number; // г/мл
    getViscosity(): number; // cP (мПа*с)
    isSolid(): boolean;
}
