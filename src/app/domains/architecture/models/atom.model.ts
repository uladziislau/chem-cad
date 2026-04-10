import { IAtom } from './atom.interface';
import { IBond } from './bond.interface';
import { IElectronShell } from './electron-shell.interface';
import { IBondable } from './bondable.interface';
import { Vector2D } from './vector-2d.interface';
import { ElectronShell } from './electron-shell.model';

export class Atom implements IAtom {
  currentBonds = 0;
  bonds: IBond[] = [];
  shells: IElectronShell[] = [];

  constructor(
    public symbol: string,
    public atomicNumber: number,
    public mass: number,
    public charge: number,
    public maxValence: number,
    public electronegativity: number,
    public valenceElectrons: number,
    public position: Vector2D = { x: 0, y: 0 }
  ) {
    this.initShells();
  }

  private initShells() {
    let remaining = this.atomicNumber;
    const capacities = [2, 8, 18, 32];
    for (let i = 0; i < capacities.length && remaining > 0; i++) {
      const count = Math.min(remaining, capacities[i]);
      this.shells.push(new ElectronShell(i + 1, capacities[i], count));
      remaining -= count;
    }
  }

  getOxidationState(): number {
    return this.charge;
  }

  canBond(other: IBondable): boolean {
    return this.currentBonds < this.maxValence && other.currentBonds < other.maxValence;
  }

  addBond(bond: IBond): void {
    this.bonds.push(bond);
    const bondValue = bond.type === 'single' ? 1 : bond.type === 'double' ? 2 : 3;
    this.currentBonds += bondValue;
  }
}
