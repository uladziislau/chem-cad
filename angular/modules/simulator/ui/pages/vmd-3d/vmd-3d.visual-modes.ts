import * as THREE from 'three';
import { BondRenderer, AtomLabelRenderer } from '@root-modules/simulator/vmd-3d.bonds';
import { RenderMode } from './vmd-3d.renderer';

/**
 * Handles visual modes: line bonds, ball-and-stick cylinders, atom labels, space-fill scaling.
 */
export class Vmd3dVisualModes {
  private bondRenderer: BondRenderer | null = null;
  private labelRenderer: AtomLabelRenderer | null = null;
  private bondsLines: THREE.LineSegments | null = null;
  private currentSymbols: string[] = [];

  constructor(private scene: THREE.Scene) {}

  setBondsLines(lines: THREE.LineSegments | null): void {
    this.bondsLines = lines;
  }

  setSymbols(symbols: string[]): void {
    this.currentSymbols = symbols;
  }

  get bondRendererInstance(): BondRenderer | null {
    return this.bondRenderer;
  }

  apply(mode: RenderMode, showLabels: boolean, positions: Float32Array, bondPairs: number[], particleCount: number, dummy: THREE.Object3D, instancedMesh: THREE.InstancedMesh): void {
    this.updateBonds(mode, positions, bondPairs);
    this.updateLabels(showLabels, positions);
    this.applyAtomScaling(mode, positions, particleCount, dummy, instancedMesh);
  }

  private updateBonds(mode: RenderMode, positions: Float32Array, bondPairs: number[]): void {
    if (this.bondsLines) {
      this.bondsLines.visible = mode === 'lines';
    }
    if (!this.bondRenderer && mode === 'ball-stick') {
      this.bondRenderer = new BondRenderer(this.scene);
    }
    if (this.bondRenderer) {
      if (mode === 'ball-stick') {
        this.bondRenderer.update(positions, bondPairs, 0.15);
      } else {
        this.bondRenderer.clear();
      }
    }
  }

  private updateLabels(showLabels: boolean, positions: Float32Array): void {
    if (!this.labelRenderer && showLabels) {
      this.labelRenderer = new AtomLabelRenderer(this.scene);
      this.labelRenderer.update(positions, this.currentSymbols);
    }
    if (this.labelRenderer) {
      if (showLabels) {
        this.labelRenderer.updatePositions(positions);
      } else {
        this.labelRenderer.clear();
      }
    }
  }

  private applyAtomScaling(mode: RenderMode, positions: Float32Array, particleCount: number, dummy: THREE.Object3D, instancedMesh: THREE.InstancedMesh): void {
    if (!instancedMesh) return;
    const vdwRadii: Record<string, number> = { H: 1.2, C: 1.7, O: 1.52, N: 1.55, S: 1.8, P: 1.8, Cl: 1.75, F: 1.47, Br: 1.85, I: 1.98 };
    for (let i = 0; i < particleCount; i++) {
      const symbol = this.currentSymbols[i] ?? 'C';
      let scale: number;
      if (mode === 'space-fill') {
        scale = (vdwRadii[symbol] ?? 1.7) / 1.0;
      } else if (symbol === 'H') {
        scale = 0.6;
      } else {
        scale = 1.0;
      }
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
  }

  updateBondsMesh(mode: RenderMode, showLabels: boolean, positions: Float32Array, bondPairs: number[]): void {
    if (mode === 'lines' && this.bondsLines && bondPairs.length > 0) {
      const posArray = this.bondsLines.geometry.attributes['position'].array as Float32Array;
      let idx = 0;
      for (let b = 0; b < bondPairs.length; b += 2) {
        const i = bondPairs[b] * 3;
        const j = bondPairs[b + 1] * 3;
        posArray[idx++] = positions[i];
        posArray[idx++] = positions[i + 1];
        posArray[idx++] = positions[i + 2];
        posArray[idx++] = positions[j];
        posArray[idx++] = positions[j + 1];
        posArray[idx++] = positions[j + 2];
      }
      this.bondsLines.geometry.attributes['position'].needsUpdate = true;
    }

    if (mode === 'ball-stick' && this.bondRenderer && bondPairs.length > 0) {
      this.bondRenderer.update(positions, bondPairs, 0.15);
    }

    if (showLabels && this.labelRenderer) {
      this.labelRenderer.updatePositions(positions);
    }
  }

  dispose(): void {
    if (this.bondRenderer) this.bondRenderer.dispose();
    if (this.labelRenderer) this.labelRenderer.dispose();
  }
}
