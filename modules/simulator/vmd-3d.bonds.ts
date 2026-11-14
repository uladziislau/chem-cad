import * as THREE from 'three';

/**
 * Управление визуализацией связей в режиме ball-and-stick.
 * Создаёт цилиндры между атомами вместо линий.
 */
export class BondRenderer {
  private cylinders: THREE.Mesh[] = [];
  private readonly material: THREE.MeshStandardMaterial;
  private readonly tempVec = new THREE.Vector3();
  private readonly tempQuat = new THREE.Quaternion();
  private readonly tempMat = new THREE.Matrix4();
  private readonly upVec = new THREE.Vector3(0, 1, 0);

  constructor(private scene: THREE.Scene) {
    this.material = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.4,
      metalness: 0.3,
      transparent: true,
      opacity: 0.8
    });
  }

  /** Перестроить цилиндры связей по текущим позициям. */
  update(positions: Float32Array, bondPairs: number[], radius = 0.15): void {
    this.clear();
    const cylinderGeo = new THREE.CylinderGeometry(radius, radius, 1, 8, 1, true);

    for (let b = 0; b < bondPairs.length; b += 2) {
      const i = bondPairs[b] * 3;
      const j = bondPairs[b + 1] * 3;

      const x1 = positions[i], y1 = positions[i + 1], z1 = positions[i + 2];
      const x2 = positions[j], y2 = positions[j + 1], z2 = positions[j + 2];

      const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (len < 0.1) continue;

      const mesh = new THREE.Mesh(cylinderGeo, this.material);

      // Позиция — середина связи
      mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);

      // Ориентация — от атома i к атому j
      this.tempVec.set(dx / len, dy / len, dz / len);
      this.tempQuat.setFromUnitVectors(this.upVec, this.tempVec);
      mesh.quaternion.copy(this.tempQuat);

      // Масштаб — длина связи
      mesh.scale.set(1, len, 1);

      this.scene.add(mesh);
      this.cylinders.push(mesh);
    }
  }

  /** Удалить все цилиндры. */
  clear(): void {
    for (const mesh of this.cylinders) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    }
    this.cylinders = [];
  }

  dispose(): void {
    this.clear();
    this.material.dispose();
  }
}

/**
 * Подписи атомов (sprite text).
 */
export class AtomLabelRenderer {
  private sprites: THREE.Sprite[] = [];
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private scene: THREE.Scene) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 64;
    this.canvas.height = 64;
    this.ctx = this.canvas.getContext('2d')!;
  }

  /** Создать/обновить подписи для всех атомов. */
  update(positions: Float32Array, symbols: string[], scale = 2.5): void {
    this.clear();
    for (let i = 0; i < symbols.length; i++) {
      const sprite = this.createLabelSprite(symbols[i]);
      sprite.position.set(
        positions[i * 3],
        positions[i * 3 + 1] + scale * 0.8,
        positions[i * 3 + 2]
      );
      this.scene.add(sprite);
      this.sprites.push(sprite);
    }
  }

  /** Обновить позиции существующих подписей. */
  updatePositions(positions: Float32Array, scale = 2.5): void {
    for (let i = 0; i < this.sprites.length; i++) {
      this.sprites[i].position.set(
        positions[i * 3],
        positions[i * 3 + 1] + scale * 0.8,
        positions[i * 3 + 2]
      );
    }
  }

  private createLabelSprite(text: string): THREE.Sprite {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Фон
    ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
    ctx.fill();

    // Текст
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `bold ${size * 0.5}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 2, 1);
    return sprite;
  }

  clear(): void {
    for (const sprite of this.sprites) {
      this.scene.remove(sprite);
      (sprite.material as THREE.SpriteMaterial).map?.dispose();
      (sprite.material as THREE.SpriteMaterial).dispose();
    }
    this.sprites = [];
  }

  dispose(): void {
    this.clear();
  }
}
