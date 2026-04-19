import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuestionType } from '../../../../../../../data/enums/question-type';

@Component({
  selector: 'app-bank-filter-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bank-filter-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankFilterModalComponent {
  readonly selectedType = model<QuestionType>(QuestionType.Unknown);

  protected readonly tempSelectedType = signal<QuestionType>(QuestionType.Unknown);

  constructor() {
    // Initialize temp state with current model value
    this.tempSelectedType.set(this.selectedType());
  }

  readonly options = [
    { label: 'All Types', value: QuestionType.Unknown },
    { label: 'Multiple Choice (MCQ)', value: QuestionType.MultipleChoice },
    { label: 'True / False', value: QuestionType.TrueFalse },
    { label: 'Essay', value: QuestionType.Essay },
  ];

  readonly applied = output<void>();
  readonly closed = output<void>();

  onApply(): void {
    this.selectedType.set(this.tempSelectedType());
    this.applied.emit();
  }

  onClearAll(): void {
    this.tempSelectedType.set(QuestionType.Unknown);
  }

  onClose(): void {
    this.closed.emit();
  }
}
