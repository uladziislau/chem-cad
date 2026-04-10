import { Injectable } from '@angular/core';
import { Atom } from '../models';
import { ELECTRONEGATIVITY } from '../models/constants';

@Injectable({
  providedIn: 'root'
})
export class ChemistryInventoryService {
  private atoms: Record<string, () => Atom> = {
    'H': () => new Atom('H', 1, 1.008, 0, 1, ELECTRONEGATIVITY['H'], 1),
    'He': () => new Atom('He', 2, 4.0026, 0, 0, 0, 2),
    'Li': () => new Atom('Li', 3, 6.94, 0, 1, 0.98, 1),
    'C': () => new Atom('C', 6, 12.011, 0, 4, ELECTRONEGATIVITY['C'], 4),
    'N': () => new Atom('N', 7, 14.007, 0, 3, ELECTRONEGATIVITY['N'], 5),
    'O': () => new Atom('O', 8, 15.999, 0, 2, ELECTRONEGATIVITY['O'], 6),
    'F': () => new Atom('F', 9, 18.998, 0, 1, ELECTRONEGATIVITY['F'], 7),
    'Na': () => new Atom('Na', 11, 22.990, 0, 1, ELECTRONEGATIVITY['Na'], 1),
    'P': () => new Atom('P', 15, 30.974, 0, 3, ELECTRONEGATIVITY['P'], 5),
    'S': () => new Atom('S', 16, 32.06, 0, 2, ELECTRONEGATIVITY['S'], 6),
    'Cl': () => new Atom('Cl', 17, 35.45, 0, 1, ELECTRONEGATIVITY['Cl'], 7),
    'Br': () => new Atom('Br', 35, 79.904, 0, 1, ELECTRONEGATIVITY['Br'], 7),
    'I': () => new Atom('I', 53, 126.90, 0, 1, ELECTRONEGATIVITY['I'], 7),
  };

  getAvailableSymbols(): string[] {
    return Object.keys(this.atoms);
  }

  createAtom(symbol: string): Atom {
    const creator = this.atoms[symbol];
    if (!creator) {
      throw new Error(`Atom ${symbol} not found in inventory`);
    }
    return creator();
  }
}
