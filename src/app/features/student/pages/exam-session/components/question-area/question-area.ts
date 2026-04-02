import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { QuestionType } from '../../../../../../data/enums/question-type';

@Component({
  selector: 'app-question-area',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="question-card">
      <div class="card-top-bar">
        <h2 class="question-title">{{ title() }}</h2>
      </div>

      @if (questType() === essay) {
        @if (imageUrl() !== '' && imageUrl() !== undefined) {
          <div class="image-container">
            <img class="question-image" [src]="imageUrl()" />
          </div>
        }
        <div class="answer-area">
          <textarea
            name="answer"
            id="answer"
            rows="5"
            placeholder="Write your answer here"
            [value]="essayValue()"
            (input)="essayAnswer.emit($any($event.target).value)"
          ></textarea>
        </div>
      } @else {
        <div class="options">
          @for (option of options(); track $index) {
            <label class="option-label" [class.selected]="selectedOptionId() === option.optionId">
              <input
                type="radio"
                name="questionOption"
                [value]="option.optionId"
                [checked]="selectedOptionId() === option.optionId"
                (change)="optionSelected.emit(option.optionId)"
              />
              <div class="custom-radio"></div>
              <span>{{ option.optionText }}</span>
            </label>
          }
        </div>
      }

      <div class="paging">
        <button type="button" class="btn-nav" (click)="previous.emit()" [disabled]="isFirst()">
          Previous
        </button>

        <button
          class="btn-mark"
          [class.marked]="isMarked()"
          (click)="toggleMark.emit()"
          title="Mark Question"
        >
          <i class="bi bi-flag-fill"></i>
        </button>

        <button type="button" class="btn-nav" (click)="next.emit()" [disabled]="isLast()">
          Next
        </button>
      </div>
    </article>
  `,
  styleUrl: './question-area.css',
})
export class QuestionAreaComponent {
  readonly title = input.required<string>();
  readonly imageUrl = input<string>('');
  readonly questType = input.required<QuestionType>();
  readonly options = input.required<any[]>();
  readonly selectedOptionId = input<number | string | null>(null);
  readonly essayValue = input<string>('');
  readonly isMarked = input<boolean>(false);

  readonly isFirst = input<boolean>(false);
  readonly isLast = input<boolean>(false);

  readonly optionSelected = output<number>();
  readonly essayAnswer = output<string>();
  readonly toggleMark = output<void>();
  readonly previous = output<void>();
  readonly next = output<void>();

  readonly essay = QuestionType.Essay;
}
