import { IAtom } from './atom.interface';
import { IBond } from './bond.interface';
import { Vector2D } from './vector-2d.interface';

export interface IMolecule {
  atoms: IAtom[];
  bonds: IBond[];
  getMolecularMass(): number;
  getFormula(): string;
  getNetDipoleMoment(): Vector2D;
  isPolarMolecule(): boolean;
  getTotalBondEnergy(): number;
}
