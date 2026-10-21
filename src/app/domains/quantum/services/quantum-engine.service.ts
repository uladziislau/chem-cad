import { Injectable, signal, computed } from '@angular/core';
import { AtomState, AtomComputedProperties, PERIODIC_TABLE } from '../models/atom.model';

function determineIonType(netCharge: number): 'cation' | 'anion' | 'neutral' {
  if (netCharge > 0) return 'cation';
  if (netCharge < 0) return 'anion';
  return 'neutral';
}

function determineStability(protons: number, neutrons: number): boolean {
  if (protons === 1) {
    return neutrons === 0 || neutrons === 1;
  }
  if (protons > 1) {
    const ratio = neutrons / protons;
    return ratio >= 0.9 && ratio <= 1.2;
  }
  return false;
}

function determineIsotopeName(protons: number, neutrons: number, element: { name: string } | null, massNumber: number): string {
  if (protons === 1 && neutrons === 0) return 'Протий (Водород)';
  if (protons === 1 && neutrons === 1) return 'Дейтерий';
  if (protons === 1 && neutrons === 2) return 'Тритий (Радиоактивен)';
  return element ? `${element.name}-${massNumber}` : 'Неизвестный изотоп';
}

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
    
    const ionType = determineIonType(netCharge);
    const isStable = determineStability(protons, neutrons);
    const isotopeName = determineIsotopeName(protons, neutrons, element, massNumber);

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
