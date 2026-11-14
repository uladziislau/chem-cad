export function computeRepulsion(positions: Float32Array, forces: Float32Array, count: number, repulsionK: number): void {
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    for (let j = i + 1; j < count; j++) {
      const j3 = j * 3;
      const dx = positions[j3] - positions[i3];
      const dy = positions[j3 + 1] - positions[i3 + 1];
      const dz = positions[j3 + 2] - positions[i3 + 2];
      const rSq = dx * dx + dy * dy + dz * dz;

      if (rSq > 0.1 && rSq < 100) {
        const forceMag = repulsionK / rSq;
        const r = Math.sqrt(rSq);
        const fx = (forceMag * dx) / r;
        const fy = (forceMag * dy) / r;
        const fz = (forceMag * dz) / r;

        forces[i3] -= fx;
        forces[i3 + 1] -= fy;
        forces[i3 + 2] -= fz;
        forces[j3] += fx;
        forces[j3 + 1] += fy;
        forces[j3 + 2] += fz;
      }
    }
  }
}

export function applySprings(positions: Float32Array, forces: Float32Array, bondPairs: number[], springK: number, restLength: number): void {
  for (let b = 0; b < bondPairs.length; b += 2) {
    const i = bondPairs[b];
    const j = bondPairs[b + 1];
    const i3 = i * 3;
    const j3 = j * 3;

    const dx = positions[j3] - positions[i3];
    const dy = positions[j3 + 1] - positions[i3 + 1];
    const dz = positions[j3 + 2] - positions[i3 + 2];
    const r = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (r > 0.1) {
      const forceMag = springK * (r - restLength);
      const fx = (forceMag * dx) / r;
      const fy = (forceMag * dy) / r;
      const fz = (forceMag * dz) / r;

      forces[i3] += fx;
      forces[i3 + 1] += fy;
      forces[i3 + 2] += fz;
      forces[j3] -= fx;
      forces[j3 + 1] -= fy;
      forces[j3 + 2] -= fz;
    }
  }
}

export function integrateParticles(
  positions: Float32Array,
  velocities: Float32Array,
  forces: Float32Array,
  count: number,
  dt: number,
  isMolecule: boolean,
  boxSize: number,
  friction: number
): number {
  let kineticEnergy = 0;
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    if (isMolecule) {
      const center = boxSize / 2;
      forces[i3] += (center - positions[i3]) * 1.0;
      forces[i3 + 1] += (center - positions[i3 + 1]) * 1.0;
      forces[i3 + 2] += (center - positions[i3 + 2]) * 1.0;
    }

    velocities[i3] += forces[i3] * dt;
    velocities[i3 + 1] += forces[i3 + 1] * dt;
    velocities[i3 + 2] += forces[i3 + 2] * dt;

    velocities[i3] *= friction;
    velocities[i3 + 1] *= friction;
    velocities[i3 + 2] *= friction;

    positions[i3] += velocities[i3] * dt;
    positions[i3 + 1] += velocities[i3 + 1] * dt;
    positions[i3 + 2] += velocities[i3 + 2] * dt;

    const r = 1.0;
    if (positions[i3] < r) { positions[i3] = r; velocities[i3] *= -1; }
    else if (positions[i3] > boxSize - r) { positions[i3] = boxSize - r; velocities[i3] *= -1; }
    if (positions[i3 + 1] < r) { positions[i3 + 1] = r; velocities[i3 + 1] *= -1; }
    else if (positions[i3 + 1] > boxSize - r) { positions[i3 + 1] = boxSize - r; velocities[i3 + 1] *= -1; }
    if (positions[i3 + 2] < r) { positions[i3 + 2] = r; velocities[i3 + 2] *= -1; }
    else if (positions[i3 + 2] > boxSize - r) { positions[i3 + 2] = boxSize - r; velocities[i3 + 2] *= -1; }

    kineticEnergy += 0.5 * (velocities[i3] * velocities[i3] + velocities[i3 + 1] * velocities[i3 + 1] + velocities[i3 + 2] * velocities[i3 + 2]);
  }
  return kineticEnergy;
}
