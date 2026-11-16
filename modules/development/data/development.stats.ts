import type { ProjectMetric } from '../domain';
import { EPICS } from './epics.data';
import { FEATURES } from './dev-features.data';
import { TASKS } from './dev-tasks.data';
import { SPECIFICATIONS } from './specifications.data';

export const PROJECT_STATS: ProjectMetric[] = [
  { label: 'Задачи', value: TASKS.length.toString(), trend: 'up', trendValue: 'В разработке', color: 'text-green-400' },
  { label: 'Эпика', value: EPICS.length.toString(), trend: 'neutral', trendValue: 'В работе', color: 'text-blue-400' },
  { label: 'Фичи', value: FEATURES.length.toString(), trend: 'neutral', trendValue: 'В работе', color: 'text-cyan-400' },
  { label: 'Спецификации', value: SPECIFICATIONS.length.toString(), trend: 'neutral', trendValue: 'Базис', color: 'text-purple-400' },
];

export { ARCHITECTURE_LAYERS, TECH_STACK } from './development.stats.data';
