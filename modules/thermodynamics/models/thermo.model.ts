export interface ThermodynamicProperties {
  enthalpy: number; // H (кДж/моль) - Теплосодержание
  entropy: number;  // S (Дж/(моль·К)) - Мера хаоса
}

export interface ReactionParticipant {
  symbol: string;
  name: string;
  coefficient: number;
  properties: ThermodynamicProperties;
}

export interface ReactionCalculation {
  deltaH: number; // Изменение энтальпии
  deltaS: number; // Изменение энтропии
  deltaG: number; // Энергия Гиббса (G = H - T*S)
  isSpontaneous: boolean; // Самопроизвольна ли реакция?
  type: 'exothermic' | 'endothermic';
}

export const THERMO_DATA: Record<string, ThermodynamicProperties> = {
  'H2': { enthalpy: 0, entropy: 130.7 },
  'O2': { enthalpy: 0, entropy: 205.2 },
  'H2O(l)': { enthalpy: -285.8, entropy: 70.0 },
  'H2O(g)': { enthalpy: -241.8, entropy: 188.8 },
  'C(graphite)': { enthalpy: 0, entropy: 5.7 },
  'CO2': { enthalpy: -393.5, entropy: 213.8 },
  'CH4': { enthalpy: -74.8, entropy: 186.3 },
  'NH3': { enthalpy: -45.9, entropy: 192.8 },
  'N2': { enthalpy: 0, entropy: 191.6 },
};
