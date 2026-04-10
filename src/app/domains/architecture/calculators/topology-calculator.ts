import { Molecule } from '../models';

/**
 * Калькулятор топологических свойств молекулы.
 * Реализует математические модели без привязки к Angular-сервисам.
 */
export class TopologyCalculator {
  
  static calculateExactMass(mol: Molecule): number {
    const masses: Record<string, number> = {
      'H': 1.007825, 'C': 12.000000, 'N': 14.003074, 'O': 15.994915,
      'P': 30.973762, 'S': 31.972071, 'F': 18.998403, 'Cl': 34.968853,
      'Br': 78.918338, 'I': 126.904473
    };
    return mol.atoms.reduce((sum, atom) => sum + (masses[atom.symbol] || 0), 0);
  }

  static calculateLogP(mol: Molecule): number {
    const contributions: Record<string, number> = {
      'C': 0.35, 'H': 0.11, 'N': -0.20, 'O': -0.15, 'F': 0.13,
      'Cl': 0.52, 'Br': 0.85, 'I': 1.12, 'S': 0.45, 'P': 0.20
    };
    let logP = 0;
    mol.atoms.forEach(atom => logP += contributions[atom.symbol] || 0);
    logP += this.estimateRings(mol) * 0.1;
    return logP;
  }

  static calculateTPSA(mol: Molecule): number {
    let tpsa = 0;
    mol.atoms.forEach(atom => {
      if (atom.symbol === 'N') tpsa += 12.03;
      if (atom.symbol === 'O') tpsa += 17.07;
    });
    return tpsa;
  }

  static estimateRings(mol: Molecule): number {
    const v = mol.atoms.length;
    const e = mol.bonds.length;
    if (v === 0) return 0;
    return Math.max(0, e - v + 1);
  }

  static countHDonors(mol: Molecule): number {
    return mol.atoms.filter(a => a.symbol === 'N' || a.symbol === 'O').length;
  }

  static countHAcceptors(mol: Molecule): number {
    return mol.atoms.filter(a => a.symbol === 'N' || a.symbol === 'O').length;
  }
}
