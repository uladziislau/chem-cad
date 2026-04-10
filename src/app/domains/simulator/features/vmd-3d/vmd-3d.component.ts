import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal, HostListener, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ChemEventBusService, SystemEventType, SystemEvent } from '../../../architecture/services/chem-event-bus.service';
import { Molecule, Atom } from '../../../architecture/models';
import { Subscription } from 'rxjs';

const ATOM_COLORS: Record<string, number> = {
  'H': 0xffffff,
  'C': 0x808080,
  'O': 0xff0000,
  'N': 0x0000ff,
  'S': 0xffff00,
  'P': 0xffa500,
  'Cl': 0x00ff00,
  'F': 0x00ffff,
  'Br': 0x8b0000,
  'I': 0x9400d3,
  'DEFAULT': 0x818cf8
};

@Component({
  selector: 'app-vmd-3d',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
      <div class="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex justify-between items-center z-10">
        <div>
          <h1 class="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
            <mat-icon>view_in_ar</mat-icon>
            VMD 3D: Минимизация Энергии
          </h1>
          <p class="text-xs text-slate-400 mt-1">
            Сгенерируйте молекулу в песочнице, и она появится здесь для 3D-фолдинга!
          </p>
        </div>
        
        <div class="flex gap-3">
          <button 
            (click)="toggleSimulation()"
            [class]="isRunning() ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'"
            class="px-4 py-2 border rounded-lg font-medium flex items-center gap-2 transition-colors hover:bg-opacity-30 text-sm">
            <mat-icon class="text-sm">{{ isRunning() ? 'pause' : 'play_arrow' }}</mat-icon>
            {{ isRunning() ? 'Пауза' : 'Запуск' }}
          </button>
          <button 
            (click)="resetGas()"
            class="px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm">
            <mat-icon class="text-sm">science</mat-icon>
            Газ (Аргон)
          </button>
        </div>
      </div>

      <div class="flex-1 relative overflow-hidden">
        <canvas #canvas3d class="w-full h-full block outline-none"></canvas>
        
        <div class="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 p-4 rounded-xl font-mono text-xs text-slate-300 shadow-xl pointer-events-none">
          <div class="text-slate-400 mb-2 border-b border-slate-700 pb-2">Телеметрия</div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-2">
            <span>FPS:</span> <span [class]="fps() > 30 ? 'text-emerald-400' : 'text-rose-400'">{{ fps() }}</span>
            <span>Атомов:</span> <span class="text-indigo-400">{{ particleCount }}</span>
            <span>Связей:</span> <span class="text-fuchsia-400">{{ bondCount }}</span>
            <span>Температура:</span> <span class="text-orange-400">{{ temperature().toFixed(1) }} K</span>
          </div>
          @if (currentMoleculeName()) {
            <div class="mt-2 pt-2 border-t border-slate-700 text-emerald-400">
              Молекула: {{ currentMoleculeName() }}
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class Vmd3dComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas3d') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  isRunning = signal(true);
  fps = signal(0);
  temperature = signal(0);
  currentMoleculeName = signal<string>('');
  
  particleCount = 0;
  bondCount = 0;
  readonly boxSize = 40;
  
  // Physics Arrays
  private positions!: Float32Array;
  private velocities!: Float32Array;
  private forces!: Float32Array;
  private bondPairs: number[] = []; // [i1, j1, i2, j2, ...]
  
  // Three.js
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private instancedMesh!: THREE.InstancedMesh;
  private bondsLines!: THREE.LineSegments;
  private dummy = new THREE.Object3D();
  private colorObj = new THREE.Color();
  
  private animationFrameId = 0;
  private lastTime = 0;
  private frames = 0;
  private lastFpsTime = 0;
  
  private subs: Subscription = new Subscription();
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private eventBus = inject(ChemEventBusService);

  ngAfterViewInit() {
    if (!this.isBrowser) return; // Защита от SSR (Server-Side Rendering)

    this.initThreeJs();
    this.resetGas(); // По умолчанию запускаем газ
    
    // Подписываемся на Шину Событий (Event Bus)
    this.subs.add(
      this.eventBus.on<unknown>(SystemEventType.MOLECULE_PARSED).subscribe((event: SystemEvent<unknown>) => {
        const payload = event.payload as { molecule: Molecule, smiles: string };
        this.loadMolecule(payload.molecule, payload.smiles);
      })
    );

    this.lastTime = performance.now();
    this.lastFpsTime = this.lastTime;
    this.loop(this.lastTime);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    if (this.isBrowser) {
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      if (this.renderer) this.renderer.dispose();
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (!this.isBrowser || !this.camera || !this.renderer) return;
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    if (parent) {
      this.camera.aspect = parent.clientWidth / parent.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(parent.clientWidth, parent.clientHeight);
    }
  }

  private initThreeJs() {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#020617');
    this.scene.fog = new THREE.FogExp2('#020617', 0.015);

    this.camera = new THREE.PerspectiveCamera(45, parent.clientWidth / parent.clientHeight, 0.1, 1000);
    this.camera.position.set(this.boxSize * 1.5, this.boxSize * 1.5, this.boxSize * 2);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(parent.clientWidth, parent.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(this.boxSize / 2, this.boxSize / 2, this.boxSize / 2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(this.boxSize, this.boxSize * 2, this.boxSize);
    this.scene.add(dirLight);

    // Box
    const boxGeo = new THREE.BoxGeometry(this.boxSize, this.boxSize, this.boxSize);
    const boxMat = new THREE.MeshBasicMaterial({ color: 0x334155, wireframe: true, transparent: true, opacity: 0.2 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(this.boxSize / 2, this.boxSize / 2, this.boxSize / 2);
    this.scene.add(box);
  }

  private setupBuffers(count: number) {
    this.particleCount = count;
    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.forces = new Float32Array(count * 3);

    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh);
      this.instancedMesh.dispose();
    }

    const geometry = new THREE.SphereGeometry(1.0, 16, 16);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.3,
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.instancedMesh);
  }

  private setupBondsBuffer(bondCount: number) {
    this.bondCount = bondCount;
    if (this.bondsLines) {
      this.scene.remove(this.bondsLines);
      this.bondsLines.geometry.dispose();
      (this.bondsLines.material as THREE.Material).dispose();
    }

    if (bondCount > 0) {
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bondCount * 6), 3));
      const lineMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 2, transparent: true, opacity: 0.6 });
      this.bondsLines = new THREE.LineSegments(lineGeo, lineMat);
      this.scene.add(this.bondsLines);
    }
  }

  resetGas() {
    this.currentMoleculeName.set('Аргон (Газ)');
    this.setupBuffers(500);
    this.setupBondsBuffer(0);
    this.bondPairs = [];

    for (let i = 0; i < this.particleCount; i++) {
      this.positions[i * 3] = Math.random() * this.boxSize;
      this.positions[i * 3 + 1] = Math.random() * this.boxSize;
      this.positions[i * 3 + 2] = Math.random() * this.boxSize;

      this.velocities[i * 3] = (Math.random() - 0.5) * 10;
      this.velocities[i * 3 + 1] = (Math.random() - 0.5) * 10;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 10;

      this.colorObj.setHex(ATOM_COLORS['DEFAULT']);
      this.instancedMesh.setColorAt(i, this.colorObj);
    }
    
    if (this.instancedMesh.instanceColor) this.instancedMesh.instanceColor.needsUpdate = true;
    this.updateInstancedMesh();
  }

  loadMolecule(molecule: Molecule, name: string) {
    this.currentMoleculeName.set(name);
    const atoms = molecule.atoms;
    const bonds = molecule.bonds;
    
    this.setupBuffers(atoms.length);
    this.setupBondsBuffer(bonds.length);
    this.bondPairs = [];

    // Спавним атомы в центре куба в случайных позициях (сфера радиусом 5)
    const center = this.boxSize / 2;
    for (let i = 0; i < atoms.length; i++) {
      this.positions[i * 3] = center + (Math.random() - 0.5) * 10;
      this.positions[i * 3 + 1] = center + (Math.random() - 0.5) * 10;
      this.positions[i * 3 + 2] = center + (Math.random() - 0.5) * 10;

      this.velocities[i * 3] = 0;
      this.velocities[i * 3 + 1] = 0;
      this.velocities[i * 3 + 2] = 0;

      const hexColor = ATOM_COLORS[atoms[i].symbol] || ATOM_COLORS['DEFAULT'];
      this.colorObj.setHex(hexColor);
      this.instancedMesh.setColorAt(i, this.colorObj);
      
      // Масштабируем сферу в зависимости от атома (водород меньше)
      const scale = atoms[i].symbol === 'H' ? 0.6 : 1.0;
      this.dummy.scale.set(scale, scale, scale);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    if (this.instancedMesh.instanceColor) this.instancedMesh.instanceColor.needsUpdate = true;

    // Создаем связи
    for (const bond of bonds) {
      const i1 = atoms.indexOf(bond.atomA as Atom);
      const i2 = atoms.indexOf(bond.atomB as Atom);
      if (i1 !== -1 && i2 !== -1) {
        this.bondPairs.push(i1, i2);
      }
    }

    this.updateInstancedMesh();
    this.isRunning.set(true);
  }

  toggleSimulation() {
    this.isRunning.set(!this.isRunning());
  }

  private loop(timestamp: number) {
    if (!this.isBrowser) return;
    this.animationFrameId = requestAnimationFrame((ts) => this.loop(ts));

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.032);
    this.lastTime = timestamp;

    this.frames++;
    if (timestamp - this.lastFpsTime >= 1000) {
      this.fps.set(this.frames);
      this.frames = 0;
      this.lastFpsTime = timestamp;
    }

    if (this.isRunning()) {
      const subSteps = 4; // Больше саб-степов для стабильности пружин
      const subDt = dt / subSteps;
      for (let s = 0; s < subSteps; s++) {
        this.updatePhysics(subDt);
      }
      this.updateInstancedMesh();
      this.updateBondsMesh();
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private updatePhysics(dt: number) {
    const n = this.particleCount;
    const pos = this.positions;
    const vel = this.velocities;
    const f = this.forces;
    
    f.fill(0);

    const isMolecule = this.bondPairs.length > 0;
    
    // 1. Отталкивание (Ван-дер-Ваальс / Кулон)
    const repulsionK = isMolecule ? 50.0 : 100.0; 
    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      for (let j = i + 1; j < n; j++) {
        const j3 = j * 3;
        const dx = pos[j3] - pos[i3];
        const dy = pos[j3 + 1] - pos[i3 + 1];
        const dz = pos[j3 + 2] - pos[i3 + 2];
        const rSq = dx*dx + dy*dy + dz*dz;

        if (rSq > 0.1 && rSq < 100) {
          // Простое отталкивание F = k / r^2
          const forceMag = repulsionK / rSq;
          const r = Math.sqrt(rSq);
          const fx = (forceMag * dx) / r;
          const fy = (forceMag * dy) / r;
          const fz = (forceMag * dz) / r;

          f[i3] -= fx; f[i3+1] -= fy; f[i3+2] -= fz;
          f[j3] += fx; f[j3+1] += fy; f[j3+2] += fz;
        }
      }
    }

    // 2. Притяжение связей (Закон Гука)
    const springK = 200.0;
    const restLength = 2.5;
    for (let b = 0; b < this.bondPairs.length; b += 2) {
      const i = this.bondPairs[b];
      const j = this.bondPairs[b + 1];
      const i3 = i * 3;
      const j3 = j * 3;

      const dx = pos[j3] - pos[i3];
      const dy = pos[j3 + 1] - pos[i3 + 1];
      const dz = pos[j3 + 2] - pos[i3 + 2];
      const r = Math.sqrt(dx*dx + dy*dy + dz*dz);

      if (r > 0.1) {
        // F = -k * (r - r0)
        const forceMag = springK * (r - restLength);
        const fx = (forceMag * dx) / r;
        const fy = (forceMag * dy) / r;
        const fz = (forceMag * dz) / r;

        f[i3] += fx; f[i3+1] += fy; f[i3+2] += fz;
        f[j3] -= fx; f[j3+1] -= fy; f[j3+2] -= fz;
      }
    }

    // 3. Интегрирование и Термостат
    let kineticEnergy = 0;
    // Сильное трение для молекул (чтобы они успокоились и приняли форму), слабое для газа
    const friction = isMolecule ? 0.85 : 0.99; 

    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      
      // Добавляем слабую гравитацию к центру для молекулы, чтобы она не улетала
      if (isMolecule) {
        const center = this.boxSize / 2;
        f[i3] += (center - pos[i3]) * 1.0;
        f[i3+1] += (center - pos[i3+1]) * 1.0;
        f[i3+2] += (center - pos[i3+2]) * 1.0;
      }

      vel[i3] += f[i3] * dt;
      vel[i3 + 1] += f[i3 + 1] * dt;
      vel[i3 + 2] += f[i3 + 2] * dt;

      vel[i3] *= friction;
      vel[i3 + 1] *= friction;
      vel[i3 + 2] *= friction;

      pos[i3] += vel[i3] * dt;
      pos[i3 + 1] += vel[i3 + 1] * dt;
      pos[i3 + 2] += vel[i3 + 2] * dt;

      // Границы
      const r = 1.0;
      if (pos[i3] < r) { pos[i3] = r; vel[i3] *= -1; }
      else if (pos[i3] > this.boxSize - r) { pos[i3] = this.boxSize - r; vel[i3] *= -1; }
      if (pos[i3 + 1] < r) { pos[i3 + 1] = r; vel[i3 + 1] *= -1; }
      else if (pos[i3 + 1] > this.boxSize - r) { pos[i3 + 1] = this.boxSize - r; vel[i3 + 1] *= -1; }
      if (pos[i3 + 2] < r) { pos[i3 + 2] = r; vel[i3 + 2] *= -1; }
      else if (pos[i3 + 2] > this.boxSize - r) { pos[i3 + 2] = this.boxSize - r; vel[i3 + 2] *= -1; }

      kineticEnergy += 0.5 * (vel[i3]*vel[i3] + vel[i3+1]*vel[i3+1] + vel[i3+2]*vel[i3+2]);
    }

    this.temperature.set(kineticEnergy / n);
  }

  private updateInstancedMesh() {
    for (let i = 0; i < this.particleCount; i++) {
      this.dummy.position.set(this.positions[i * 3], this.positions[i * 3 + 1], this.positions[i * 3 + 2]);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  private updateBondsMesh() {
    if (!this.bondsLines || this.bondPairs.length === 0) return;
    
    const positions = this.bondsLines.geometry.attributes['position'].array as Float32Array;
    let idx = 0;
    for (let b = 0; b < this.bondPairs.length; b += 2) {
      const i = this.bondPairs[b] * 3;
      const j = this.bondPairs[b + 1] * 3;
      
      positions[idx++] = this.positions[i];
      positions[idx++] = this.positions[i+1];
      positions[idx++] = this.positions[i+2];
      
      positions[idx++] = this.positions[j];
      positions[idx++] = this.positions[j+1];
      positions[idx++] = this.positions[j+2];
    }
    this.bondsLines.geometry.attributes['position'].needsUpdate = true;
  }
}
