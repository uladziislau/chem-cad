import { run as depGraph } from './dep.graph.probe';
import { run as moduleInventory } from './module.inventory.probe';
import { run as routeResolver } from './route.resolver.probe';

/**
 * Реестр probe: статический импорт, чтобы ошибка в инструменте падала при
 * загрузке CLI, а не в момент вызова с неверным именем.
 */
export const PROBES: Record<string, { description: string; run: () => void }> = {
  'dep-graph': { description: 'граф зависимостей контекстов + mermaid', run: depGraph },
  modules: { description: 'инвентарь модулей: файлы, строки, тесты', run: moduleInventory },
  routes: { description: 'маршруты и файлы, которые они грузят', run: routeResolver },
};
