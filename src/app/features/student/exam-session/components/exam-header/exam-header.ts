import { Component, input, ChangeDetectionStrategy, signal } from '@angular/core';
import { connectivitySignal } from '../../../services/student-exam-facade';

@Component({
  selector: 'app-exam-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="sticky top-0 z-40 flex flex-wrap items-center justify-between border-b border-border bg-card-bg p-3 shadow-sm sm:px-3 md:px-4"
    >
      <div
        [class]="
          connected()
            ? 'flex items-center gap-2 text-sm font-medium text-success sm:text-base md:text-lg'
            : 'flex items-center gap-2 text-sm font-medium text-danger sm:text-base md:text-lg'
        "
      >
        <i [class]="connected() ? 'status-icon pi pi-wifi' : 'status-icon pi pi-ban'"></i>
        <span>{{ connected() ? 'Connected' : 'Disconnected' }}</span>
      </div>

      <div
        class="text-2xl font-semibold leading-none tracking-normal text-text-dark sm:text-3xl md:text-4xl"
      >
        {{ countdown() }}
      </div>

      <div
        class="whitespace-nowrap text-xs font-medium text-text-dark sm:text-sm md:text-lg"
      >
        ID : {{ studentId().split('-')[0] }}
      </div>
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
