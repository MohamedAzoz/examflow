import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-exam-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="exam-header">
      <div class="status">
        <i class="bi bi-wifi-2"></i>
        <span class="status-text">Connected</span>
      </div>
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
        padding: 0.1rem 1rem;
        background: var(--grades-color);
      }
      
      .status {
        display: flex;
        gap: 0.5rem;
        justify-content: start;
        align-items: center;
      }
      .status-text {
        font-size: 1.5rem;
        font-weight: 500;
        color: var(--success-color);
      }
      .bi-wifi-2 {
        font-size: 3rem;
        color: var(--success-color);
        position: relative;
        bottom: 0.5vw;
      }

      .timer {
        font-size: 3rem;
        font-weight: 500;
        letter-spacing: 1px;
      }
      .exam-id {
        font-weight: 500;
        font-size: 1.2rem;
      }
      
      @media (max-width: 768px) {
        .bi-wifi-2 {
          font-size: 2rem;
        }
        .status-text {
          font-size: 1.2rem;
        }
        .timer {
          font-size: 1.5rem;
        }
        .exam-id {
          font-size: 1rem;
          text-wrap: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
      }

      @media (max-width: 480px) {
        .exam-header {
          padding: 0.25rem 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem;
        }
        .status {
          order: 1;
        }
        .timer {
          order: 2;
          font-size: 1.3rem;
          margin: 0 1rem;
        }
        .exam-id {
          order: 3;
          width: 100%;
          text-align: center;
          font-size: 0.9rem;
          text-wrap: nowrap;
          text-overflow: ellipsis;
        }
        .bi-wifi-2 {
          font-size: 1.5rem;
        
        }
        .status-text {
          font-size: 1rem;
        }
      }
    `,
  ],
})
export class ExamHeaderComponent {
  readonly countdown = input.required<string>();
  readonly studentId = input.required<string>();
}
