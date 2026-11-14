export interface IElectronShell {
  level: number;
  capacity: number;
  electrons: number;
  isFull(): boolean;
}
