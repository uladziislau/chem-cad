import { IReaction } from './reaction.interface';
import { IMolecule } from './molecule.interface';
import { IEnvironment } from './environment.interface';

export class SynthesisReaction implements IReaction {
  public activationEnergy = 50;

  constructor(
    public reactants: IMolecule[],
    public products: IMolecule[]
  ) {}

  isPossible(env: IEnvironment): boolean {
    return env.temperature > 300; 
  }

  execute(): { energyReleased: number } {
    const startEnergy = this.reactants.reduce((sum, m) => sum + m.getTotalBondEnergy(), 0);
    const endEnergy = this.products.reduce((sum, m) => sum + m.getTotalBondEnergy(), 0);
    return { energyReleased: endEnergy - startEnergy };
  }
}
