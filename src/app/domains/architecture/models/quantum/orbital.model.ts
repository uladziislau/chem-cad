import { Electron, Spin } from './electron.model';

export interface IOrbital {
  name: string;
  energyLevel: number;
  electrons: Electron[];
  addElectron(e: Electron): boolean;
  isFull(): boolean;
  hasUnpaired(): boolean;
}

export class Orbital implements IOrbital {
  electrons: Electron[] = [];

  constructor(public name: string, public energyLevel: number) {}

  addElectron(e: Electron): boolean {
    if (this.isFull()) return false;
    
    // Принцип Паули: два электрона на одной орбитали должны иметь противоположные спины
    if (this.electrons.length === 1 && this.electrons[0].spin === e.spin) {
      // Автоматически переворачиваем спин, если он совпадает
      e.spin = e.spin === Spin.UP ? Spin.DOWN : Spin.UP;
    }
    
    this.electrons.push(e);
    return true;
  }

  isFull(): boolean {
    return this.electrons.length >= 2;
  }

  hasUnpaired(): boolean {
    return this.electrons.length === 1;
  }
}
