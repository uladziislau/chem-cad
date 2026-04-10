export class SimulationContext {
  constructor(
    public temperatureCelsius = 25,
    public pressureAtm = 1,
    public mixingSpeedRpm = 0,
    public mixingTimeMinutes = 0
  ) {}

  get temperatureKelvin(): number {
    return this.temperatureCelsius + 273.15;
  }
}
