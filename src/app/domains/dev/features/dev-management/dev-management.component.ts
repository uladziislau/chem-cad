import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TaskStatus = 'backlog' | 'design' | 'implementation' | 'verification' | 'done' | 'pending';
export type SubTaskStatus = 'pending' | 'design' | 'implementation' | 'verification' | 'done' | 'in-progress';

interface SubTask {
  id: string;
  title: string;
  status: SubTaskStatus;
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  subtasks?: SubTask[];
}

interface Epic {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'active' | 'completed';
  tasks: Task[];
}

@Component({
  selector: 'app-dev-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dev-management.component.html',
  styleUrl: './dev-management.component.css'
})
export class DevManagementComponent {
  viewMode = signal<'active' | 'archive'>('active');

  public readonly epics = signal<Epic[]>([
    {
      id: 'E01',
      title: 'Базовое физико-химическое ядро (ChemCore)',
      description: 'Фундаментальные законы физики и химии для моделирования многофазных систем.',
      status: 'completed',
      tasks: [
        {
          id: '017',
          title: 'Интеграция термодинамики и физики',
          status: 'done',
          priority: 'high',
          description: 'Связывание вязкости, температуры и стабильности.',
          subtasks: [
            { id: '17.1', title: 'Интеграционные тесты термической цепочки', status: 'done' },
            { id: '17.2', title: 'Тесты фазовых переходов и "заморозки"', status: 'done' },
            { id: '17.3', title: 'Валидация HLB-стабильности', status: 'done' }
          ]
        },
        {
          id: '018',
          title: 'pH-баланс и электролиты',
          status: 'done',
          priority: 'medium',
          description: 'Моделирование кислотно-щелочного баланса и ионной силы системы.',
          subtasks: [
            { id: '18.1', title: 'Математическая модель расчета pH', status: 'done' },
            { id: '18.2', title: 'Расчет ионной силы (Ionic Strength)', status: 'done' },
            { id: '18.3', title: 'UI-мониторинг pH и ионных параметров', status: 'done' }
          ]
        }
      ]
    },
    {
      id: 'E02',
      title: 'Центр Автаркии (Autarky Hub)',
      description: 'Пользовательский интерфейс и архитектура для разделения продуктов по сегментам применения.',
      status: 'active',
      tasks: [
        {
          id: '019',
          title: 'Архитектура сегментов и Хаб',
          status: 'done',
          priority: 'high',
          description: 'Создание системы сегментации продуктов и интерфейса выбора направления.',
          subtasks: [
            { id: '19.1', title: 'Определение базовых сегментов автаркии', status: 'done' },
            { id: '19.2', title: 'Создание AutarkyService и глобального состояния сегмента', status: 'done' },
            { id: '19.3', title: 'Реализация AutarkyHub (Dashboard выбора вектора)', status: 'done' },
            { id: '19.4', title: 'Интеграция фильтрации каталога по сегментам', status: 'done' }
          ]
        }
      ]
    },
    {
      id: 'E03',
      title: 'Бытовая химия и Безопасность (Household & Safety)',
      description: 'Инженерия знаний: перенос эвристик моющей способности и химической безопасности в математические модели.',
      status: 'active',
      tasks: [
        {
          id: '021',
          title: 'Валидатор химической безопасности (SafetyValidator)',
          status: 'done',
          priority: 'critical',
          description: 'Предотвращение создания токсичных или опасных смесей на основе инженерии знаний.',
          subtasks: [
            { id: '21.1', title: 'Проектирование матрицы несовместимости', status: 'done' },
            { id: '21.2', title: 'Реализация логики обнаружения конфликтов (ПАВ, pH)', status: 'done' },
            { id: '21.3', title: 'Интеграционный тест: Segment Integrity & Safety', status: 'done' }
          ]
        },
        {
          id: '020',
          title: 'Решатель моющей способности (DetergencySolver)',
          status: 'pending',
          priority: 'high',
          description: 'Оценка эффективности удаления жира и известкового налета.',
          subtasks: [
            { id: '20.1', title: 'Математическая модель Degreasing (pH + HLB)', status: 'pending' },
            { id: '20.2', title: 'Математическая модель Descaling (Кислотность)', status: 'pending' }
          ]
        }
      ]
    },
    {
      id: 'E04',
      title: 'Лакокрасочные материалы (Coatings & DIY)',
      description: 'Моделирование процессов высыхания, полимеризации и адгезии.',
      status: 'planned',
      tasks: [
        {
          id: '022',
          title: 'Решатель высыхания (DryingSolver)',
          status: 'backlog',
          priority: 'medium',
          description: 'Расчет времени испарения растворителей и полимеризации масел.',
          subtasks: [
            { id: '22.1', title: 'Модель испарения (по уравнению Антуана)', status: 'pending' },
            { id: '22.2', title: 'Модель полимеризации (Йодное число)', status: 'pending' }
          ]
        }
      ]
    },
    {
      id: 'E-PRO',
      title: 'Профессиональная Лаборатория (R&D Edition)',
      description: 'Трансформация продукта в B2B SaaS для научных и R&D лабораторий (Predictive Formulation, DoE, ELN).',
      status: 'active',
      tasks: [
        {
          id: 'PRO-1',
          title: 'Декларативное проектирование (Constraint-Based Solver)',
          status: 'pending',
          priority: 'high',
          description: 'Переход от императивного смешивания к декларативному: пользователь задает целевые свойства (pH, вязкость), а математический решатель подбирает состав.',
          subtasks: [
            { id: 'P1.1', title: 'Математическая модель целевой функции (Loss function)', status: 'pending' },
            { id: 'P1.2', title: 'Алгоритм подбора концентраций (Градиентный спуск / Симплекс)', status: 'pending' },
            { id: 'P1.3', title: 'UI для задания декларативных ограничений (Target Specs)', status: 'pending' }
          ]
        },
        {
          id: 'PRO-7',
          title: 'Композиция композиций (Nested Formulations)',
          status: 'done',
          priority: 'high',
          description: 'Позволяет использовать готовую рецептуру (MultiphaseSystem) как единый ингредиент для новой рецептуры (Система систем).',
          subtasks: [
            { id: 'P7.1', title: 'Адаптер: MultiphaseSystem -> IChemicalEntity', status: 'done' },
            { id: 'P7.2', title: 'Логика слияния фаз (Phase Merging) при смешивании систем', status: 'done' },
            { id: 'P7.3', title: 'UI: Сохранение рецептуры как "Премикса" в каталог', status: 'done' }
          ]
        },
        {
          id: 'PRO-8',
          title: 'Композиция процессов (Unit Operations)',
          status: 'done',
          priority: 'high',
          description: 'Поддержка последовательных стадий производства (Нагрев -> Гомогенизация -> Охлаждение -> Ввод активов).',
          subtasks: [
            { id: 'P8.1', title: 'Модель данных ProcessStep и ManufacturingProcess', status: 'done' },
            { id: 'P8.2', title: 'Engine: Симуляция эволюции системы по шагам', status: 'done' },
            { id: 'P8.3', title: 'UI: Конструктор техпроцесса (Process Designer)', status: 'done' }
          ]
        },
        {
          id: 'PRO-2',
          title: 'Продвинутая Термодинамика (HLD / Net-IFT)',
          status: 'done',
          priority: 'medium',
          description: 'Расчет Hydrophilic-Lipophilic Difference (HLD) для предсказания типа и стабильности эмульсий.',
          subtasks: [
            { id: 'P2.1', title: 'Модель HLD для ПАВ (Cc, EACN, Salinity)', status: 'done' },
            { id: 'P2.2', title: 'Интеграция HLD в StabilitySolver и FormulationSolver', status: 'done' },
            { id: 'P2.3', title: 'Визуализация фазового поведения (HLD Scan)', status: 'done' }
          ]
        },
        {
          id: 'PRO-3',
          title: 'ELN (Электронный лабораторный журнал)',
          status: 'pending',
          priority: 'medium',
          description: 'Версионирование формул, сравнение батчей и строгий Audit Trail.',
          subtasks: [
            { id: 'P3.1', title: 'Система версионирования рецептур (v1.0, v1.1)', status: 'pending' },
            { id: 'P3.2', title: 'Экспорт паспортов безопасности (SDS/GHS)', status: 'pending' }
          ]
        },
        {
          id: 'PRO-4',
          title: 'Строгое кислотно-основное равновесие (pH Solver)',
          status: 'done',
          priority: 'high',
          description: 'Полноценный расчет pH на основе констант диссоциации (pKa/pKb) и уравнений электронейтральности.',
          subtasks: [
            { id: 'P4.1', title: 'Добавление pKa/pKb в химические сущности', status: 'done' },
            { id: 'P4.2', title: 'Итеративный решатель баланса ионов (H+/OH-)', status: 'done' },
            { id: 'P4.3', title: 'Интеграционные тесты для буферных систем', status: 'done' }
          ]
        },
        {
          id: 'PRO-5',
          title: 'Прогнозирование типа эмульсии (HLB & Phase Inversion)',
          status: 'done',
          priority: 'medium',
          description: 'Автоматическое определение типа эмульсии (O/W или W/O) на основе ГЛБ эмульгаторов и объемных долей фаз.',
          subtasks: [
            { id: 'P5.1', title: 'Расчет ГЛБ системы по Гриффину/Дэвису', status: 'done' },
            { id: 'P5.2', title: 'Определение сплошной и дисперсной фазы', status: 'done' },
            { id: 'P5.3', title: 'Влияние типа эмульсии на модель вязкости Тейлора', status: 'done' }
          ]
        },
        {
          id: 'PRO-6',
          title: 'Предел растворимости и кристаллизация (Solubility Solver)',
          status: 'done',
          priority: 'medium',
          description: 'Проверка концентраций веществ на превышение предела растворимости и выделение твердой фазы (осадка).',
          subtasks: [
            { id: 'P6.1', title: 'Добавление данных о растворимости (г/100мл) в каталог', status: 'done' },
            { id: 'P6.2', title: 'SolubilitySolver для проверки перенасыщения', status: 'done' },
            { id: 'P6.3', title: 'Формирование третьей фазы (Solid Phase / Precipitate)', status: 'done' }
          ]
        }
      ]
    }
  ]);
}
