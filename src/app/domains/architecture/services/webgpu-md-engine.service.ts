import { Injectable } from '@angular/core';

/**
 * Hi-End движок Молекулярной Динамики, работающий на видеокарте через WebGPU.
 * Использует Compute Shaders (WGSL) для параллельного расчета сил Леннард-Джонса.
 */
@Injectable({
  providedIn: 'root'
})
export class WebGpuMdEngineService {
  private device: GPUDevice | null = null;
  private computePipeline: GPUComputePipeline | null = null;

  /**
   * Инициализация WebGPU и компиляция шейдера.
   */
  async init(): Promise<boolean> {
    if (!navigator.gpu) {
      console.warn('WebGPU не поддерживается в этом браузере. Возврат к CPU-рендерингу.');
      return false;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return false;
      
      this.device = await adapter.requestDevice();

      // WGSL (WebGPU Shading Language) - Код, который будет выполняться на видеокарте
      const shaderCode = `
        // Структура частицы (выравнивание памяти критично для GPU: 16 байт)
        struct Particle {
          pos: vec2<f32>,
          vel: vec2<f32>,
          mass: f32,
          radius: f32,
          padding: vec2<f32>, // Заглушка для выравнивания
        };

        // Буфер данных, который мы передаем из CPU в GPU
        @group(0) @binding(0) var<storage, read_write> particles: array<Particle>;

        // Параметры симуляции (в будущем можно передавать через Uniform Buffer)
        const EPSILON: f32 = 150.0;
        const SIGMA: f32 = 30.0;
        const DT: f32 = 0.016; // ~60 FPS

        // Compute Shader: Запускается параллельно для каждого атома
        @compute @workgroup_size(64)
        fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
          let i = global_id.x;
          
          // Защита от выхода за пределы массива
          if (i >= arrayLength(&particles)) { return; }

          var p1 = particles[i];
          var force = vec2<f32>(0.0, 0.0);

          // O(N) цикл внутри GPU. Так как GPU имеет тысячи ядер, 
          // общая сложность падает с O(N^2) до O(N) по времени!
          for (var j = 0u; j < arrayLength(&particles); j++) {
            if (i == j) { continue; }
            let p2 = particles[j];
            
            let dx = p2.pos.x - p1.pos.x;
            let dy = p2.pos.y - p1.pos.y;
            let rSq = dx*dx + dy*dy;
            let r = sqrt(rSq);

            // Оптимизация: игнорируем атомы, которые слишком далеко
            if (r > SIGMA * 3.0 || r == 0.0) { continue; }

            // Расчет силы Леннард-Джонса прямо на GPU
            let sr = SIGMA / r;
            let sr6 = sr * sr * sr * sr * sr * sr;
            let sr12 = sr6 * sr6;
            let fMag = (24.0 * EPSILON / r) * (2.0 * sr12 - sr6);

            force.x -= (fMag * dx) / r;
            force.y -= (fMag * dy) / r;
          }

          // Интегрирование (Обновление скорости и позиции)
          p1.vel.x += (force.x / p1.mass) * DT;
          p1.vel.y += (force.y / p1.mass) * DT;
          
          // Термостат (микро-трение)
          p1.vel.x *= 0.99;
          p1.vel.y *= 0.99;

          p1.pos.x += p1.vel.x * DT;
          p1.pos.y += p1.vel.y * DT;

          // Отскок от стен (условно 800x600, в реале передается через Uniforms)
          if (p1.pos.x < p1.radius) { p1.pos.x = p1.radius; p1.vel.x *= -1.0; }
          if (p1.pos.x > 800.0 - p1.radius) { p1.pos.x = 800.0 - p1.radius; p1.vel.x *= -1.0; }
          if (p1.pos.y < p1.radius) { p1.pos.y = p1.radius; p1.vel.y *= -1.0; }
          if (p1.pos.y > 600.0 - p1.radius) { p1.pos.y = 600.0 - p1.radius; p1.vel.y *= -1.0; }

          // Записываем результат обратно в память видеокарты
          particles[i] = p1;
        }
      `;

      const shaderModule = this.device.createShaderModule({ code: shaderCode });
      
      this.computePipeline = await this.device.createComputePipelineAsync({
        layout: 'auto',
        compute: {
          module: shaderModule,
          entryPoint: 'main',
        },
      });

      console.log('✅ WebGPU Compute Pipeline успешно инициализирован!');
      return true;
    } catch (e) {
      console.error('Ошибка инициализации WebGPU:', e);
      return false;
    }
  }

  isSupported(): boolean {
    return this.device !== null;
  }
}
