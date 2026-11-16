import type { EpicStatus } from './types';

/** Эпик — группировка задач внутри направления (вектора). */
export interface Epic {
  id: string;
  directionId: string;
  title: string;
  description: string;
  status: EpicStatus;
  order: number;
  /** Слаг спецификации в documentation/specifications — расширение medicina */
  documentationSpec?: string;
}
