import type { DevSpecStatus } from './types';

export interface CodeChange {
  fileName: string;
  language: 'typescript' | 'html' | 'markdown' | 'json' | 'css';
  code: string;
}

/** Спецификация — документ, описывающий часть проекта/работу. */
export interface DevSpecification {
  id: string;
  code: string;
  title: string;
  summary: string;
  epic?: string;
  directionId?: string;
  status: DevSpecStatus;
  author: string;
  approvedDate?: string;
  contentMarkdown?: string;
  keyRequirements: string[];
  /** пути в репо — проекция на CompositionEntry */
  affectedPaths: string[];
  // --- расширения medicina (не ломают канон) ---
  version?: string;
  category?: 'architecture' | 'protocol' | 'ux' | 'feature';
  codeChanges?: CodeChange[];
}
