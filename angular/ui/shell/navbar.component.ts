import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <nav class="bg-slate-950 text-white border-b border-white/5 backdrop-blur-xl sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-8">
            <a routerLink="/" class="flex items-center gap-2 text-xl font-bold tracking-tighter text-indigo-400">
              <mat-icon class="text-indigo-500">layers</mat-icon>
              ХимСАПР
            </a>
            <div class="hidden md:block">
              <div class="flex items-baseline space-x-1">
                <a routerLink="/" routerLinkActive="bg-white/5 text-white" [routerLinkActiveOptions]="{exact: true}" class="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all">Смеситель</a>
                <a routerLink="/molecule" routerLinkActive="bg-white/5 text-white" class="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all">Молекулы</a>
                <a routerLink="/dev" routerLinkActive="bg-white/5 text-white" class="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all">Разработка</a>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Система Активна</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {}
