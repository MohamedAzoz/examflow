import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-exam-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="exam-header">
      <div class="status"><i class="bi bi-wifi-2" style="font-size: 2.5rem;"></i> Connected</div>
      <div class="timer">{{ countdown() }}</div>
      <div class="exam-id">ID : {{ studentId() }}</div>
    </header>
  `,
  styles: [
    `
      .exam-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        background: #f3f4f6;
      }

      .status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #10b981;
        font-weight: 500;
        font-size: 1.5rem;
      }

      .timer {
        font-size: 2rem;
        font-weight: 700;
        color: #111827;
        letter-spacing: 1px;
      }
      .exam-id {
        font-weight: 500;
        color: #374151;
        font-size: 1.1rem;
        white-space: nowrap; 
        overflow: hidden; 
        text-overflow: ellipsis; 
        width: 200px;
      }
    `,
  ],
})
export class ExamHeaderComponent {
  readonly countdown = input.required<string>();
  readonly studentId = input.required<string>();
}
