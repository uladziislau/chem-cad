import { IMolecule } from '../molecule.interface';
import { IEnvironment } from '../environment.interface';
import { IReactionMechanism } from './mechanism.interface';

export class Reactor implements IEnvironment {
  public contents: IMolecule[] = [];
  public mechanisms: IReactionMechanism[] = [];

  constructor(
    public temperature: number,
    public pressure: number,
    public volume: number
  ) {}

  addMolecule(molecule: IMolecule) {
    this.contents.push(molecule);
  }

  addMechanism(mechanism: IReactionMechanism) {
    this.mechanisms.push(mechanism);
  }

  // Эмуляция одного "тика" времени в колбе (броуновское движение и столкновения)
  tick(): string[] {
    const logs: string[] = [];
    logs.push(`[Колба] Тик времени. Температура: ${this.temperature}K. Молекул внутри: ${this.contents.length}`);

    if (this.contents.length < 2) {
      logs.push(`[Колба] Недостаточно молекул для столкновений.`);
      return logs;
    }

    // Берем две случайные молекулы для столкновения (упрощенная модель броуновского движения)
    const idx1 = Math.floor(Math.random() * this.contents.length);
    let idx2 = Math.floor(Math.random() * this.contents.length);
    while (idx1 === idx2) {
      idx2 = Math.floor(Math.random() * this.contents.length);
    }

    const m1 = this.contents[idx1];
    const m2 = this.contents[idx2];

    logs.push(`[Столкновение] ${m1.getFormula()} сталкивается с ${m2.getFormula()}...`);

    // Прогоняем столкновение через все известные законы химии (механизмы)
    let reacted = false;
    for (const mech of this.mechanisms) {
      const products = mech.evaluateCollision(m1, m2, this);
      
      if (products) {
        logs.push(`[Реакция!] Сработал механизм: ${mech.name}`);
        
        // Удаляем реагенты из колбы (с конца, чтобы не сбить индексы)
        this.contents.splice(Math.max(idx1, idx2), 1);
        this.contents.splice(Math.min(idx1, idx2), 1);
        
        // Добавляем продукты в колбу
        products.forEach(p => {
          this.contents.push(p);
          logs.push(`[Продукт] Образовалась молекула: ${p.getFormula()}`);
        });
        
        reacted = true;
        break; // Реакция произошла, выходим из цикла механизмов
      }
    }

    if (!reacted) {
      logs.push(`[Отскок] Молекулы просто отскочили друг от друга (недостаточно энергии или нет механизма).`);
    }

    return logs;
  }
}
