import { Injectable, inject } from '@angular/core';
import { Molecule } from '../models';
import { WebGpuEngineService } from './webgpu-engine.service';
import { TopologyCalculator } from '../calculators/topology-calculator';

export interface ChemCoreProperties {
  exactMass: number;
  logP: number;
  tpsa: number;
  hDonors: number;
  hAcceptors: number;
  numAtoms: number;
  numRings: number;
  gpuStatus: 'inactive' | 'active' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class ChemCoreService {
  private gpu = inject(WebGpuEngineService);

  constructor() {
    this.gpu.initialize();
  }

  /**
   * Рассчитывает свойства молекулы, используя внутренние математические модели и GPU ускорение.
   */
  async calculateProperties(mol: Molecule): Promise<ChemCoreProperties> {
    const props: ChemCoreProperties = {
      exactMass: TopologyCalculator.calculateExactMass(mol),
      logP: TopologyCalculator.calculateLogP(mol),
      tpsa: TopologyCalculator.calculateTPSA(mol),
      hDonors: TopologyCalculator.countHDonors(mol),
      hAcceptors: TopologyCalculator.countHAcceptors(mol),
      numAtoms: mol.atoms.length,
      numRings: TopologyCalculator.estimateRings(mol),
      gpuStatus: this.gpu.isInitialized() ? 'active' : 'inactive'
    };

    // Если GPU активен, запускаем расчет потенциальной энергии (Lennard-Jones)
    if (this.gpu.isInitialized() && mol.atoms.length > 0) {
      try {
        // Подготовка данных: vec3 (x,y,z) + padding (f32) = 4 floats на атом
        const positions = new Float32Array(mol.atoms.length * 4);
        mol.atoms.forEach((_, i) => {
          // В текущей модели у нас нет 3D координат в Molecule, 
          // поэтому генерируем случайные для демонстрации работы GPU
          positions[i * 4] = Math.random() * 10;
          positions[i * 4 + 1] = Math.random() * 10;
          positions[i * 4 + 2] = Math.random() * 10;
          positions[i * 4 + 3] = 0; // padding
        });
        
        const energies = await this.gpu.runComputeShader(positions);
        const totalEnergy = energies.reduce((a, b) => a + b, 0);
        console.log(`[ChemCore GPU] Общая энергия системы: ${totalEnergy.toFixed(4)}`);
      } catch (e) {
        console.error('Ошибка выполнения GPU шейдера:', e);
        props.gpuStatus = 'error';
      }
    }

    return props;
  }
}
