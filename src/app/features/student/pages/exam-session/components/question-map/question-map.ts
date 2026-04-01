import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-question-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="question-map">
      <div class="grid">
        @for (qId of questionIds(); track $index) {
          <button
            type="button"
            class="grid-item"
            [class.answered]="!!answeredIds()[qId]"
            [class.active]="currentIndex() === $index"
            [class.marked]="!!markedIds()[qId]"
            (click)="jumpTo.emit($index)"
          >
            {{ $index + 1 }}
            @if (markedIds()[qId]) {
              <i class="bi bi-flag-fill flag-icon"></i>
            }
          </button>
        }
      </div>

      <button 
        type="button" 
        class="submit-btn" 
        (click)="submit.emit()" 
        [disabled]="isLoading()"
      >
        Submit Exam
      </button>

      @if (errorMessage()) {
        <div class="error-msg">{{ errorMessage() }}</div>
      }
    </aside>
  `,
  styles: [`
    .question-map {
      background: white;
      border-radius: 0.5rem;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.6rem;
      flex: 1;
      align-content: start;
    }

    .grid-item {
      aspect-ratio: 1;
      border: none;
      color: #374151; /* Dark Gray */
      font-size: 1.15rem;
      font-weight: 500;
      border-radius: 0.4rem;
      background: #D1D5DB; /* Default light gray for unanswered */
      cursor: pointer;
      position: relative;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Used for dark teal answered state, or default light gray. The design image asked for answers to be dark teal. */
    .grid-item.answered {
      background: #357B85;
      color: white;
    }

    /* The currently active question */
    .grid-item.active {
      background: #5FC4B6;
      color: #111827;
      /* Add inner border/shadow effect to differentiate */
      box-shadow: inset 0 0 0 2px #2F6F67;
    }

    /* Marked state overrides default colors with orange */
    .grid-item.marked {
      background: #F59E0B;
      color: white;
    }

    .flag-icon {
      position: absolute;
      top: 2px;
      right: 4px;
      font-size: 0.65rem;
      color: #DC2626; /* Red internal flag on the orange box based on design */
    }

    .grid-item:hover {
      filter: brightness(0.95);
    }

    .submit-btn {
      width: 100%;
      margin-top: 2rem;
      background: #DC2626; /* Bright Red */
      color: #fff;
      border: none;
      border-radius: 0.35rem;
      padding: 1rem;
      font-size: 1.15rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .submit-btn:hover:not(:disabled) {
      background: #B91C1C;
    }

    .submit-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .error-msg {
      margin-top: 1rem;
      color: #DC2626;
      font-weight: 600;
      text-align: center;
    }
  `]
})
export class QuestionMapComponent {
  readonly questionIds = input.required<number[]>();
  readonly currentIndex = input.required<number>();
  readonly answeredIds = input.required<Record<number, number>>();
  readonly markedIds = input.required<Record<number, boolean>>();
  readonly isLoading = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  readonly jumpTo = output<number>();
  readonly submit = output<void>();
}
