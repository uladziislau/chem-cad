import { Injectable, signal, computed } from '@angular/core';
import { ELEMENT_PROPERTIES, BondResult } from '../models/bonding.model';

@Injectable({
  providedIn: 'root'
})
export class BondingEngineService {
  // Состояние: два выбранных атома для взаимодействия
  private atomAId = signal<number>(1); // Водород по умолчанию
  private atomBId = signal<number>(1); // Водород по умолчанию

  readonly atomA = computed(() => ELEMENT_PROPERTIES[this.atomAId()]);
  readonly atomB = computed(() => ELEMENT_PROPERTIES[this.atomBId()]);

  readonly availableElements = Object.values(ELEMENT_PROPERTIES);

  readonly bondResult = computed<BondResult>(() => {
    const a = this.atomA();
    const b = this.atomB();

    if (!a || !b) return { type: 'none', deltaEN: 0, description: 'Выберите атомы', electronShift: 0 };

    // Инертные газы не образуют связей в нашей простой модели
    if (a.atomicNumber === 2 || b.atomicNumber === 2) {
      return {
        type: 'none',
        deltaEN: 0,
        description: 'Гелий — благородный газ. Его внешняя оболочка полностью заполнена (2 электрона). Он абсолютно самодостаточен и отказывается делиться электронами или забирать их у других.',
        electronShift: 0
      };
    }

    // Разница в электроотрицательности (жажде электронов)
    const deltaEN = Math.abs(a.electronegativity - b.electronegativity);
    
    // Направление сдвига электронного облака (от -1 до 1)
    // Если b сильнее, сдвиг положительный (вправо). Если a сильнее, сдвиг отрицательный (влево).
    let shift = 0;
    
    if (b.electronegativity > a.electronegativity) {
      shift = Math.min(deltaEN / 2.0, 1); // Нормализуем для визуала
    } else if (a.electronegativity > b.electronegativity) {
      shift = -Math.min(deltaEN / 2.0, 1);
    }

    if (deltaEN <= 0.4) {
      return {
        type: 'covalent-nonpolar',
        deltaEN,
        description: 'Ковалентная неполярная связь. Атомы тянут электроны с одинаковой силой. Электронное облако распределено симметрично. Это честное партнерство.',
        electronShift: shift
      };
    } else if (deltaEN > 0.4 && deltaEN <= 1.7) {
      return {
        type: 'covalent-polar',
        deltaEN,
        description: 'Ковалентная полярная связь. Один атом сильнее и перетягивает электронное одеяло на себя, но не может забрать его полностью. Образуются частичные заряды (полюса).',
        electronShift: shift
      };
    } else {
      return {
        type: 'ionic',
        deltaEN,
        description: 'Ионная связь. Разрыв! Один атом настолько сильнее, что полностью отрывает электрон у другого. Образуются два заряженных иона, которые слипаются как магниты.',
        electronShift: shift > 0 ? 1 : -1 // Полный сдвиг
      };
    }
  });

  setAtomA(atomicNumber: number) {
    this.atomAId.set(atomicNumber);
  }

  setAtomB(atomicNumber: number) {
    this.atomBId.set(atomicNumber);
  }
}
