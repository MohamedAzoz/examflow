import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuestionType } from '../../../../../data/enums/question-type';

export interface QuestionBankFilterPayload {
  questionType: QuestionType;
}

@Component({
  selector: 'app-question-bank-filter-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './question-bank-filter-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionBankFilterModalComponent {
  readonly visible = input(false);
  readonly currentQuestionType = input<QuestionType>(QuestionType.Unknown);

  readonly closeModal = output<void>();
  readonly applyFilters = output<QuestionBankFilterPayload>();

  readonly draftQuestionType = signal<QuestionType>(QuestionType.Unknown);

  constructor() {
    effect(() => {
      if (!this.visible()) {
        return;
      }

      this.draftQuestionType.set(this.currentQuestionType());
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target !== event.currentTarget) {
      return;
    }

    this.onClose();
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onApply(): void {
    this.applyFilters.emit({
      questionType: this.draftQuestionType(),
    });
  }

  onReset(): void {
    this.draftQuestionType.set(QuestionType.Unknown);

    this.onApply();
  }

  toQuestionType(value: unknown): QuestionType {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? (numeric as QuestionType) : QuestionType.Unknown;
  }
}
