import { IMolecule } from './molecule.interface';
import { IEnvironment } from './environment.interface';

export interface IReaction {
  reactants: IMolecule[];
  products: IMolecule[];
  activationEnergy: number;
  isPossible(env: IEnvironment): boolean;
  execute(): { energyReleased: number };
}
