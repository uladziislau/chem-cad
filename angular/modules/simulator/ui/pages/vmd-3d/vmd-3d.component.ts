import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal, HostListener, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChemEventBusService, SystemEventType, SystemEvent } from '@modules/architecture/services/chem-event-bus.service';
import { Molecule } from '@root-modules/architecture/models';
import { Subscription } from 'rxjs';
import { Vmd3dRenderer, RenderMode } from './vmd-3d.renderer';

@Component({
  selector: 'app-vmd-3d',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vmd-3d.component.html',
})
export class Vmd3dComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas3d') canvasRef!: ElementRef<HTMLCanvasElement>;

  isRunning = signal(true);
  renderMode = signal<RenderMode>('lines');
  showLabels = signal(false);
  fps = signal(0);
  temperature = signal(0);
  currentMoleculeName = signal<string>('');

  private renderer!: Vmd3dRenderer;

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

    this.renderer = new Vmd3dRenderer(40);
    this.renderer.init(this.canvasRef.nativeElement);
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
    if (this.isBrowser && this.renderer) {
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      this.renderer.dispose();
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (!this.isBrowser || !this.renderer) return;
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    if (parent) {
      this.renderer.onResize(parent);
    }
  }

  resetGas() {
    this.currentMoleculeName.set('Аргон (Газ)');
    this.renderer.resetGas();
  }

  loadMolecule(molecule: Molecule, name: string) {
    this.currentMoleculeName.set(name);
    this.renderer.loadMolecule(molecule, name);
    this.isRunning.set(true);
  }

  toggleSimulation() {
    this.isRunning.set(!this.isRunning());
  }

  setRenderMode(mode: RenderMode) {
    this.renderMode.set(mode);
    this.renderer.setRenderMode(mode);
  }

  toggleLabels() {
    this.showLabels.set(!this.showLabels());
    this.renderer.setShowLabels(this.showLabels());
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
        const kineticEnergy = this.renderer.updatePhysics(subDt);
        this.temperature.set(kineticEnergy / this.renderer.particleCount);
      }
      this.renderer.updateInstancedMesh();
      this.renderer.updateBondsMesh();
    }

    this.renderer.render();
  }
}
