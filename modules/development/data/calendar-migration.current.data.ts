import type {
  CalendarMigrationGoal,
  CentralizationRule,
  ConsumerMigration,
  CurrentFact,
} from './calendar-migration.types.data';

export const GOALS: CalendarMigrationGoal[] = [
  {
    id: 'g1',
    title: 'Единый источник событий календаря',
    description:
      'Все потребители (дашборд, интеллект, инциденты, развитие, UI) читают события из одного сервиса — CalendarService. Данные берутся из одного JSON-источника (calendar-events.json → UserDataService).',
    success:
      'grep по PlannerService для upcomingEvents/pastEvents/nextUpcomingEvent/dossierFor/planFor/planQuestionsFor возвращает только backlog.',
  },
  {
    id: 'g2',
    title: 'ООП-сущность события в данных',
    description:
      'RAW-данные (CalendarEvent из JSON) остаются чистыми DTO. Поведение события (даты, относительное время, группы, статус, строка ухода) инкапсулировано в доменной сущности CalendarEventEntity в чистом TS Core.',
    success:
      'modules/calendar/calendar-logic.ts экспортирует CalendarEventEntity; ningún компонент UI не вызывает new Date(event.dateTime) напрямую.',
  },
  {
    id: 'g3',
    title: 'Централизованная работа с датами',
    description:
      'Парсинг, сравнение, группировка по дню/месяцу, определение today/tomorrow/past/upcoming и форматирование дат событий выполняются единым набором утилит в Core/Angular-адаптере. UI не дублирует new Date/parseISO/Intl для логики событий.',
    success:
      'Единый модуль дат в modules/calendar; UI вызывает методы CalendarService/CalendarLogic вместо прямых Date/date-fns.',
  },
  {
    id: 'g4',
    title: 'Разделение ответственности Planner/Calendar/Backlog',
    description:
      'PlannerService перестаёт быть источником календаря. Он либо сужается до backlog (задачи, localStorage), либо делегирует календарь в CalendarService. Маршрут /planner становится алиасом/редиректом на /calendar или удаляется после миграции.',
    success: 'CalendarService загружается в AppInitializerService; PlannerService не содержит логики upcoming/past/next.',
  },
];

export const CURRENT_STATE: CurrentFact[] = [
  {
    area: 'data',
    fact: 'Единый источник данных: health-data/calendar-events.json → bundle → UserDataService.healthData.calendarEvents. Данных-дубликатов нет.',
    files: [
      'data/users/uladzislau.darazhei/health-data/calendar-events.json',
      'modules/user-data/user-data.types.ts',
      'angular/services/user-data.service.ts',
    ],
  },
  {
    area: 'types',
    fact: 'Единый DTO: CalendarEvent (id, title, type VISIT|LABS|PROCEDURE|PERSONAL, dateTime ISO, status, doctorId, organizationId, specialty, planDocumentId).',
    files: ['domain/interfaces/visit.types.ts'],
  },
  {
    area: 'behavior',
    fact: 'PlannerService — активный владелец календарной логики: events/upcoming/past/nextUpcomingEvent, dossierFor/planFor/planQuestionsFor, плюс backlog (localStorage). Загружается в инициализаторе.',
    files: ['angular/services/planner.service.ts', 'angular/initialization/app-initializer.service.ts'],
  },
  {
    area: 'behavior',
    fact: 'Новый CalendarService + CalendarLogic (Core) созданы и маршрут /calendar переведён на них, но CalendarService не инициализируется и не используется потребителями вместо PlannerService.',
    files: [
      'modules/calendar/calendar-logic.ts',
      'angular/modules/calendar/services/calendar.service.ts',
      'angular/modules/calendar/ui/pages/calendar.component.ts',
      'angular/app.routes.ts',
    ],
  },
  {
    area: 'behavior',
    fact: 'Потребители календаря через PlannerService: intelligence (nextUpcomingEvent ×2), dashboard (nextUpcomingEvent, dossierFor), development (events.length), planner UI. Incident использует PlannerService только для backlog (addBacklogTask) — не календарь.',
    files: [
      'angular/services/intelligence.service.ts',
      'angular/modules/dashboard/ui/pages/dashboard.component.ts',
      'angular/modules/development/services/development.service.ts',
      'angular/services/incident.service.ts',
      'angular/modules/planner/ui/pages/planner.component.ts',
    ],
  },
  {
    area: 'dates',
    fact: 'Даты фрагментированы: new Date(...) в PlannerService/CalendarLogic; date-fns (parseISO/isToday/isTomorrow/format/formatDistanceToNow/compare*) в calendar/planner UI; DateFormatter (Intl) точечно; toLocaleDateString/Time в intelligence/виджетах.',
    files: [
      'angular/services/planner.service.ts',
      'modules/calendar/calendar-logic.ts',
      'angular/modules/calendar/ui/pages/calendar.component.ts',
      'angular/modules/planner/ui/pages/planner.component.ts',
      'angular/services/intelligence.service.ts',
    ],
  },
];

export const CENTRALIZATION_RULES: CentralizationRule[] = [
  {
    concern: 'Источник данных событий',
    owner: 'UserDataService.healthData.calendarEvents (read-only)',
    rule: 'Единственное чтение JSON/bundle. CalendarService.load() берёт данные отсюда; PlannerService не читает calendarEvents.',
  },
  {
    concern: 'Календарная логика и доступ',
    owner: 'CalendarService (Angular) → CalendarLogic (Core)',
    rule: 'Фильтрация (upcoming/past/byStatus/byType/byMonth), nextUpcoming, groupByDay, dossierFor, planFor, planQuestionsFor — только здесь. Потребители инжектят CalendarService.',
  },
  {
    concern: 'Backlog (задачи плана)',
    owner: 'PlannerService (или выделенный BacklogService на этапе 3+)',
    rule: 'addBacklogTask/toggleBacklogTask + localStorage healthos_backlog_v0.3 остаются вне календаря. Incident.syncTaskToGlobal продолжает вызывать backlog-владельца.',
  },
  {
    concern: 'Парсинг/сравнение дат событий',
    owner: 'modules/calendar (date util / entity)',
    rule: 'Никаких прямых new Date(event.dateTime) в UI и в сервисах вне calendar-модуля. Единая функция parseEventDateTime, сравнения и проверки today/tomorrow/past/upcoming.',
  },
  {
    concern: 'Форматирование дат для отображения',
    owner: 'Calendar date util + DateFormatter (общий)',
    rule: 'Относительное время и подписи «Сегодня/Завтра/N дн.» вычисляются через calendar-утилиты; числовой формат даты — через DateFormatter/Intl. date-fns в UI — только там, где даёт уникальную ценность, и через обёртку.',
  },
  {
    concern: 'Маршрут календаря',
    owner: '/calendar → CalendarComponent',
    rule: 'Один канонический маршрут. /planner — redirect на /calendar или удалён после миграции UI.',
  },
];

export const CONSUMER_MAP: ConsumerMigration[] = [
  {
    consumer: 'AppInitializerService',
    current: 'plannerService.load() (грузит события + backlog)',
    target: 'calendarService.load() + plannerService.load() (только backlog); позже — backlogService',
    risk: 'medium',
  },
  {
    consumer: 'DashboardComponent',
    current: 'plannerService.nextUpcomingEvent, dossierFor',
    target: 'calendarService.nextUpcomingEvent, dossierFor',
    risk: 'low',
  },
  {
    consumer: 'IntelligenceService',
    current: 'plannerService.nextUpcomingEvent() ×2',
    target: 'calendarService.nextUpcomingEvent()',
    risk: 'low',
  },
  {
    consumer: 'DevelopmentService',
    current: 'plannerService.events().length',
    target: 'calendarService.events().length',
    risk: 'low',
  },
  {
    consumer: 'Planner UI (planner.component)',
    current: 'plannerService upcoming/past/dossier/plan/planQuestions',
    target: 'calendarService (события) + backlog-владелец (задачи); UI объединить с CalendarComponent',
    risk: 'medium',
  },
  {
    consumer: 'IncidentService',
    current: 'plannerService.addBacklogTask (backlog, НЕ календарь)',
    target: 'без изменений по календарю; при выносе backlog — backlogService.addTask',
    risk: 'low',
  },
  {
    consumer: 'NextEventComponent / виджеты дат',
    current: 'собственный new Date/formatting',
    target: 'принимает CalendarEventEntity или использует calendar date util',
    risk: 'low',
  },
];
