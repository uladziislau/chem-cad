import { MultiphaseSystem } from '@domain/entities/multiphase-system';
import { SimulationResult } from '@root-modules/engine/chemical-engine';

/**
 * Телеметрический инспектор для вывода результатов физико-химических симуляций в тестах
 */
export class ChemTelemetry {
  public static logSimulation(title: string, result: SimulationResult): void {
    const { metrics, system, context } = result;
    const phStr = metrics.ph.toFixed(2);
    const viscStr = `${metrics.viscosity.toFixed(1)} cP`;
    const hldStr = metrics.hld.toFixed(2);
    const hlbStr = `Act: ${metrics.actualHLB.toFixed(1)}`;
    const shelfLifeStr = metrics.stabilityDays > 700 ? '> 700 дней' : `${metrics.stabilityDays.toFixed(0)} дней`;
    const dropletStr = `${system.getDropletSize().toFixed(2)} µm`;
    const miscStr = metrics.miscibility ? `RED=${metrics.miscibility.redScore.toFixed(2)} (${metrics.miscibility.isMiscible ? 'Miscible' : 'Immiscible'})` : 'N/A';
    const tempStr = `${context.temperatureCelsius}°C`;
    const emulsionType = system.getEmulsionType();

    console.log(`\n┌─ [CHEM RESULT] ${title} @ ${tempStr} ` + '─'.repeat(Math.max(2, 50 - title.length)));
    console.log(`│ Эмульсия:     ${emulsionType.padEnd(12)} │ Капли d32:    ${dropletStr}`);
    console.log(`│ Вязкость:     ${viscStr.padEnd(12)} │ pH / Ионы:    ${phStr} (${metrics.ionicStrength.toFixed(3)} M)`);
    console.log(`│ HLD баланс:   ${hldStr.padEnd(12)} │ HLB:          ${hlbStr}`);
    console.log(`│ Стабильность: ${shelfLifeStr.padEnd(12)} │ Смешиваемость:${miscStr}`);
    console.log(`└${'─'.repeat(68)}`);
  }

  public static logThermalDynamics(title: string, data: {
    temp1: number; visc1: number;
    temp2: number; visc2: number;
    shelfLife1?: number; shelfLife2?: number;
    state1?: string; state2?: string;
  }): void {
    const deltaVisc = ((data.visc2 - data.visc1) / data.visc1 * 100).toFixed(1);
    console.log(`\n┌─ [THERMAL KINETICS] ${title} ` + '─'.repeat(Math.max(2, 46 - title.length)));
    console.log(`│ ${data.temp1}°C: Вязкость = ${data.visc1.toFixed(1)} cP ${data.state1 ? `(${data.state1})` : ''}`);
    console.log(`│ ${data.temp2}°C: Вязкость = ${data.visc2.toFixed(1)} cP ${data.state2 ? `(${data.state2})` : ''} [Δ ${deltaVisc}%]`);
    if (data.shelfLife1 !== undefined && data.shelfLife2 !== undefined) {
      console.log(`│ Срок стабильности: ${data.shelfLife1.toFixed(0)} дн. (${data.temp1}°C) ➔ ${data.shelfLife2.toFixed(0)} дн. (${data.temp2}°C)`);
    }
    console.log(`└${'─'.repeat(68)}`);
  }

  public static logSystemProfile(title: string, system: MultiphaseSystem, extra?: Record<string, unknown>): void {
    const totalMass = system.getTotalMass().to('g').toFixed(1);
    const phasesCount = system.phases.length;
    const boundaryCount = system.boundaries.length;
    const ift = boundaryCount > 0 ? `${system.boundaries[0].getInterfacialTension().toFixed(2)} мН/м` : 'N/A';

    console.log(`\n┌─ [SYSTEM PROFILE] ${title} ` + '─'.repeat(Math.max(2, 48 - title.length)));
    console.log(`│ Масса: ${totalMass}г │ Фазы: ${phasesCount} │ Границы раздела: ${boundaryCount} │ Натяжение: ${ift}`);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        console.log(`│ ${k.padEnd(15)}: ${String(v)}`);
      }
    }
    console.log(`└${'─'.repeat(68)}`);
  }
}
