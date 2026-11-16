import type { Epic } from '../domain';

export const EPICS: Epic[] = [
  { id: 'E01', directionId: 'dir-chemcore', title: 'Базовое физико-химическое ядро (ChemCore)', description: 'Фундаментальные законы физики и химии для моделирования многофазных систем.', status: 'done', order: 1 },
  { id: 'E02', directionId: 'dir-autarky', title: 'Центр Автаркии (Autarky Hub)', description: 'Пользовательский интерфейс и архитектура для разделения продуктов по сегментам применения.', status: 'done', order: 2 },
  { id: 'E03', directionId: 'dir-household', title: 'Бытовая химия и Безопасность (Household & Safety)', description: 'Инженерия знаний.', status: 'done', order: 3 },
  { id: 'E04', directionId: 'dir-coatings', title: 'Лакокрасочные материалы (Coatings & DIY)', description: 'Моделирование процессов высыхания, полимеризации и адгезии.', status: 'done', order: 4 },
  { id: 'E-PRO', directionId: 'dir-pro', title: 'Профессиональная Лаборатория (R&D Edition)', description: 'Трансформация продукта в B2B SaaS.', status: 'done', order: 5 },
];
