import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-overview-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview-stat-card.component.html',
  styleUrl: './overview-stat-card.component.css',
})
export class OverviewStatCardComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: number;
}
