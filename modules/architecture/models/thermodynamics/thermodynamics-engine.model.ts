import { IMolecule } from '../molecule.interface';

export class ThermodynamicsEngine {
  /**
   * Рассчитывает энтальпию реакции (ΔH) по Закону Гесса на основе энергий связей.
   * ΔH = Σ(Энергии разрываемых связей) - Σ(Энергии образуемых связей)
   * @returns Энтальпия в кДж/моль. Отрицательное значение = экзотермическая реакция (выделение тепла).
   */
  static calculateEnthalpy(reactants: IMolecule[], products: IMolecule[]): number {
    const energyIn = reactants.reduce((sum, mol) => sum + mol.getTotalBondEnergy(), 0);
    const energyOut = products.reduce((sum, mol) => sum + mol.getTotalBondEnergy(), 0);
    
    // Энергия затрачивается на разрыв связей (+) и выделяется при образовании (-)
    return energyIn - energyOut;
  }

  static isExothermic(reactants: IMolecule[], products: IMolecule[]): boolean {
    return this.calculateEnthalpy(reactants, products) < 0;
  }
}
