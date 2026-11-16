import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EPICS, Epic } from '@root-modules/development';

@Component({
  selector: 'app-development-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './development-board.component.html',
  styleUrl: './development-board.component.css'
})
export class DevelopmentBoardComponent {
  viewMode = signal<'active' | 'archive'>('active');
  epics = signal<Epic[]>(EPICS);
}
