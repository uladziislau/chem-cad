import type { MigrationPhase } from './calendar-migration.types.data';

export const PHASES: MigrationPhase[] = [
  {
    id: 'p0',
    title: 'Фаза 0 — Границы и проект (без смены поведения)',
    goal: 'Зафиксировать целевой API, сущность и карту миграции. Никаких runtime-изменений.',
    steps: [
      {
        id: 'p0.1',
        title: 'Утвердить целевой контракт CalendarService/CalendarLogic',
        detail:
          'Определить публичный API: events(), upcoming(now?), past(now?), next(now?), byStatus/byType/byMonth, groupByDay, dossierFor, planFor, planQuestionsFor. Вход — CalendarEvent[]/CalendarEvent; now передаётся параметром (тестируемость).',
        files: ['modules/calendar/calendar-logic.ts', 'angular/modules/calendar/services/calendar.service.ts'],
        gate: 'Ревью контракта; tsc зелёный (без изменений).',
      },
      {
        id: 'p0.2',
        title: 'Спроектировать доменную сущность CalendarEventEntity (ООП)',
        detail:
          'Entity оборачивает raw CalendarEvent (DTO из JSON) и даёт поведение: parsedDate, isPast(now), isUpcoming(now), isToday(now), isTomorrow(now), relativeLabel(now), dayKey, monthKey, careLine(contacts). Данные остаются immutable DTO; сущность — чистый TS класс/фабрика без Angular.',
        files: ['modules/calendar/calendar-logic.ts (или modules/calendar/domain/calendar-event.entity.ts)'],
        gate: 'Unit-тесты сущности на фиксированном now.',
      },
    ],
    rollback: 'Нет изменений кода/данных — нечего откатывать.',
  },
  {
    id: 'p1',
    title: 'Фаза 1 — Core-сущность и централизованные даты',
    goal: 'Ввести CalendarEventEntity + date-утилиты в Core с тестами. Поведение потребителей не меняется.',
    steps: [
      {
        id: 'p1.1',
        title: 'Реализовать date-утилиты (pure TS)',
        detail:
          'parseEventDateTime(iso): Date|null; compare(a,b); isPast/isUpcoming/isToday/isTomorrow(event, now); dayKey/monthKey; relativeLabel. Обработка невалидных дат — null/безопасный fallback. Не зависеть от date-fns в Core (или зафиксировать решение).',
        files: ['modules/calendar/calendar-date.util.ts (новый)', 'modules/calendar/index.ts'],
        gate: 'npx vitest --run tests/primitives/calendar*.spec.ts',
      },
      {
        id: 'p1.2',
        title: 'Реализовать CalendarEventEntity + фабрику',
        detail:
          'class/factory CalendarEventEntity.from(dto, now?) с computed-полями/методами. CalendarLogic начинает работать через entity/date-util (или принимает DTO и внутренне нормализует) — выбрать один путь и придерживаться его.',
        files: ['modules/calendar/calendar-event.entity.ts (новый)', 'modules/calendar/calendar-logic.ts'],
        gate: 'tsc, vitest (calendar primitives), oxlint.',
      },
      {
        id: 'p1.3',
        title: 'Расширить тесты Core',
        detail:
          'Покрыть границы: событие «сейчас», прошедшее/будущее, today/tomorrow, невалидный dateTime, сортировка, группировка по дню/месяцу, status completed/cancelled.',
        files: ['tests/primitives/calendar-logic.primitives.spec.ts', 'tests/primitives/calendar-date.primitives.spec.ts (новый)'],
        gate: 'npx vitest --run (затронутые + primitives).',
      },
    ],
    rollback: 'Новые файлы не подключены потребителями — удалить/откатить коммит фазы.',
  },
  {
    id: 'p2',
    title: 'Фаза 2 — CalendarService как единый источник, миграция потребителей',
    goal: 'Все календарные чтения идут через CalendarService. PlannerService — только backlog (или временная делегация).',
    steps: [
      {
        id: 'p2.1',
        title: 'Инициализация CalendarService',
        detail:
          'Добавить calendarService.load() в AppInitializerService параллельно. PlannerService.load() перестаёт загружать calendarEvents (оставляет backlog).',
        files: ['angular/initialization/app-initializer.service.ts', 'angular/services/planner.service.ts'],
        gate: 'Приложение стартует; /calendar и виджеты дашборда показывают события.',
      },
      {
        id: 'p2.2',
        title: 'Перевести dashboard, intelligence, development на CalendarService',
        detail:
          'Заменить plannerService.nextUpcomingEvent/upcoming/past/events/dossierFor на calendarService. Имена методов выровнять (nextUpcomingEvent vs nextUpcoming — единый контракт).',
        files: [
          'angular/modules/dashboard/ui/pages/dashboard.component.ts',
          'angular/services/intelligence.service.ts',
          'angular/modules/development/services/development.service.ts',
        ],
        gate: 'tsc, vitest, ручная проверка дашборда/интеллекта.',
      },
      {
        id: 'p2.3',
        title: 'Planner UI: события из CalendarService, backlog из PlannerService',
        detail:
          'planner.component инжектит оба сервиса по ответственности. Или заменить planner UI на CalendarComponent и сделать /planner redirect → /calendar.',
        files: ['angular/modules/planner/ui/pages/planner.component.ts', 'angular/app.routes.ts'],
        gate: 'tsc, vitest, UI smoke /calendar и /planner.',
      },
      {
        id: 'p2.4',
        title: 'Делегация/удаление календарного дубля в PlannerService',
        detail:
          'Удалить eventsSignal/calendar-логику из PlannerService, оставив backlog API. Если нужен переходный период — тонкие getters, делегирующие в CalendarService (пометить deprecated). IncidentService не менять.',
        files: ['angular/services/planner.service.ts', 'angular/services/incident.service.ts (проверка)'],
        gate: 'grep по PlannerService календарным методам = 0 (кроме backlog); vitest planner.service.spec переписан под backlog.',
      },
    ],
    rollback: 'Вернуть plannerService.load() календаря и инжекты PlannerService в потребителях (git revert фазы).',
  },
  {
    id: 'p3',
    title: 'Фаза 3 — Унификация UI дат и удаление дубликатов',
    goal: 'Один календарный UI, единые date-утилиты в компонентах, удалён старый planner-дубль.',
    steps: [
      {
        id: 'p3.1',
        title: 'Унифицировать UI',
        detail:
          'Оставить один компонент/маршрут (/calendar). /planner — redirect или удаление модуля planner UI, если backlog вынесен отдельно. Убрать дублирование шаблонов calendar/planner.',
        files: ['angular/app.routes.ts', 'angular/modules/planner/**', 'angular/modules/calendar/**'],
        gate: 'Нет мёртвых маршрутов; tsc, build.',
      },
      {
        id: 'p3.2',
        title: 'Перевести UI-компоненты дат событий на calendar date util/Entity',
        detail:
          'NextEventComponent, intelligence подпись nextEvent, calendar/planner компоненты — используют CalendarEventEntity/date util вместо прямого new Date/parseISO/formatDistanceToNow для логики «сегодня/завтра/через N дн.». DateFormatter — для отображаемого формата даты.',
        files: ['angular/ui/components/dashboard/widgets/next-event.component.ts', 'angular/services/intelligence.service.ts', 'angular/modules/calendar/ui/pages/calendar.component.ts'],
        gate: 'vitest, oxlint, визуальная проверка дат.',
      },
    ],
    rollback: 'Вернуть предыдущие компоненты/маршруты; date-утилиты остаются (не ломают).',
  },
  {
    id: 'p4',
    title: 'Фаза 4 — Зачистка и стабилизация',
    goal: 'Удалить мёртвый код, зафиксировать инварианты тестами и документацией.',
    steps: [
      {
        id: 'p4.1',
        title: 'Удалить мёртвый код/дубликаты',
        detail:
          'Убрать неиспользуемые календарные методы PlannerService, старые импорты, мёртвый planner calendar-код. Проверить grep на дубли.',
        files: ['angular/services/planner.service.ts', 'tests/services/planner.service.spec.ts'],
        gate: 'tsc, vitest, oxlint, ng lint, ng build --configuration production.',
      },
      {
        id: 'p4.2',
        title: 'Зафиксировать changelog/документацию',
        detail:
          'Обновить documentation/changelog.md и, при необходимости, модуль разработки (статус фичи/задачи).',
        files: ['documentation/changelog.md', 'modules/development/data/** (опционально)'],
        gate: 'Ревью.',
      },
    ],
    rollback: 'Точечный revert удалений.',
  },
];

export const GATES = [
  'npx tsc --noEmit — 0 ошибок',
  'npx vitest --run — все тесты зелёные (минимум затронутые + primitives календаря)',
  'npx oxlint — без новых нарушений',
  'npx ng lint — без ошибок',
  'npx ng build --configuration production — успешная сборка',
  'grep: PlannerService не содержит upcomingEvents/pastEvents/nextUpcomingEvent/dossierFor/planFor для календаря (после p2/p4)',
  'grep: прямые new Date(event.dateTime) для логики событий вне modules/calendar — 0 (после p3)',
];

export const RISKS: { risk: string; mitigation: string }[] = [
  { risk: 'Скрытые потребители PlannerService календарных методов.', mitigation: 'grep + tsc перед удалением; фаза делегации.' },
  { risk: 'IncidentService сломается при удалении PlannerService.', mitigation: 'Backlog остаётся у PlannerService/BacklogService; incident не трогать в p2 по календарю.' },
  { risk: 'Расхождение логики дат (timezone, today/past boundary) при замене new Date/parseISO.', mitigation: 'Entity/date util принимает now; тесты на границах; поэтапная замена.' },
  { risk: 'Planner UI и /calendar дублируют функциональность.', mitigation: 'p3: один канонический UI, redirect /planner.' },
  { risk: 'Read-only модель данных: попытка добавить CRUD в UI.', mitigation: 'Не добавлять мутации/localStorage для событий; события — из JSON. Backlog — отдельная сущность.' },
];

export const OPEN_QUESTIONS = [
  'Нужно ли оставить PlannerService как обёртку-делегат для обратной совместимости, или сразу удалять календарные методы? (Рекомендация: промежуточная Delegation на фазе 1, удаление на фазе 4.)',
  'Оставлять ли маршрут /planner как редирект на /calendar или удалить полностью? (Рекомендация: редирект на фазе 3, удаление на фазе 4.)',
  'Нужно ли нормализовать dateTime в calendar-events.json (добавить Z/время)? (Рекомендация: нет — утилита парсинга должна есть текущий формат; нормализация — отдельная задача по данным.)',
];
