import type { StrategicDirection } from '../domain';

/**
 * Стратегические направления medicina — векторы развития проекта.
 * У вектора есть начало, нет конца: status 'completed' = все milestones
 * закрыты, вектор может быть реактивирован.
 */
export const STRATEGIC_DIRECTIONS: StrategicDirection[] = [
  {
    id: 'dir-core-platform',
    code: 'DIR-001',
    title: 'Ядро и платформа',
    tagline: 'Фундамент, данные и архитектура приложения',
    description:
      'Слой данных, ядро сервисов, архитектурные паттерны, рефакторинг ' +
      'и приватность. Всё, что делает остальные направления возможными.',
    category: 'infrastructure',
    priority: 'critical',
    status: 'active',
    progressPercent: 55,
    targetModules: ['mod-user-data', 'mod-development', 'mod-global-error-handler', 'data-angular'],
    keyBenefits: [
      'Единый провайдер пользовательских данных',
      'Нормализованные клинические модели без any',
      'Воспроизводимая архитектура слоёв',
    ],
    milestones: [
      {
        id: 'ms-core-data-layer',
        title: 'Слой данных завершён',
        description: 'UserDataProvider и репозитории покрывают все таблицы.',
        isCompleted: true,
        targetModule: 'mod-user-data',
        estimatedComplexity: 'L',
      },
      {
        id: 'ms-core-normalization',
        title: 'Нормализация клинических данных',
        description: 'Строгие TS-интерфейсы для всех таблиц, ноль any в UI.',
        isCompleted: false,
        targetModule: 'mod-user-data',
        estimatedComplexity: 'M',
      },
      {
        id: 'ms-core-privacy',
        title: 'Приватность и безопасность',
        description: 'Медицинские данные вне JS-бандла, runtime-ассеты.',
        isCompleted: false,
        targetModule: 'mod-user-data',
        estimatedComplexity: 'M',
      },
    ],
  },
  {
    id: 'dir-medical-record',
    code: 'DIR-002',
    title: 'Медицинская карта и документы',
    tagline: 'Цифровая картотека и сводки для врача',
    description:
      'Строгий архив документов, печатные сводки (Анамнез A4), ' +
      'актуализация карты после визитов.',
    category: 'core_product',
    priority: 'high',
    status: 'active',
    progressPercent: 40,
    targetModules: ['ang-medical-card', 'ang-medical-documents', 'ang-medical-timeline'],
    keyBenefits: [
      'Документы как доверенная картотека без AI-шума',
      'Готовый к печати Medical Dossier',
    ],
    milestones: [
      {
        id: 'ms-mr-digitize',
        title: 'Оцифровка анализов и визитов',
        description: 'Helix, Gemini-заключения, визит к эндокринологу внесены в карту.',
        isCompleted: true,
        targetModule: 'ang-medical-card',
        estimatedComplexity: 'M',
      },
      {
        id: 'ms-mr-doc-archive',
        title: 'Архив документов',
        description: 'UI файлового менеджера: дата, врач, клиника; фильтры по типам.',
        isCompleted: false,
        targetModule: 'ang-medical-documents',
        estimatedComplexity: 'L',
      },
      {
        id: 'ms-mr-anamnesis-a4',
        title: 'Сводка Анамнез A4',
        description: 'Print-friendly Medical Dossier с toggle Сводка/Хронология.',
        isCompleted: false,
        targetModule: 'ang-medical-card',
        estimatedComplexity: 'L',
      },
    ],
  },
  {
    id: 'dir-calendar',
    code: 'DIR-003',
    title: 'Календарь и планирование',
    tagline: 'Медицинский календарь вместо абстрактных планов',
    description:
      'Трансформация раздела «Планы» в хронологический календарь: ' +
      'приёмы, анализы, процедуры по точным датам.',
    category: 'core_product',
    priority: 'high',
    status: 'active',
    progressPercent: 30,
    targetModules: ['mod-calendar', 'ang-calendar', 'ang-planner'],
    keyBenefits: [
      'События, привязанные к реальным датам',
      'Группировка по месяцам с архивом',
    ],
    milestones: [
      {
        id: 'ms-cal-revamp',
        title: 'Ревамп Планировщика в Календарь',
        description: 'Группировка по Месяц+Год, сортировка по дате, архив прошедшего.',
        isCompleted: false,
        targetModule: 'mod-calendar',
        estimatedComplexity: 'L',
      },
    ],
  },
  {
    id: 'dir-body',
    code: 'DIR-004',
    title: 'Тело: биомеханика и биометрия',
    tagline: 'Физическое состояние, тесты, восстановление',
    description:
      'Модуль биомеханики (ортопедические тесты, pain mapping), ' +
      'биометрический трекинг и восстановление.',
    category: 'core_product',
    priority: 'medium',
    status: 'active',
    progressPercent: 15,
    targetModules: ['mod-biomechanics', 'ang-biomechanics', 'ang-recovery-biomechanics'],
    keyBenefits: [
      'Визуализация симметрии и результатов тестов',
      'Субъективные точки боли на модели тела',
    ],
    milestones: [
      {
        id: 'ms-body-biomech-init',
        title: 'Старт модуля Биомеханики',
        description: 'Dashboard, виджеты симметрии, overhead squat/plank, pain mapping.',
        isCompleted: false,
        targetModule: 'mod-biomechanics',
        estimatedComplexity: 'XL',
      },
    ],
  },
  {
    id: 'dir-ai',
    code: 'DIR-005',
    title: 'ИИ и семантический анализ',
    tagline: 'AI-ассистент поверх медицинских данных',
    description:
      'Семантический поиск по системе, ИИ-заключения, самодиагностика кода. ' +
      'AI — инструмент, а не источник аналитики в интерфейсе.',
    category: 'ai_agentica',
    priority: 'medium',
    status: 'active',
    progressPercent: 20,
    targetModules: ['mod-research', 'ang-diagnostics'],
    keyBenefits: [
      'Cmd+K поиск по диагнозам, документам, лекарствам',
      'Самодиагностика и автоисправление ошибок',
    ],
    milestones: [
      {
        id: 'ms-ai-search',
        title: 'Единый семантический поиск',
        description: 'SearchDialog (Cmd+K): лексический поиск через DataRepositoryService.',
        isCompleted: false,
        targetModule: 'mod-user-data',
        estimatedComplexity: 'L',
      },
      {
        id: 'ms-ai-error-handler',
        title: 'Глобальный обработчик ошибок',
        description: 'GlobalErrorHandlerService: перехват, классификация, UX вместо белого экрана.',
        isCompleted: true,
        targetModule: 'mod-global-error-handler',
        estimatedComplexity: 'M',
      },
    ],
  },
  {
    id: 'dir-ux',
    code: 'DIR-006',
    title: 'UX/UI и дизайн-система',
    tagline: 'Переиспользуемые компоненты и целостный опыт',
    description:
      'Дизайн-система на Tailwind + Signals, рефакторинг страниц на standalone, ' +
      'аудит UI-слоя.',
    category: 'core_product',
    priority: 'medium',
    status: 'active',
    progressPercent: 35,
    targetModules: ['ang-dashboard', 'mod-development'],
    keyBenefits: [
      'Единые UI-компоненты вместо разовых страниц',
      'Standalone-архитектура без NgModule',
    ],
    milestones: [
      {
        id: 'ms-ux-standalone',
        title: 'Переход на standalone',
        description: 'Аудит и рефакторинг компонентов для повторного использования.',
        isCompleted: false,
        targetModule: 'ang-dashboard',
        estimatedComplexity: 'M',
      },
    ],
  },
];

export const DIRECTION_BY_ID: Record<string, StrategicDirection> =
  Object.fromEntries(STRATEGIC_DIRECTIONS.map((d) => [d.id, d]));
