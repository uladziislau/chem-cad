import { IBond } from './bond.interface';
import { IAtom } from './atom.interface';
import { Vector2D } from './vector-2d.interface';
import { BOND_ENERGIES } from './constants';

export class CovalentBond implements IBond {
  public energy: number;

  constructor(
    public atomA: IAtom,
    public atomB: IAtom,
    public type: 'single' | 'double' | 'triple'
  ) {
    atomA.addBond(this);
    atomB.addBond(this);
    
    // Алгоритмически формируем ключ для поиска в базе констант
    // Сортируем символы по алфавиту, чтобы H-O и O-H давали один ключ 'H-O_single'
    const symbols = [atomA.symbol, atomB.symbol].sort();
    const bondKey = `${symbols[0]}-${symbols[1]}_${type}`;
    
    // Берем энергию из справочника. Если нет - используем среднее значение (фоллбэк)
    this.energy = BOND_ENERGIES[bondKey] || 400; 
  }

  getDipoleVector(): Vector2D {
    const deltaEN = this.atomB.electronegativity - this.atomA.electronegativity;
    const dx = this.atomB.position.x - this.atomA.position.x;
    const dy = this.atomB.position.y - this.atomA.position.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return { x: 0, y: 0 };
    const nx = dx / length;
    const ny = dy / length;
    return { x: nx * deltaEN, y: ny * deltaEN };
  }

  isPolar(): boolean {
    return Math.abs(this.atomA.electronegativity - this.atomB.electronegativity) > 0.4;
  }
}
