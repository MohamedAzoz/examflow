import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';

@Component({
  selector: 'app-question-map',
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
            <span class="question-number">{{ $index + 1 }}</span>
            @if (markedIds()[qId]) {
              <i class="bi bi-flag-fill flag-icon"></i>
            }
          </button>
        }
      </div>

      <button type="button" class="submit-btn" (click)="submit.emit()" [disabled]="!isDisabled()">
        Submit Exam
      </button>

      @if (errorMessage()) {
        <div class="error-msg">{{ errorMessage() }}</div>
      }
    </aside>
  `,
  styles: [
    `
      * {
        padding: 0;
        margin: 0;
        box-sizing: border-box;
      }
      .question-map {
        background: var(--grades-color);
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
        width: 90%;
        aspect-ratio: 1/1;
        border: none;
        border-radius: 0.4rem;
        background: var(--gray-color);
        cursor: pointer;
        position: relative;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .question-number {
        font-size: 1.4rem;
        font-weight: 600;
      }

      /* Used for dark teal answered state, or default light gray. The design image asked for answers to be dark teal. */
      .grid-item.answered {
        background: var(--teal);
        color: white;
      }

      /* The currently active question */
      .grid-item.active {
        background: var(--border-teal);
        color: var(--text-gray);

        /* Add inner border/shadow effect to differentiate */
        box-shadow: inset 0 0 0 2px #2f6f67;
        .question-number {
          width: 70%;
          height: 70%;
          border-radius: 20%;
          box-shadow: 0 0 0 2px var(--text-gray);
        }
        border: none;
      }

      /* Marked state overrides default colors with orange */
      .grid-item.marked {
        background: var(--orange);
      }

      .flag-icon {
        position: absolute;
        top: 2px;
        right: 4px;
        font-size: 0.65rem;
        color: #dc2626; /* Red internal flag on the orange box based on design */
      }

      .grid-item:hover {
        filter: brightness(0.95);
      }

      .submit-btn {
        width: 100%;
        margin-top: 2rem;
        background: #dc2626; /* Bright Red */
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
        background: #b91c1c;
      }

      .submit-btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      .error-msg {
        margin-top: 1rem;
        color: #dc2626;
        font-weight: 600;
        text-align: center;
      }

      @media (max-width: 768px) {
        .question-map {
          padding: 1rem;
        }
        .grid {
          grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
          gap: 0.5rem;
        }
        .question-number {
          font-size: 1.2rem;
        }
      }

      @media (max-width: 480px) {
        .grid {
          grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
          gap: 0.4rem;
        }
        .question-number {
          font-size: 1rem;
        }
        .submit-btn {
          padding: 0.75rem;
          font-size: 1rem;
          margin-top: 1.5rem;
        }
      }
    `,
  ],
})
export class QuestionMapComponent {
  readonly questionIds = input.required<number[]>();
  readonly currentIndex = input.required<number>();
  readonly answeredIds = input.required<Record<number, any>>();
  readonly markedIds = input.required<Record<number, boolean>>();
  readonly errorMessage = input<string | null>(null);
  readonly availableTimeToStart = input<number>(0);

  readonly jumpTo = output<number>();
  readonly submit = output<void>();
  readonly isDisabled = computed(() => this.availableTimeToStart() <= Math.floor(new Date().getTime() / 1000));
}
