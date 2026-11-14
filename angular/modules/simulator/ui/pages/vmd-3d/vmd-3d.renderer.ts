import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { computeRepulsion, applySprings, integrateParticles } from '@root-modules/simulator/vmd-3d.physics';
import { createVmdScene } from '@root-modules/simulator/vmd-3d.scene';
import { ATOM_COLORS } from '@root-modules/simulator/vmd-3d.colors';
import { Molecule } from '@root-modules/architecture/models';
import { Vmd3dVisualModes } from './vmd-3d.visual-modes';

export type RenderMode = 'lines' | 'ball-stick' | 'space-fill';

/**
 * VMD-3D renderer: Three.js scene, particle physics, bond/label rendering.
 * Extracted from component to keep it under max-lines and testable.
 */
export class Vmd3dRenderer {
  readonly boxSize: number;

  // Physics state
  particleCount = 0;
  bondCount = 0;
  positions!: Float32Array;
  velocities!: Float32Array;
  private forces!: Float32Array;
  bondPairs: number[] = [];

  // Three.js
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  controls!: OrbitControls;
  private instancedMesh!: THREE.InstancedMesh;
  private bondsLines!: THREE.LineSegments;
  private dummy = new THREE.Object3D();
  private colorObj = new THREE.Color();
  private visualModes!: Vmd3dVisualModes;
  private currentSymbols: string[] = [];

  renderMode: RenderMode = 'lines';
  showLabels = false;

  constructor(boxSize = 40) {
    this.boxSize = boxSize;
  }

  init(canvas: HTMLCanvasElement): void {
    const created = createVmdScene(canvas, this.boxSize);
    this.scene = created.scene;
    this.camera = created.camera;
    this.renderer = created.renderer;
    this.controls = created.controls;
    this.visualModes = new Vmd3dVisualModes(this.scene);
  }

  dispose(): void {
    if (this.visualModes) this.visualModes.dispose();
    if (this.renderer) this.renderer.dispose();
  }

  onResize(parent: HTMLElement): void {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = parent.clientWidth / parent.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(parent.clientWidth, parent.clientHeight);
  }

  private setupBuffers(count: number): void {
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

  private setupBondsBuffer(bondCount: number): void {
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
      if (this.visualModes) this.visualModes.setBondsLines(this.bondsLines);
    }
  }

  resetGas(): void {
    this.setupBuffers(500);
    this.setupBondsBuffer(0);
    this.bondPairs = [];
    this.currentSymbols = new Array(500).fill('Ar');

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

  loadMolecule(molecule: Molecule, _name: string): void {
    const atoms = molecule.atoms;
    const bonds = molecule.bonds;
    this.currentSymbols = atoms.map(a => a.symbol);
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
      const i1 = atoms.indexOf(bond.atomA);
      const i2 = atoms.indexOf(bond.atomB);
      if (i1 !== -1 && i2 !== -1) {
        this.bondPairs.push(i1, i2);
      }
    }

    this.updateInstancedMesh();
  }

  setRenderMode(mode: RenderMode): void {
    this.renderMode = mode;
    this.applyRenderMode();
  }

  setShowLabels(show: boolean): void {
    this.showLabels = show;
    this.applyRenderMode();
  }

  private applyRenderMode(): void {
    if (!this.visualModes) return;
    this.visualModes.setSymbols(this.currentSymbols);
    this.visualModes.apply(this.renderMode, this.showLabels, this.positions, this.bondPairs, this.particleCount, this.dummy, this.instancedMesh);
  }

  updatePhysics(dt: number): number {
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
    return integrateParticles(pos, vel, f, n, dt, isMolecule, this.boxSize, friction);
  }

  updateInstancedMesh(): void {
    for (let i = 0; i < this.particleCount; i++) {
      this.dummy.position.set(this.positions[i * 3], this.positions[i * 3 + 1], this.positions[i * 3 + 2]);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  updateBondsMesh(): void {
    if (this.visualModes) {
      this.visualModes.updateBondsMesh(this.renderMode, this.showLabels, this.positions, this.bondPairs);
    }
  }

  render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
