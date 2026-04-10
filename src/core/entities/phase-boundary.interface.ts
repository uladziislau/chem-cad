import { IPhase } from './phase.interface';
import { MixtureComponent } from './mixture';
import { Moles } from '../units/quantities';
import { ISurfactant } from './surfactant.interface';

export interface IPhaseBoundary {
    readonly phaseA: IPhase;
    readonly phaseB: IPhase;
    readonly surfactants: MixtureComponent[];
    
    /**
     * Возвращает базовое межфазное натяжение между чистыми фазами (мН/м)
     */
    getBaseTension(): number;

    /**
     * Рассчитывает текущее межфазное натяжение с учетом ПАВ (мН/м)
     */
    getInterfacialTension(): number;

    /**
     * Добавляет ПАВ на границу раздела
     */
    addSurfactant(surfactant: ISurfactant, amount: Moles): void;
}
