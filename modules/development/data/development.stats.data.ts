import layersJson from './architecture-layers.json';
import techStackJson from './tech-stack.json';
import type { ArchitectureLayer, TechItem } from '../domain';

export const ARCHITECTURE_LAYERS = layersJson as ArchitectureLayer[];
export const TECH_STACK = techStackJson as TechItem[];
