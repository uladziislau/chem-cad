import { IAtom } from './atom.interface';
import { Vector2D } from './vector-2d.interface';

export interface IBond {
  atomA: IAtom;
  atomB: IAtom;
  type: 'single' | 'double' | 'triple' | 'ionic';
  energy: number;
  getDipoleVector(): Vector2D;
  isPolar(): boolean;
}
