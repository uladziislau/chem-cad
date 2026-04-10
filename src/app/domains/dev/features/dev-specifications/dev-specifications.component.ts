import { Component } from '@angular/core';

@Component({
  selector: 'app-dev-specifications',
  standalone: true,
  template: `
    <div class="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-900/30 border border-white/5 rounded-3xl">
      <header>
        <h1 class="text-3xl font-bold tracking-tight text-white mb-2">Спецификации Песочницы</h1>
        <p class="text-slate-400 max-w-2xl">
          Фиксация архитектурных ограничений и правил взаимодействия на этапе прототипирования в AI Studio.
        </p>
      </header>

      <div class="space-y-6">
        <!-- Rule 1 -->
        <div class="p-6 bg-slate-900/50 border border-white/10 rounded-2xl">
          <div class="flex items-center gap-3 mb-4">
            <span class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold font-mono text-sm">01</span>
            <h2 class="text-xl font-bold text-white">Однопоточная архитектура</h2>
          </div>
          <p class="text-slate-300 leading-relaxed">
            В текущей среде песочницы Web Workers не поддерживаются. Все физические и математические расчеты (ChemCore) выполняются синхронно в основном потоке браузера.
          </p>
        </div>

        <!-- Rule 2 -->
        <div class="p-6 bg-slate-900/50 border border-white/10 rounded-2xl">
          <div class="flex items-center gap-3 mb-4">
            <span class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold font-mono text-sm">02</span>
            <h2 class="text-xl font-bold text-white">Отказ от пользовательского CRUD</h2>
          </div>
          <p class="text-slate-300 leading-relaxed mb-4">
            Пользовательский интерфейс не должен содержать форм для создания, редактирования или удаления базовых сущностей (ингредиентов, прекурсоров), так как данные не сохраняются между сессиями.
          </p>
          <div class="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <h3 class="text-sm font-bold text-indigo-400 mb-2 uppercase tracking-wider">2.1 AI Data Ownership (Монополия на данные)</h3>
            <p class="text-sm text-slate-300">
              Владельцем всех данных является AI-агент. Любые изменения в базе данных (добавление новых веществ, изменение параметров) выполняются исключительно агентом через прямое редактирование исходного кода (TypeScript/JSON файлов).
            </p>
          </div>
        </div>

        <!-- Rule 3 -->
        <div class="p-6 bg-slate-900/50 border border-white/10 rounded-2xl">
          <div class="flex items-center gap-3 mb-4">
            <span class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold font-mono text-sm">03</span>
            <h2 class="text-xl font-bold text-white">Отказ от Runtime AI</h2>
          </div>
          <p class="text-slate-300 leading-relaxed">
            На текущем этапе прототипирования запрещена интеграция Gemini API непосредственно в код приложения. Роль интеллектуального помощника полностью делегирована AI-агенту, работающему поверх песочницы.
          </p>
        </div>
      </div>
    </div>
  `
})
export class DevSpecificationsComponent {}
