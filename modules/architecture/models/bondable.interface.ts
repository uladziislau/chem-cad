import { IBond } from './bond.interface';

export interface IBondable {
  currentBonds: number;
  maxValence: number;
  electronegativity: number;
  valenceElectrons: number;
  canBond(other: IBondable): boolean;
  addBond(bond: IBond): void;
}
