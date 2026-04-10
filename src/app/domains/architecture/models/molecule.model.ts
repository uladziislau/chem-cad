import { IMolecule } from './molecule.interface';
import { IAtom } from './atom.interface';
import { IBond } from './bond.interface';
import { Vector2D } from './vector-2d.interface';

export class Molecule implements IMolecule {
  constructor(public atoms: IAtom[], public bonds: IBond[]) {}

  getMolecularMass(): number {
    return this.atoms.reduce((sum, atom) => sum + atom.mass, 0);
  }

  getFormula(): string {
    const counts: Record<string, number> = {};
    this.atoms.forEach(a => {
      counts[a.symbol] = (counts[a.symbol] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([sym, count]) => count > 1 ? `${sym}₂` : sym)
      .join('');
  }

  getNetDipoleMoment(): Vector2D {
    return this.bonds.reduce((sum, bond) => {
      const v = bond.getDipoleVector();
      return { x: sum.x + v.x, y: sum.y + v.y };
    }, { x: 0, y: 0 });
  }

  isPolarMolecule(): boolean {
    const netDipole = this.getNetDipoleMoment();
    const magnitude = Math.sqrt(netDipole.x * netDipole.x + netDipole.y * netDipole.y);
    return magnitude > 0.1; 
  }

  getTotalBondEnergy(): number {
    return this.bonds.reduce((sum, b) => sum + b.energy, 0);
  }
}
