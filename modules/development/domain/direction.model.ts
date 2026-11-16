import type {
  ComplexityEstimate,
  DirectionCategory,
  DirectionPriority,
  DirectionStatus,
} from './types';

/**
 * Направление (вектор) — куда идёт проект.
 * У вектора есть начало, нет конца: статус `completed` означает
 * «все milestones закрыты», а не «вектор удалён».
 */
export interface DirectionMilestone {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  /** id записи CompositionEntry, которой касается milestone */
  targetModule?: string;
  estimatedComplexity: ComplexityEstimate;
}

export interface StrategicDirection {
  id: string;
  code: string;
  title: string;
  tagline: string;
  description: string;
  category: DirectionCategory;
  priority: DirectionPriority;
  status: DirectionStatus;
  progressPercent: number;
  icon?: string;
  /** id записей CompositionEntry, которые обслуживает вектор */
  targetModules: string[];
  keyBenefits: string[];
  milestones: DirectionMilestone[];
  relatedSpecId?: string;
  relatedEpicId?: string;
  leadArchitect?: string;
  targetRelease?: string;
}
