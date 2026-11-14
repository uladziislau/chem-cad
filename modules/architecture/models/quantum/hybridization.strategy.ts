import { Orbital } from './orbital.model';
import { Electron, Spin } from './electron.model';

export interface IHybridizationStrategy {
  name: string;
  hybridize(sOrbital: Orbital, pOrbitals: Orbital[]): Orbital[];
}

export class Sp3Hybridization implements IHybridizationStrategy {
  name = 'sp³';

  hybridize(sOrbital: Orbital, pOrbitals: Orbital[]): Orbital[] {
    if (pOrbitals.length !== 3) {
      throw new Error('sp³ hybridization requires 1 s-orbital and 3 p-orbitals');
    }

    // Собираем все электроны с s и p орбиталей
    const allElectrons: Electron[] = [
      ...sOrbital.electrons,
      ...pOrbitals.flatMap(p => p.electrons)
    ];

    // Вычисляем усредненную энергию новых гибридных орбиталей
    // (1 часть s-характера + 3 части p-характера) / 4
    const avgEnergy = (sOrbital.energyLevel + pOrbitals.reduce((sum, p) => sum + p.energyLevel, 0)) / 4;

    // Создаем 4 вырожденные (одинаковые по энергии) sp3 орбитали
    const sp3Orbitals = [
      new Orbital('sp³', avgEnergy),
      new Orbital('sp³', avgEnergy),
      new Orbital('sp³', avgEnergy),
      new Orbital('sp³', avgEnergy)
    ];

    // Правило Хунда: сначала заполняем все орбитали по одному электрону с одинаковым спином
    let eIndex = 0;
    
    // Первый проход (по одному)
    for (let i = 0; i < sp3Orbitals.length && eIndex < allElectrons.length; i++) {
      sp3Orbitals[i].addElectron(new Electron(Spin.UP));
      eIndex++;
    }
    
    // Второй проход (спаривание, если электронов больше 4)
    for (let i = 0; i < sp3Orbitals.length && eIndex < allElectrons.length; i++) {
      sp3Orbitals[i].addElectron(new Electron(Spin.DOWN));
      eIndex++;
    }

    return sp3Orbitals;
  }
}
