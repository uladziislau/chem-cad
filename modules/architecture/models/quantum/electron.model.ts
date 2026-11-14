export enum Spin {
  UP = 1,
  DOWN = -1
}

export interface IElectron {
  spin: Spin;
}

export class Electron implements IElectron {
  constructor(public spin: Spin) {}
}
