import { Component, input, ChangeDetectionStrategy, signal } from '@angular/core';
import { connectivitySignal } from '../../../services/student-exam-facade';

@Component({
  selector: 'app-exam-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="exam-header">
      <div class="status" [class.connected]="connected()" [class.disconnected]="!connected()">
        <i class="bi" [class]="connected() ? 'bi-wifi' : 'bi-wifi-off'"></i>
        <span class="status-text">{{ connected() ? 'Connected' : 'Disconnected' }}</span>
      </div>
      <div class="timer">{{ countdown() }}</div>
      <div class="exam-id">ID : {{ studentId().split('-')[0] }}</div>
    </header>
  `,
  styleUrl: './exam-header.css',
})
export class ExamHeaderComponent {
  readonly countdown = input.required<string>();
  readonly studentId = input.required<string>();
  // connected online

  readonly connected = connectivitySignal();
}

