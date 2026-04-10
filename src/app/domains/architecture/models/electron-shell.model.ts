import { IElectronShell } from './electron-shell.interface';

export class ElectronShell implements IElectronShell {
  constructor(
    public level: number,
    public capacity: number,
    public electrons: number
  ) {}

  isFull(): boolean {
    return this.electrons >= this.capacity;
  }
}
