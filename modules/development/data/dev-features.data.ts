import type { DevFeature } from '../domain';

/** Фичи medicina — промежуточная группировка эпик → задачи (расширение модели). */
export const FEATURES: DevFeature[] = [
  {
    id: 'id.feature.context-mgr',
    epicId: 'id.epic.data-layer',
    title: 'Менеджер Контекста',
    description: 'Управление состоянием AI-контекста и привязкой к медицинским инцидентам.',
    status: 'done',
    priority: 'critical',
    progress: 100,
  },
  {
    id: 'id.feature.docs-revamp',
    epicId: 'id.epic.medical-record',
    title: 'Реорганизация раздела "Документы"',
    description:
      'Раздел должен стать строгим цифровым архивом картотеки реальных документов без аналитики от ИИ.',
    status: 'backlog',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'id.feature.anamnesis-summary',
    epicId: 'id.epic.medical-record',
    title: 'Сводка "Анамнез A4"',
    description:
      'Создание раздела "Анамнез" в виде концентрированной медицинской карточки-сводки, которую можно быстро распечатать.',
    status: 'backlog',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'id.feature.calendar-agenda',
    epicId: 'id.epic.planning-management',
    title: 'Медицинский Календарь',
    description:
      'Трансформация раздела "Планы" в полноценный календарь с конкретными событиями, визитами и анализами по датам.',
    status: 'backlog',
    priority: 'medium',
    progress: 0,
  },
  {
    id: 'id.feature.ai-err-handler',
    epicId: 'id.epic.ai-intelligence',
    title: 'Глобальный AI-Обработчик',
    description: 'Система самодиагностики кода и автоматического исправления ошибок через Gemini.',
    status: 'backlog',
    priority: 'medium',
    progress: 0,
  },
  {
    id: 'id.feature.opt-arch',
    epicId: 'id.epic.architecture',
    title: 'Оптимизация архитектуры и UI',
    description:
      'Аудит и рефакторинг компонентов для повторного использования и перехода на standalone.',
    status: 'backlog',
    priority: 'high',
    progress: 10,
  },
];

export const FEATURE_BY_ID: Record<string, DevFeature> =
  Object.fromEntries(FEATURES.map((f) => [f.id, f]));
