import raw from './composition.data.json';
import type { CompositionEntry } from '../domain';

/**
 * CompositionEntry — реестр состава проекта medicina.
 * Источник истины: composition.data.json, генерируется
 * `pnpm exec tsx agentica/tools/scan-composition.ts`.
 */
export const COMPOSITION_ENTRIES = raw as unknown as CompositionEntry[];

export const COMPOSITION_BY_ID: Record<string, CompositionEntry> =
  Object.fromEntries(COMPOSITION_ENTRIES.map((e) => [e.id, e]));
