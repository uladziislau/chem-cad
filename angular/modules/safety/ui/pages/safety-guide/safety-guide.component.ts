import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-safety-guide',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-8">
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 text-rose-600 mb-4">
          <mat-icon class="text-4xl w-10 h-10">warning</mat-icon>
        </div>
        <h1 class="text-3xl font-bold text-slate-900">Техника безопасности</h1>
        <p class="text-slate-600 mt-2 text-lg">Обязательные правила при работе в химической лаборатории или на производстве.</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="p-6 sm:p-8 space-y-8">
          
          <section>
            <h2 class="text-xl font-semibold text-slate-900 flex items-center mb-4">
              <mat-icon class="text-indigo-600 mr-2">checkroom</mat-icon>
              Средства индивидуальной защиты (СИЗ)
            </h2>
            <ul class="list-disc list-inside space-y-2 text-slate-700 ml-2">
              <li><strong>Защитные очки:</strong> Обязательны при работе с любыми жидкостями и порошками для предотвращения попадания брызг в глаза.</li>
              <li><strong>Перчатки:</strong> Используйте нитриловые или латексные перчатки. При работе с агрессивными растворителями — специальные химически стойкие перчатки.</li>
              <li><strong>Халат или фартук:</strong> Защищает одежду и кожу от случайных проливов.</li>
              <li><strong>Респиратор:</strong> Необходим при работе с летучими веществами (спирты, эфирные масла в больших объемах) и мелкодисперсными порошками.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-slate-900 flex items-center mb-4">
              <mat-icon class="text-indigo-600 mr-2">air</mat-icon>
              Требования к помещению
            </h2>
            <ul class="list-disc list-inside space-y-2 text-slate-700 ml-2">
              <li><strong>Вентиляция:</strong> Помещение должно быть оборудовано приточно-вытяжной вентиляцией. Работы с летучими веществами проводить только под вытяжным зонтом.</li>
              <li><strong>Освещение:</strong> Рабочее место должно быть хорошо освещено.</li>
              <li><strong>Доступ к воде:</strong> Обязательно наличие раковины с проточной водой для экстренного промывания глаз или кожи.</li>
              <li><strong>Аптечка:</strong> В легкодоступном месте должна находиться укомплектованная аптечка первой помощи.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-slate-900 flex items-center mb-4">
              <mat-icon class="text-indigo-600 mr-2">science</mat-icon>
              Правила работы с реактивами
            </h2>
            <ul class="list-disc list-inside space-y-2 text-slate-700 ml-2">
              <li><strong>Маркировка:</strong> Вся тара должна быть четко подписана (название, дата, концентрация, класс опасности).</li>
              <li><strong>Хранение:</strong> Храните несовместимые вещества раздельно (например, кислоты отдельно от щелочей). Огнеопасные вещества — в специальных металлических шкафах.</li>
              <li><strong>Смешивание:</strong> Всегда добавляйте активное вещество в растворитель (например, кислоту в воду), а не наоборот!</li>
              <li><strong>Утилизация:</strong> Не сливайте химические отходы в канализацию. Собирайте их в специальные емкости для последующей утилизации.</li>
            </ul>
          </section>

          <div class="bg-rose-50 p-6 rounded-xl border border-rose-100 mt-8">
            <h3 class="text-lg font-semibold text-rose-900 mb-2">В экстренной ситуации:</h3>
            <p class="text-rose-800">
              При попадании химикатов на кожу или в глаза немедленно промойте пораженный участок большим количеством проточной воды в течение 15 минут и обратитесь за медицинской помощью. При возгорании используйте огнетушитель, соответствующий классу пожара (порошковый или углекислотный для химических веществ).
            </p>
          </div>

        </div>
      </div>
    </div>
  `
})
export class SafetyGuideComponent {}
