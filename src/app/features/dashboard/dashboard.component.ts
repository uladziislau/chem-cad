import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <div class="space-y-8">
      <header class="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
        <h1 class="text-4xl font-bold tracking-tight text-slate-900 mb-4">Добро пожаловать в ChemCraft</h1>
        <p class="text-lg text-slate-600 max-w-2xl mx-auto">
          Ваша профессиональная система для разработки и синтеза безопасных химических продуктов.
          Создавайте средства гигиены, парфюмерию и бытовую химию.
        </p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <a routerLink="/classroom" class="group block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all">
          <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <mat-icon>school</mat-icon>
          </div>
          <h2 class="text-xl font-semibold text-slate-900 mb-2">Учебный класс</h2>
          <p class="text-slate-600">Интерактивные уроки и задания для изучения основ химии.</p>
        </a>

        <a routerLink="/quantum" class="group block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all">
          <div class="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors">
            <mat-icon>blur_on</mat-icon>
          </div>
          <h2 class="text-xl font-semibold text-slate-900 mb-2">Квантовый уровень</h2>
          <p class="text-slate-600">Познайте природу атомов. Конструктор элементов и субатомных частиц.</p>
        </a>

        <a routerLink="/bonding" class="group block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all">
          <div class="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <mat-icon>compare_arrows</mat-icon>
          </div>
          <h2 class="text-xl font-semibold text-slate-900 mb-2">Арена связей</h2>
          <p class="text-slate-600">Посмотрите, как атомы делят электроны и образуют молекулы.</p>
        </a>

        <a routerLink="/oop-chemistry" class="group block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all">
          <div class="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <mat-icon>data_object</mat-icon>
          </div>
          <h2 class="text-xl font-semibold text-slate-900 mb-2">ООП-Химия</h2>
          <p class="text-slate-600">Эксперимент: программируем законы химии через классы и интерфейсы.</p>
        </a>

        <a routerLink="/thermodynamics" class="group block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all">
          <div class="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <mat-icon>bolt</mat-icon>
          </div>
          <h2 class="text-xl font-semibold text-slate-900 mb-2">Термодинамика</h2>
          <p class="text-slate-600">Узнайте, почему происходят реакции: энергия, энтропия и хаос.</p>
        </a>

        <a routerLink="/lab" class="group block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all">
          <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <mat-icon>science</mat-icon>
          </div>
          <h2 class="text-xl font-semibold text-slate-900 mb-2">Вирт. Лаборатория</h2>
          <p class="text-slate-600">Симулятор химических реакций в реальном времени с расчетом стехиометрии.</p>
        </a>

        <a routerLink="/advanced" class="group block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all">
          <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <mat-icon>3d_rotation</mat-icon>
          </div>
          <h2 class="text-xl font-semibold text-slate-900 mb-2">3D Моделирование</h2>
          <p class="text-slate-600">Передовые технологии: 2D/3D визуализация молекул и расчет свойств.</p>
        </a>

        <a routerLink="/recipes" class="group block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all">
          <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <mat-icon>menu_book</mat-icon>
          </div>
          <h2 class="text-xl font-semibold text-slate-900 mb-2">База рецептур</h2>
          <p class="text-slate-600">Проверенные и безопасные формулы для старта вашего производства.</p>
        </a>

        <a routerLink="/formulator" class="group block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:teal-200 transition-all">
          <div class="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <mat-icon>biotech</mat-icon>
          </div>
          <h2 class="text-xl font-semibold text-slate-900 mb-2">Формулатор</h2>
          <p class="text-slate-600">Интерактивный инструмент для создания собственных уникальных продуктов.</p>
        </a>

        <a routerLink="/safety" class="group block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:rose-200 transition-all">
          <div class="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <mat-icon>warning</mat-icon>
          </div>
          <h2 class="text-xl font-semibold text-slate-900 mb-2">Безопасность</h2>
          <p class="text-slate-600">Обязательные правила работы в промышленном и лабораторном помещении.</p>
        </a>
      </div>
    </div>
  `
})
export class DashboardComponent {}
