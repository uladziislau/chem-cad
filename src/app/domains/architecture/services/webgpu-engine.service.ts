import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebGpuEngineService {
  private device: GPUDevice | null = null;
  private adapter: GPUAdapter | null = null;
  
  isSupported = signal(false);
  isInitialized = signal(false);

  async initialize(): Promise<boolean> {
    if (!navigator.gpu) {
      console.warn('WebGPU не поддерживается в этом браузере.');
      this.isSupported.set(false);
      return false;
    }

    this.isSupported.set(true);

    try {
      this.adapter = await navigator.gpu.requestAdapter();
      if (!this.adapter) {
        console.error('Не удалось получить GPU адаптер.');
        return false;
      }

      this.device = await this.adapter.requestDevice();
      this.isInitialized.set(true);
      console.log('WebGPU движок ChemCore успешно инициализирован.');
      return true;
    } catch (error) {
      console.error('Ошибка инициализации WebGPU:', error);
      return false;
    }
  }

  /**
   * Пример вычислительного шейдера для расчета межатомных расстояний (Force Field Step)
   */
  async runComputeShader(atomPositions: Float32Array): Promise<Float32Array> {
    if (!this.device) throw new Error('WebGPU не инициализирован');

    const device = this.device;

    // 1. Подготовка данных (Буферы)
    const positionBuffer = device.createBuffer({
      size: atomPositions.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(positionBuffer.getMappedRange()).set(atomPositions);
    positionBuffer.unmap();

    const resultBuffer = device.createBuffer({
      size: atomPositions.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    // 2. Шейдер (WGSL) - Расчет потенциальной энергии системы (Lennard-Jones)
    const shaderModule = device.createShaderModule({
      code: `
        struct Atom {
          pos: vec3<f32>,
          padding: f32,
        };

        @group(0) @binding(0) var<storage, read> atoms : array<Atom>;
        @group(0) @binding(1) var<storage, read_write> energies : array<f32>;

        @compute @workgroup_size(64)
        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
          let i = global_id.x;
          let n = arrayLength(&atoms);
          if (i >= n) { return; }

          var total_energy: f32 = 0.0;
          let pos_i = atoms[i].pos;

          // Параметры потенциала Леннард-Джонса (упрощенно)
          let epsilon: f32 = 0.1; // Глубина ямы
          let sigma: f32 = 3.5;   // Расстояние, где потенциал равен 0

          for (var j: u32 = 0; j < n; j++) {
            if (i == j) { continue; }
            
            let pos_j = atoms[j].pos;
            let dist = distance(pos_i, pos_j);
            
            if (dist > 0.1) {
              let r6 = pow(sigma / dist, 6.0);
              let r12 = r6 * r6;
              total_energy += 4.0 * epsilon * (r12 - r6);
            }
          }
          
          energies[i] = total_energy;
        }
      `
    });

    // 3. Конвейер (Pipeline)
    const computePipeline = device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: shaderModule,
        entryPoint: 'main',
      },
    });

    // 4. Группа ресурсов (Bind Group)
    const bindGroup = device.createBindGroup({
      layout: computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: positionBuffer } },
        { binding: 1, resource: { buffer: resultBuffer } },
      ],
    });

    // 5. Выполнение (Command Encoder)
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(computePipeline);
    passEncoder.setBindGroup(0, bindGroup);
    const workgroupCount = Math.ceil(atomPositions.length / 4 / 64); // 4 floats per Atom (vec3 + padding)
    passEncoder.dispatchWorkgroups(workgroupCount);
    passEncoder.end();

    // Копирование результата обратно
    const gpuReadBuffer = device.createBuffer({
      size: (atomPositions.length / 4) * 4, // 1 float per atom
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    commandEncoder.copyBufferToBuffer(resultBuffer, 0, gpuReadBuffer, 0, (atomPositions.length / 4) * 4);

    device.queue.submit([commandEncoder.finish()]);

    // 6. Чтение данных
    await gpuReadBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = gpuReadBuffer.getMappedRange();
    const result = new Float32Array(arrayBuffer).slice();
    gpuReadBuffer.unmap();

    return result;
  }
}
