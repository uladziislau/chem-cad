/**
 * Презентационные типы модуля «Разработка» — не доменные сущности,
 * а данные для UI-виджетов (шапка, стек, слои, changelog).
 */

export interface ProjectMetric {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
}

export interface TechItem {
  name: string;
  version: string;
  category: string;
  icon: string;
}

export interface ArchitectureLayer {
  name: string;
  role: string;
  technologies: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
  type: 'feature' | 'fix' | 'refactor' | 'docs';
}
