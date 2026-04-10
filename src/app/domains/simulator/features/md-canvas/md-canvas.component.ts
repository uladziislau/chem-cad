import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MolecularDynamicsEngine } from '../../../architecture/models';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
}

@Component({
  selector: 'app-md-canvas',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="h-full flex flex-col bg-slate-900 text-slate-100">
      <div class="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
            <mat-icon>waves</mat-icon>
            Visual Molecular Dynamics (VMD)
          </h1>
          <p class="text-slate-400 mt-1">
            Рендеринг Ван-дер-Ваальсовых сил в реальном времени (Потенциал Леннард-Джонса)
          </p>
        </div>
        
        <div class="flex gap-3">
          <button 
            (click)="toggleSimulation()"
            [class]="isRunning() ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'"
            class="px-4 py-2 border rounded-lg font-medium flex items-center gap-2 transition-colors hover:bg-opacity-30">
            <mat-icon>{{ isRunning() ? 'pause' : 'play_arrow' }}</mat-icon>
            {{ isRunning() ? 'Пауза' : 'Запуск' }}
          </button>
          <button 
            (click)="reset()"
            class="px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2">
            <mat-icon>refresh</mat-icon>
            Сброс
          </button>
        </div>
      </div>

      <div class="flex-1 p-6 flex gap-6 overflow-hidden">
        <!-- Canvas Container -->
        <div class="flex-1 bg-black rounded-2xl border border-slate-800 overflow-hidden relative shadow-2xl shadow-indigo-900/20">
          <canvas #mdCanvas class="w-full h-full block"></canvas>
          
          <!-- Overlay Stats -->
          <div class="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 p-3 rounded-lg font-mono text-xs text-slate-300">
            <div>FPS: <span class="text-emerald-400">{{ fps() }}</span></div>
            <div>Атомов (Ar): <span class="text-indigo-400">{{ particles.length }}</span></div>
            <div>Температура: <span class="text-rose-400">{{ temperature().toFixed(1) }} K</span></div>
          </div>
        </div>

        <!-- Controls Sidebar -->
        <div class="w-80 flex flex-col gap-6 overflow-y-auto pr-2">
          <div class="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
            <h3 class="font-bold text-slate-200 mb-4 flex items-center gap-2">
              <mat-icon class="text-indigo-400 text-sm">tune</mat-icon>
              Параметры Леннард-Джонса
            </h3>
            
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Глубина ямы (ε)</span>
                  <span>{{ epsilon().toFixed(1) }}</span>
                </div>
                <input type="range" min="10" max="500" [value]="epsilon()" (input)="updateEpsilon($event)" class="w-full accent-indigo-500">
                <p class="text-[10px] text-slate-500 mt-1">Определяет силу притяжения (конденсация)</p>
              </div>
              
              <div>
                <div class="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Радиус (σ)</span>
                  <span>{{ sigma() }} px</span>
                </div>
                <input type="range" min="10" max="100" [value]="sigma()" (input)="updateSigma($event)" class="w-full accent-indigo-500">
                <p class="text-[10px] text-slate-500 mt-1">Определяет размер атома (отталкивание)</p>
              </div>
            </div>
          </div>

          <div class="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
            <h3 class="font-bold text-slate-200 mb-4 flex items-center gap-2">
              <mat-icon class="text-rose-400 text-sm">thermostat</mat-icon>
              Термостат
            </h3>
            
            <div class="space-y-4">
              <button 
                (click)="heatUp()"
                class="w-full py-2 bg-rose-500/20 text-rose-400 border border-rose-500/50 rounded-lg hover:bg-rose-500/30 transition-colors text-sm font-medium">
                Нагреть (Кипение)
              </button>
              <button 
                (click)="coolDown()"
                class="w-full py-2 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium">
                Охладить (Конденсация)
              </button>
            </div>
          </div>
          
          <div class="bg-indigo-900/20 p-5 rounded-xl border border-indigo-500/30 text-sm text-indigo-200">
            <p class="mb-2"><b>Эмерджентность в действии:</b></p>
            <p class="text-xs opacity-80">
              Атомы не знают о существовании друг друга. Они лишь подчиняются математической формуле Леннард-Джонса. 
              При охлаждении вы увидите, как они <b>самоорганизуются</b> в каплю жидкости или кристалл.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MdCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mdCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId = 0;
  private lastTime = 0;
  
  // State
  isRunning = signal(false);
  fps = signal(0);
  temperature = signal(0);
  
  // Physics Parameters
  epsilon = signal(150); // Сила притяжения (масштабировано для Canvas)
  sigma = signal(30);    // Размер атома (масштабировано для Canvas)
  
  particles: Particle[] = [];
  
  ngAfterViewInit() {
    this.initCanvas();
    this.reset();
    
    // Handle resize
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onResize);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private onResize = () => {
    this.initCanvas();
  };

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
    this.ctx = canvas.getContext('2d')!;
  }

  reset() {
    const canvas = this.canvasRef.nativeElement;
    this.particles = [];
    
    // Создаем 100 атомов Аргона со случайными позициями
    for (let i = 0; i < 100; i++) {
      this.particles.push({
        id: i,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 100, // Начальная скорость (температура)
        vy: (Math.random() - 0.5) * 100,
        mass: 1,
        radius: this.sigma() / 2,
        color: '#818cf8' // Indigo-400
      });
    }
    
    if (!this.isRunning()) {
      this.draw();
    }
  }

  toggleSimulation() {
    this.isRunning.set(!this.isRunning());
    if (this.isRunning()) {
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    } else {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  updateEpsilon(event: Event) {
    this.epsilon.set(parseFloat((event.target as HTMLInputElement).value));
  }

  updateSigma(event: Event) {
    this.sigma.set(parseFloat((event.target as HTMLInputElement).value));
    this.particles.forEach(p => p.radius = this.sigma() / 2);
  }

  heatUp() {
    this.particles.forEach(p => {
      p.vx *= 1.5;
      p.vy *= 1.5;
    });
  }

  coolDown() {
    this.particles.forEach(p => {
      p.vx *= 0.5;
      p.vy *= 0.5;
    });
  }

  private loop(timestamp: number) {
    if (!this.isRunning()) return;

    const dt = (timestamp - this.lastTime) / 1000; // в секундах
    this.lastTime = timestamp;
    
    // Ограничиваем dt, чтобы физика не "взрывалась" при лагах
    const safeDt = Math.min(dt, 0.032); 

    this.updatePhysics(safeDt);
    this.draw();
    
    // Calculate FPS
    this.fps.set(Math.round(1 / dt));

    this.animationFrameId = requestAnimationFrame((ts) => this.loop(ts));
  }

  private updatePhysics(dt: number) {
    const canvas = this.canvasRef.nativeElement;
    const eps = this.epsilon();
    const sig = this.sigma();
    
    let totalKineticEnergy = 0;

    // 1. Рассчитываем силы взаимодействия (O(N^2) - наивный подход для демо)
    // В реальном движке здесь используется Cell Lists или Verlet Lists
    const forces = new Array(this.particles.length).fill(0).map(() => ({ fx: 0, fy: 0 }));

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const rSq = dx * dx + dy * dy;
        const r = Math.sqrt(rSq);

        // Оптимизация: не считаем силу, если атомы слишком далеко (Cutoff radius)
        if (r > sig * 3) continue;

        // Используем наш математический движок!
        // Сила F = -dV/dr. (Положительная = отталкивание, Отрицательная = притяжение)
        const forceMagnitude = MolecularDynamicsEngine.calculateLennardJonesForce(r, eps, sig);
        
        // Проекция силы на оси X и Y
        const fx = (forceMagnitude * dx) / r;
        const fy = (forceMagnitude * dy) / r;

        forces[i].fx -= fx; // 3-й закон Ньютона
        forces[i].fy -= fy;
        forces[j].fx += fx;
        forces[j].fy += fy;
      }
    }

    // 2. Интегрирование (Обновление скоростей и позиций)
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const f = forces[i];

      // a = F/m
      const ax = f.fx / p.mass;
      const ay = f.fy / p.mass;

      // v = v + a*dt
      p.vx += ax * dt;
      p.vy += ay * dt;
      
      // Добавляем микро-трение (термостат), чтобы система стабилизировалась
      p.vx *= 0.99;
      p.vy *= 0.99;

      // p = p + v*dt
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // 3. Столкновения со стенами (отскок)
      if (p.x < p.radius) { p.x = p.radius; p.vx *= -1; }
      if (p.x > canvas.width - p.radius) { p.x = canvas.width - p.radius; p.vx *= -1; }
      if (p.y < p.radius) { p.y = p.radius; p.vy *= -1; }
      if (p.y > canvas.height - p.radius) { p.y = canvas.height - p.radius; p.vy *= -1; }
      
      // Считаем кинетическую энергию для температуры (E_k = mv^2 / 2)
      totalKineticEnergy += 0.5 * p.mass * (p.vx * p.vx + p.vy * p.vy);
    }
    
    // Температура пропорциональна средней кинетической энергии
    this.temperature.set(totalKineticEnergy / this.particles.length);
  }

  private draw() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем атомы
    for (const p of this.particles) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      
      // Свечение (Ван-дер-Ваальсов радиус)
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 1.5);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(0.6, p.color + '80'); // 50% opacity
      gradient.addColorStop(1, 'transparent');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }
  }
}
