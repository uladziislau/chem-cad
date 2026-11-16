// Проект миграции/рефакторинга календаря медицинских событий в medicina.
// Статус: проект, готов к реализации. Аудит: 2026-11-09.
//
// ООП-формат в данных (целевое решение):
// - DTO (read-only JSON): CalendarEvent из domain/interfaces/visit.types.ts — не меняем.
// - Доменная сущность: CalendarEventEntity (modules/calendar, pure TS, без Angular) оборачивает
//   CalendarEvent и инкапсулирует поведение дат/статуса:
//     parsedDate(now?), isPast(now), isUpcoming(now), isToday(now), isTomorrow(now),
//     relativeLabel(now), dayKey, monthKey, toDTO().
// - Явный now: Date передаётся параметром во все проверки времени (тестируемость, нет скрытого new Date()).
// - Core-логика: CalendarLogic оперирует DTO/Entity и date-утилитами (parse/compare/group).
// - Angular-адаптер: CalendarService — единственный источник событий (load из UserDataService),
//   предоставляет signals/computed и dossierFor/planFor/planQuestionsFor.

import type { CalendarEvent } from '@domain/interfaces/visit.types';
import {
  CENTRALIZATION_RULES,
  CONSUMER_MAP,
  CURRENT_STATE,
  GOALS,
} from './calendar-migration.current.data';
import { GATES, OPEN_QUESTIONS, PHASES, RISKS } from './calendar-migration.plan.data';
import type { CalendarMigrationDesign } from './calendar-migration.types.data';

export type {
  CalendarMigrationDesign,
  CalendarMigrationGoal,
  CentralizationRule,
  ConsumerMigration,
  CurrentFact,
  MigrationPhase,
  MigrationStep,
} from './calendar-migration.types.data';
export { CENTRALIZATION_RULES, CONSUMER_MAP, CURRENT_STATE, GOALS } from './calendar-migration.current.data';
export { GATES, OPEN_QUESTIONS, PHASES, RISKS } from './calendar-migration.plan.data';

// Целевая форма доменной сущности (контракт для реализации p1/p2).
export interface CalendarEventEntity {
  readonly dto: CalendarEvent;
  readonly id: string;
  readonly dateTime: string;
  readonly status: CalendarEvent['status'];
  readonly type: CalendarEvent['type'];
  readonly specialty?: CalendarEvent['specialty'];
  /** Распарсенная дата события; null если dateTime невалиден. */
  parsedDate(): Date | null;
  isPast(now: Date): boolean;
  isUpcoming(now: Date): boolean;
  isToday(now: Date): boolean;
  isTomorrow(now: Date): boolean;
  /** Ключ группировки по дню, напр. "2026-11-09". */
  dayKey(): string | null;
  /** Ключ группировки по месяцу, напр. "2026-11". */
  monthKey(): string | null;
  /** "Сегодня" | "Завтра" | "Через N дн." | "N дн. назад" | формат даты. */
  relativeLabel(now: Date): string;
  toDTO(): CalendarEvent;
}

// Целевой контракт Core-логики (реализуется/уточняется в p1).
export interface CalendarLogicContract {
  upcoming(events: CalendarEvent[], now?: Date): CalendarEvent[];
  past(events: CalendarEvent[], now?: Date): CalendarEvent[];
  next(events: CalendarEvent[], now?: Date): CalendarEvent | null;
  byStatus(events: CalendarEvent[], status: CalendarEvent['status']): CalendarEvent[];
  byType(events: CalendarEvent[], type: CalendarEvent['type']): CalendarEvent[];
  byMonth(events: CalendarEvent[], year: number, monthIndex0: number): CalendarEvent[];
  groupByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]>;
  /** Обогащение DTO в сущность (опционально на p1). */
  toEntity?(event: CalendarEvent, now?: Date): CalendarEventEntity;
}

export const CALENDAR_MIGRATION_DESIGN: CalendarMigrationDesign = {
  version: '1.0',
  updated: '2026-11-09',
  goals: GOALS,
  currentState: CURRENT_STATE,
  centralizationRules: CENTRALIZATION_RULES,
  consumerMap: CONSUMER_MAP,
  phases: PHASES,
  gates: GATES,
  risks: RISKS,
  openQuestions: OPEN_QUESTIONS,
};
