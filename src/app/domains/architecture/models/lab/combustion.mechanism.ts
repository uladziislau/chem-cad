import { IReactionMechanism } from './mechanism.interface';
import { IMolecule } from '../molecule.interface';
import { IEnvironment } from '../environment.interface';
import { Molecule } from '../molecule.model';
import { CovalentBond } from '../covalent-bond.model';

// Упрощенный механизм синтеза воды для демонстрации эмерджентности
export class HydrogenCombustionMechanism implements IReactionMechanism {
  name = 'Горение водорода (Синтез H₂O)';

  evaluateCollision(m1: IMolecule, m2: IMolecule, env: IEnvironment): IMolecule[] | null {
    // Термодинамический барьер: реакция идет только при высокой температуре (искра)
    if (env.temperature < 400) return null;

    const f1 = m1.getFormula();
    const f2 = m2.getFormula();

    // Топологическая проверка: ищем H2 и O2
    const isH2_O2 = (f1 === 'H₂' && f2 === 'O₂') || (f1 === 'O₂' && f2 === 'H₂');
    
    if (isH2_O2) {
      // В реальном движке здесь был бы разрыв графов и перестройка связей.
      // Для демо мы алгоритмически собираем H2O из атомов столкнувшихся молекул.
      
      const h2Mol = f1 === 'H₂' ? m1 : m2;
      const o2Mol = f1 === 'O₂' ? m1 : m2;

      // Берем атомы
      const hAtom1 = h2Mol.atoms[0];
      const hAtom2 = h2Mol.atoms[1];
      const oAtom1 = o2Mol.atoms[0]; // Берем один кислород
      // Второй кислород (oAtom2) по-хорошему должен стать радикалом O*, 
      // но для простоты демо мы "уничтожим" его, симулируя макро-реакцию.

      // Создаем новые связи
      const bond1 = new CovalentBond(oAtom1, hAtom1, 'single');
      const bond2 = new CovalentBond(oAtom1, hAtom2, 'single');

      const water = new Molecule([oAtom1, hAtom1, hAtom2], [bond1, bond2]);
      
      return [water];
    }

    return null;
  }
}
