import { Injectable, inject } from '@angular/core';
import { ChemistryInventoryService } from './chemistry-inventory.service';
import { ChemEventBusService, SystemEventType } from './chem-event-bus.service';
import { Atom, CovalentBond, Molecule } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SmilesParserService {
  private inventory = inject(ChemistryInventoryService);
  private eventBus = inject(ChemEventBusService);

  /**
   * Парсит строку SMILES (Simplified Molecular-Input Line-Entry System)
   * и преобразует ее в графовую ООП-модель Molecule.
   * Поддерживает: алифатические цепи, ветвления (), двойные/тройные связи (=, #), кольца (1-9).
   */
  parse(smiles: string): Molecule {
    const atoms: Atom[] = [];
    const bonds: CovalentBond[] = [];
    
    const branchStack: Atom[] = [];
    const rings: Record<string, Atom> = {};
    
    let currentAtom: Atom | null = null;
    let nextBondType: 'single' | 'double' | 'triple' = 'single';

    // Очистка строки от пробелов
    const cleanSmiles = smiles.replace(/\s+/g, '');

    for (let i = 0; i < cleanSmiles.length; i++) {
      const char = cleanSmiles[i];

      if (char === '(') {
        if (currentAtom) branchStack.push(currentAtom);
      } else if (char === ')') {
        currentAtom = branchStack.pop() || null;
      } else if (char === '=') {
        nextBondType = 'double';
      } else if (char === '#') {
        nextBondType = 'triple';
      } else if (/[0-9]/.test(char)) {
        // Замыкание или открытие кольца
        if (rings[char]) {
          // Кольцо закрывается
          if (currentAtom) {
            bonds.push(new CovalentBond(currentAtom, rings[char], nextBondType));
          }
          delete rings[char];
          nextBondType = 'single';
        } else {
          // Кольцо открывается
          if (currentAtom) {
            rings[char] = currentAtom;
          }
        }
      } else if (/[A-Za-z]/.test(char)) {
        // Чтение символа элемента (учитываем двухбуквенные, например Cl, Br)
        let symbol = char;
        if (i + 1 < cleanSmiles.length && /[a-z]/.test(cleanSmiles[i + 1])) {
          symbol += cleanSmiles[i + 1];
          i++;
        }

        // Нормализация регистра для инвентаря (например c -> C для ароматики)
        // В упрощенном парсере мы трактуем ароматические атомы (c, n, o) как обычные
        const normalizedSymbol = symbol.charAt(0).toUpperCase() + symbol.slice(1);

        try {
          const newAtom = this.inventory.createAtom(normalizedSymbol);
          atoms.push(newAtom);

          if (currentAtom) {
            bonds.push(new CovalentBond(currentAtom, newAtom, nextBondType));
            nextBondType = 'single';
          }

          currentAtom = newAtom;
        } catch {
          console.warn(`[SMILES Parser] Элемент ${normalizedSymbol} не найден в инвентаре. Пропуск.`);
        }
      }
    }

    const molecule = new Molecule(atoms, bonds);

    // Оповещаем всю систему, что Топологический Узел построил новый граф
    this.eventBus.dispatch(SystemEventType.MOLECULE_PARSED, {
      smiles: cleanSmiles,
      molecule: molecule,
      atomsCount: atoms.length,
      bondsCount: bonds.length
    }, 'TopologyNode(SMILES)');

    return molecule;
  }
}
