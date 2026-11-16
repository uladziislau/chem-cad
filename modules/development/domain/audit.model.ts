import type { AuditCategory, AuditSeverity, AuditToolStatus } from './types';

export interface AuditCheckItem {
  id: string;
  name: string;
  category: AuditCategory;
  description: string;
  status: AuditSeverity;
  issuesCount: number;
  details?: string[];
  executionTimeMs?: number;
}

/** Project Health Index — сводка здоровья проекта. */
export interface ProjectHealthSummary {
  /** 0–100 */
  phiScore: number;
  statusText: string;
  totalChecks: number;
  passedChecks: number;
  warningChecks: number;
  errorChecks: number;
  lastRunAt: string;
  checks: AuditCheckItem[];
}

export interface AuditCheckpointRecord {
  toolId: string;
  toolName: string;
  durationMs: number;
  scopeFingerprint: string;
  filesScannedCount: number;
  defectsCount: number;
  summary: string;
  status: AuditToolStatus;
  recordedAt: string;
}
