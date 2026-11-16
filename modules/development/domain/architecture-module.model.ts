import type { ModuleStatus } from './types';

export interface ModuleLayer {
  name: string;
  path: string;
  status: 'completed' | 'in_progress' | 'planned';
  description: string;
}

export interface ArchitectureDecision {
  title: string;
  rationale: string;
  alternativesEvaluated: string;
}

/**
 * Архитектурный модуль — расширенная запись о bounded context.
 * id совпадает с CompositionEntry.id при kind='module'/'angular-module'.
 */
export interface ArchitectureModule {
  id: string;
  slug: string;
  name: string;
  category: string;
  status: ModuleStatus;
  license: string;
  summary: string;
  techStack: string[];
  pureCorePath?: string;
  angularPath?: string;
  layers?: ModuleLayer[];
  keyCapabilities: string[];
  specIds: string[];
  relatedTaskIds: string[];
  architectureDecisions?: ArchitectureDecision[];
}
