// Типы для проектирования миграции календаря медицинских событий.

export interface CalendarMigrationGoal {
  id: string;
  title: string;
  description: string;
  success: string;
}

export interface CurrentFact {
  area: 'data' | 'behavior' | 'dates' | 'ui' | 'init' | 'types';
  fact: string;
  files: string[];
}

export interface CentralizationRule {
  concern: string;
  owner: string;
  rule: string;
}

export interface ConsumerMigration {
  consumer: string;
  current: string;
  target: string;
  risk: 'low' | 'medium' | 'high';
}

export interface MigrationStep {
  id: string;
  title: string;
  detail: string;
  files: string[];
  gate: string;
}

export interface MigrationPhase {
  id: string;
  title: string;
  goal: string;
  steps: MigrationStep[];
  rollback: string;
}

export interface CalendarMigrationDesign {
  version: string;
  updated: string;
  goals: CalendarMigrationGoal[];
  currentState: CurrentFact[];
  centralizationRules: CentralizationRule[];
  consumerMap: ConsumerMigration[];
  phases: MigrationPhase[];
  gates: string[];
  risks: { risk: string; mitigation: string }[];
  openQuestions: string[];
}
