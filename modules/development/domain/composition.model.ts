import type { CompositionKind } from './types';

/**
 * CompositionEntry — элемент состава проекта.
 * Проекция кода (модули, страницы, компоненты, сервисы, данные, роуты),
 * генерируется сканером и/или ведётся вручную. `lastSeenAt` отличает
 * живые записи от мёртвых.
 */
export interface CompositionEntry {
  /** стабильный id: mod-letter, page-workspace, cmp-canvas… */
  id: string;
  kind: CompositionKind;
  name: string;
  /** путь в репо */
  path: string;
  /** id родительского module/angular-module */
  ownerModule?: string;
  specIds?: string[];
  taskIds?: string[];
  /** ISO-дата последней верификации сканером/вручную */
  lastSeenAt?: string;
}
