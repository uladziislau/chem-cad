export interface SubatomicParticle {
  id: string;
  type: 'proton' | 'neutron' | 'electron';
  charge: number;
  mass: number; // in atomic mass units (amu)
}

export interface ElementDefinition {
  atomicNumber: number;
  symbol: string;
  name: string;
  description: string;
}

export interface AtomState {
  protons: number;
  neutrons: number;
  electrons: number;
}

export interface AtomComputedProperties {
  element: ElementDefinition | null;
  massNumber: number;
  netCharge: number;
  isStable: boolean;
  ionType: 'cation' | 'anion' | 'neutral';
  isotopeName: string;
}

export const PERIODIC_TABLE: Record<number, ElementDefinition> = {
  1: { atomicNumber: 1, symbol: 'H', name: 'Водород', description: 'Основа Вселенной. Самый легкий и распространенный элемент. Один протон задает его суть.' },
  2: { atomicNumber: 2, symbol: 'He', name: 'Гелий', description: 'Инертный газ. Его электронная оболочка полностью заполнена, поэтому он ни с кем не вступает в реакции.' },
  3: { atomicNumber: 3, symbol: 'Li', name: 'Литий', description: 'Легчайший металл. Готов легко отдать свой единственный внешний электрон, что делает его крайне реакционноспособным.' },
  4: { atomicNumber: 4, symbol: 'Be', name: 'Бериллий', description: 'Твердый и хрупкий металл. Образует прочные ковалентные связи.' },
  5: { atomicNumber: 5, symbol: 'B', name: 'Бор', description: 'Полуметалл. Обладает сложной химией, образуя трехмерные кристаллические решетки.' },
  6: { atomicNumber: 6, symbol: 'C', name: 'Углерод', description: 'Основа жизни. Способен образовывать четыре прочные связи, создавая бесконечное множество органических молекул.' },
  7: { atomicNumber: 7, symbol: 'N', name: 'Азот', description: 'Основа атмосферы. Образует невероятно прочную тройную связь в молекуле N2.' },
  8: { atomicNumber: 8, symbol: 'O', name: 'Кислород', description: 'Сильнейший окислитель (после фтора). Стремится забрать электроны у других элементов.' },
};
