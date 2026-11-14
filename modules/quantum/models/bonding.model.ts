import { ElementDefinition } from './atom.model';

export interface ElementProperties extends ElementDefinition {
  electronegativity: number; // Шкала Полинга (жажда электронов)
  valenceElectrons: number;  // Электроны на внешней орбите
  color: string;             // Для визуализации
}

export type BondType = 'covalent-nonpolar' | 'covalent-polar' | 'ionic' | 'none';

export interface BondResult {
  type: BondType;
  deltaEN: number;
  description: string;
  electronShift: number; // от -1 до 1, где 0 - по центру, 1 - полностью у правого атома, -1 - у левого
}

// Расширенная таблица для симуляции связей (первые 8 элементов)
export const ELEMENT_PROPERTIES: Record<number, ElementProperties> = {
  1: { atomicNumber: 1, symbol: 'H', name: 'Водород', description: '', electronegativity: 2.20, valenceElectrons: 1, color: '#f8fafc' }, // slate-50
  2: { atomicNumber: 2, symbol: 'He', name: 'Гелий', description: '', electronegativity: 0, valenceElectrons: 2, color: '#fef08a' },    // yellow-200 (Инертный)
  3: { atomicNumber: 3, symbol: 'Li', name: 'Литий', description: '', electronegativity: 0.98, valenceElectrons: 1, color: '#fca5a5' }, // red-300
  4: { atomicNumber: 4, symbol: 'Be', name: 'Бериллий', description: '', electronegativity: 1.57, valenceElectrons: 2, color: '#fdba74' }, // orange-300
  5: { atomicNumber: 5, symbol: 'B', name: 'Бор', description: '', electronegativity: 2.04, valenceElectrons: 3, color: '#fcd34d' },    // amber-300
  6: { atomicNumber: 6, symbol: 'C', name: 'Углерод', description: '', electronegativity: 2.55, valenceElectrons: 4, color: '#94a3b8' },  // slate-400
  7: { atomicNumber: 7, symbol: 'N', name: 'Азот', description: '', electronegativity: 3.04, valenceElectrons: 5, color: '#93c5fd' },    // blue-300
  8: { atomicNumber: 8, symbol: 'O', name: 'Кислород', description: '', electronegativity: 3.44, valenceElectrons: 6, color: '#f87171' },  // red-400
};
