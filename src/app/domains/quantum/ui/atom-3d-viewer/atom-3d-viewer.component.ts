import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, input, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { AtomState } from '../../models/atom.model';

@Component({
  selector: 'app-atom-3d-viewer',
  standalone: true,
  template: `
    <div class="relative w-full h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
      <div #canvasContainer class="absolute inset-0"></div>
      
      <div class="absolute bottom-4 left-4 text-slate-400 text-xs font-mono bg-slate-900/80 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-slate-700">
        <span class="text-rose-400">● Протоны</span> | 
        <span class="text-slate-400">● Нейтроны</span> | 
        <span class="text-cyan-400">● Электроны</span>
      </div>
    </div>
  `
})
export class Atom3DViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;
  
  atomState = input.required<AtomState>();
  
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animationFrameId?: number;

  private nucleusGroup!: THREE.Group;
  private electronGroup!: THREE.Group;
  private orbitsGroup!: THREE.Group;

  private protonMaterial = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.4, metalness: 0.1 });
  private neutronMaterial = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6, metalness: 0.1 });
  private electronMaterial = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
  private orbitMaterial = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.5 });

  constructor() {
    effect(() => {
      const state = this.atomState();
      if (this.isBrowser && this.scene) {
        this.updateAtomModel(state);
      }
    });
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;
    this.initThreeJs();
    this.updateAtomModel(this.atomState());
    this.animate();
  }

  ngOnDestroy() {
    if (!this.isBrowser) return;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.renderer) {
      this.renderer.dispose();
      this.canvasContainer.nativeElement.removeChild(this.renderer.domElement);
    }
  }

  private initThreeJs() {
    const container = this.canvasContainer.nativeElement;
    
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x020617, 0.02);

    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.z = 25;
    this.camera.position.y = 10;
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(10, 10, 10);
    this.scene.add(pointLight);

    // Groups
    this.nucleusGroup = new THREE.Group();
    this.electronGroup = new THREE.Group();
    this.orbitsGroup = new THREE.Group();
    
    this.scene.add(this.nucleusGroup);
    this.scene.add(this.electronGroup);
    this.scene.add(this.orbitsGroup);

    // Resize handler
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private updateAtomModel(state: AtomState) {
    // Clear existing
    this.nucleusGroup.clear();
    this.electronGroup.clear();
    this.orbitsGroup.clear();

    const sphereGeo = new THREE.SphereGeometry(0.6, 32, 32);
    const electronGeo = new THREE.SphereGeometry(0.2, 16, 16);

    // Build Nucleus (Protons & Neutrons packed together)
    const totalNucleons = state.protons + state.neutrons;
    const particles = [];
    
    for (let i = 0; i < state.protons; i++) particles.push('p');
    for (let i = 0; i < state.neutrons; i++) particles.push('n');
    
    // Shuffle for random packing
    particles.sort(() => Math.random() - 0.5);

    particles.forEach((type, i) => {
      const mesh = new THREE.Mesh(sphereGeo, type === 'p' ? this.protonMaterial : this.neutronMaterial);
      
      // Simple spherical packing approximation
      const phi = Math.acos(-1 + (2 * i) / totalNucleons);
      const theta = Math.sqrt(totalNucleons * Math.PI) * phi;
      const radius = Math.cbrt(totalNucleons) * 0.5; // Scale radius based on count

      mesh.position.setFromSphericalCoords(radius, phi, theta);
      
      // Add slight random jitter
      mesh.position.x += (Math.random() - 0.5) * 0.2;
      mesh.position.y += (Math.random() - 0.5) * 0.2;
      mesh.position.z += (Math.random() - 0.5) * 0.2;

      this.nucleusGroup.add(mesh);
    });

    // Build Electrons and Orbits (Bohr model approximation for visual clarity)
    // Shell 1 (n=1): max 2 electrons. Radius: 5
    // Shell 2 (n=2): max 8 electrons. Radius: 10
    
    const shells = [
      { max: 2, radius: 6, speed: 0.02 },
      { max: 8, radius: 11, speed: 0.015 }
    ];

    let remainingElectrons = state.electrons;
    
    shells.forEach((shell, shellIndex) => {
      const electronsInShell = Math.min(remainingElectrons, shell.max);
      if (electronsInShell > 0) {
        // Draw Orbit
        const orbitGeo = new THREE.RingGeometry(shell.radius - 0.05, shell.radius + 0.05, 64);
        const orbitMesh = new THREE.Mesh(orbitGeo, this.orbitMaterial);
        orbitMesh.rotation.x = Math.PI / 2;
        this.orbitsGroup.add(orbitMesh);

        // Add Electrons
        const shellGroup = new THREE.Group();
        // Add custom property for animation
        shellGroup.userData = { speed: shell.speed * (shellIndex % 2 === 0 ? 1 : -1) };

        for (let i = 0; i < electronsInShell; i++) {
          const angle = (i / electronsInShell) * Math.PI * 2;
          const electron = new THREE.Mesh(electronGeo, this.electronMaterial);
          electron.position.set(Math.cos(angle) * shell.radius, 0, Math.sin(angle) * shell.radius);
          
          // Add glow
          const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.4 });
          const glow = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), glowMaterial);
          electron.add(glow);

          shellGroup.add(electron);
        }
        
        // Tilt the shell slightly for 3D effect
        shellGroup.rotation.x = (Math.random() - 0.5) * 0.5;
        shellGroup.rotation.z = (Math.random() - 0.5) * 0.5;
        
        this.electronGroup.add(shellGroup);
        remainingElectrons -= electronsInShell;
      }
    });
  }

  private animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    // Rotate nucleus slowly
    this.nucleusGroup.rotation.y += 0.005;
    this.nucleusGroup.rotation.x += 0.002;

    // Rotate electron shells
    this.electronGroup.children.forEach(shell => {
      shell.rotation.y += shell.userData['speed'];
    });

    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize() {
    if (!this.camera || !this.renderer || !this.canvasContainer) return;
    const container = this.canvasContainer.nativeElement;
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }
}
