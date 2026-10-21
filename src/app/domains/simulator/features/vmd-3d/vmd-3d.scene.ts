import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface VmdScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
}

export function createVmdScene(canvas: HTMLCanvasElement, boxSize: number): VmdScene {
  const parent = canvas.parentElement!;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#020617');
  scene.fog = new THREE.FogExp2('#020617', 0.015);

  const camera = new THREE.PerspectiveCamera(45, parent.clientWidth / parent.clientHeight, 0.1, 1000);
  camera.position.set(boxSize * 1.5, boxSize * 1.5, boxSize * 2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(parent.clientWidth, parent.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(boxSize / 2, boxSize / 2, boxSize / 2);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(boxSize, boxSize * 2, boxSize);
  scene.add(dirLight);

  const boxGeo = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
  const boxMat = new THREE.MeshBasicMaterial({ color: 0x334155, wireframe: true, transparent: true, opacity: 0.2 });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.set(boxSize / 2, boxSize / 2, boxSize / 2);
  scene.add(box);

  return { scene, camera, renderer, controls };
}
