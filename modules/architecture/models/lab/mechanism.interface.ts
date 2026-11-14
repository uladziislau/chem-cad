import { IMolecule } from '../molecule.interface';
import { IEnvironment } from '../environment.interface';

export interface IReactionMechanism {
  name: string;
  // Оценивает столкновение двух молекул в заданных условиях.
  // Возвращает массив новых молекул (продуктов), если реакция прошла, или null, если ничего не произошло.
  evaluateCollision(m1: IMolecule, m2: IMolecule, env: IEnvironment): IMolecule[] | null;
}
