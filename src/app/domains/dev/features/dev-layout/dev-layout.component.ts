import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-dev-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="space-y-6">
      <nav class="flex space-x-4 border-b border-white/10 pb-4">
        <a routerLink="/dev/board" routerLinkActive="bg-indigo-500/10 text-indigo-400 border-indigo-500/30" class="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 border border-transparent transition-all">
          Kanban Board
        </a>
        <a routerLink="/dev/specs" routerLinkActive="bg-indigo-500/10 text-indigo-400 border-indigo-500/30" class="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 border border-transparent transition-all">
          Спецификации
        </a>
      </nav>
      
      <router-outlet></router-outlet>
    </div>
  `
})
export class DevLayoutComponent {}
