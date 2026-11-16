import type { WeaknessSeverity, WeaknessStatus } from './types';

/** Слабое место проекта — найденное сканером или вручную. */
export interface Weakness {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: WeaknessSeverity;
  status: WeaknessStatus;
  category: string;
  /** путь в репо — проекция на CompositionEntry.path */
  targetPath: string;
  /** 1–100, чем выше тем критичнее */
  impactScore: number;
  detectionSource: string;
  suggestedRemediation: string;
  appliedFix?: string;
  identifiedAt: string;
  resolvedAt?: string;
  tags?: string[];
}

export interface WeaknessPoolStats {
  total: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  averageImpactScore: number;
  resolutionRatePercent: number;
}
