import { Injectable, signal, computed } from '@angular/core';
import { AtomState, AtomComputedProperties, PERIODIC_TABLE } from '../models/atom.model';

@Injectable({
  providedIn: 'root'
})
export class QuantumEngineService {
  // Core state: the fundamental particles
  private state = signal<AtomState>({
    protons: 1,
    neutrons: 0,
    electrons: 1
  });

  // Expose read-only state
  readonly atomState = this.state.asReadonly();

  // Computed properties based on the fundamental particles
  readonly properties = computed<AtomComputedProperties>(() => {
    const { protons, neutrons, electrons } = this.state();
    
    const element = PERIODIC_TABLE[protons] || null;
    const massNumber = protons + neutrons;
    const netCharge = protons - electrons;
    
    let ionType: 'cation' | 'anion' | 'neutral' = 'neutral';
    if (netCharge > 0) ionType = 'cation';
    if (netCharge < 0) ionType = 'anion';

    // Simplified stability logic for the first few elements
    let isStable = false;
    if (protons === 1) {
      isStable = neutrons === 0 || neutrons === 1; // Protium, Deuterium stable. Tritium (2) unstable.
    } else if (protons > 1) {
      // Roughly N/Z ratio ≈ 1 for light elements
      const ratio = neutrons / protons;
      isStable = ratio >= 0.9 && ratio <= 1.2;
    }

    let isotopeName = element ? `${element.name}-${massNumber}` : 'Неизвестный изотоп';
    if (protons === 1 && neutrons === 0) isotopeName = 'Протий (Водород)';
    if (protons === 1 && neutrons === 1) isotopeName = 'Дейтерий';
    if (protons === 1 && neutrons === 2) isotopeName = 'Тритий (Радиоактивен)';

    return {
      element,
      massNumber,
      netCharge,
      isStable,
      ionType,
      isotopeName
    };
  });

  // Actions (Mutations)
  addParticle(type: 'proton' | 'neutron' | 'electron') {
    this.state.update(s => {
      const newState = { ...s };
      if (type === 'proton' && s.protons < 8) newState.protons++; // Limit to Oxygen for now
      if (type === 'neutron' && s.neutrons < 10) newState.neutrons++;
      if (type === 'electron' && s.electrons < 10) newState.electrons++;
      return newState;
    });
  }

  removeParticle(type: 'proton' | 'neutron' | 'electron') {
    this.state.update(s => {
      const newState = { ...s };
      if (type === 'proton' && s.protons > 1) newState.protons--; // Cannot have 0 protons
      if (type === 'neutron' && s.neutrons > 0) newState.neutrons--;
      if (type === 'electron' && s.electrons > 0) newState.electrons--;
      return newState;
    });
  }
}
