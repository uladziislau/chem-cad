import { IParticle } from './particle.interface';
import { IBondable } from './bondable.interface';
import { Vector2D } from './vector-2d.interface';
import { IElectronShell } from './electron-shell.interface';

export interface IAtom extends IParticle, IBondable {
  symbol: string;
  atomicNumber: number;
  position: Vector2D;
  shells: IElectronShell[];
  getOxidationState(): number;
}
