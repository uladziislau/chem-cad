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
  templateUrl: './md-canvas.component.html',
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
