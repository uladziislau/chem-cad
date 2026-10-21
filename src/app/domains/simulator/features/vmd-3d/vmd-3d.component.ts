import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal, HostListener, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ChemEventBusService, SystemEventType, SystemEvent } from '../../../architecture/services/chem-event-bus.service';
import { Molecule, Atom } from '../../../architecture/models';
import { Subscription } from 'rxjs';
import { computeRepulsion, applySprings, integrateParticles } from './vmd-3d.physics';
import { createVmdScene } from './vmd-3d.scene';
import { ATOM_COLORS } from './vmd-3d.colors';


@Component({
  selector: 'app-vmd-3d',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './vmd-3d.component.html',
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
    const created = createVmdScene(canvas, this.boxSize);
    this.scene = created.scene;
    this.camera = created.camera;
    this.renderer = created.renderer;
    this.controls = created.controls;
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
    const repulsionK = isMolecule ? 50.0 : 100.0;
    computeRepulsion(pos, f, n, repulsionK);

    const springK = 200.0;
    const restLength = 2.5;
    applySprings(pos, f, this.bondPairs, springK, restLength);

    const friction = isMolecule ? 0.85 : 0.99;
    const kineticEnergy = integrateParticles(pos, vel, f, n, dt, isMolecule, this.boxSize, friction);

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
