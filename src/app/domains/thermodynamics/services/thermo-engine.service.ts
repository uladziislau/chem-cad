import { Injectable, signal, computed } from '@angular/core';
import { ReactionParticipant, ReactionCalculation, THERMO_DATA } from '../models/thermo.model';

@Injectable({
  providedIn: 'root'
})
export class ThermoEngineService {
  temperature = signal<number>(298); // Температура в Кельвинах (25°C по умолчанию)
  
  // Пример реакции: 2H2 + O2 -> 2H2O(l)
  private reactants = signal<ReactionParticipant[]>([
    { symbol: 'H2', name: 'Водород', coefficient: 2, properties: THERMO_DATA['H2'] },
    { symbol: 'O2', name: 'Кислород', coefficient: 1, properties: THERMO_DATA['O2'] }
  ]);

  private products = signal<ReactionParticipant[]>([
    { symbol: 'H2O(l)', name: 'Вода (жидк.)', coefficient: 2, properties: THERMO_DATA['H2O(l)'] }
  ]);

  readonly calculation = computed<ReactionCalculation>(() => {
    const T = this.temperature();
    const r = this.reactants();
    const p = this.products();

    // Σ(n * H_products) - Σ(n * H_reactants)
    const sumHProd = p.reduce((sum, item) => sum + item.coefficient * item.properties.enthalpy, 0);
    const sumHReact = r.reduce((sum, item) => sum + item.coefficient * item.properties.enthalpy, 0);
    const deltaH = sumHProd - sumHReact;

    // Σ(n * S_products) - Σ(n * S_reactants)
    const sumSProd = p.reduce((sum, item) => sum + item.coefficient * item.properties.entropy, 0);
    const sumSReact = r.reduce((sum, item) => sum + item.coefficient * item.properties.entropy, 0);
    const deltaS = (sumSProd - sumSReact) / 1000; // Переводим Дж в кДж

    // G = H - T * S
    const deltaG = deltaH - T * deltaS;

    return {
      deltaH,
      deltaS,
      deltaG,
      isSpontaneous: deltaG < 0,
      type: deltaH < 0 ? 'exothermic' : 'endothermic'
    };
  });

  setTemperature(celsius: number) {
    this.temperature.set(celsius + 273.15);
  }

  getReactants() { return this.reactants(); }
  getProducts() { return this.products(); }
}
