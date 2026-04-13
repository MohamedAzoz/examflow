import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { QuestionType } from '../../../../../data/enums/question-type';

@Component({
  selector: 'app-question-area',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './question-area.html',
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
  readonly isDirty = input<boolean>(false);
  readonly navigationBlocked = input<boolean>(false);
  readonly isSavingEssay = input<boolean>(false);

  readonly isFirst = input<boolean>(false);
  readonly isLast = input<boolean>(false);

  readonly optionSelected = output<number>();
  readonly essayAnswer = output<string>();
  readonly saveEssay = output<void>();
  readonly toggleMark = output<void>();
  readonly previous = output<void>();
  readonly next = output<void>();

  readonly essay = QuestionType.Essay;

  readonly navButtonClass =
    'btn rounded-lg border border-[var(--color-text-secondary)] bg-card-bg px-4 py-2 text-lg font-medium text-text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[110px] md:px-6 md:py-2.5 md:text-2xl';

  textDirection(text?: string): 'rtl' | 'ltr' {
    if (!text) return 'ltr';
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text) ? 'rtl' : 'ltr';
  }

  optionClass(optionId: number): string {
    const isSelected = this.selectedOptionId() === optionId;
    const base =
      'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3.5 text-base font-medium transition-all duration-150 md:px-5 md:py-4 md:text-xl';

    if (isSelected) {
      return `${base} border-[var(--color-primary)] bg-[var(--color-border-teal)] text-[var(--color-text-dark)]`;
    }

    return `${base} border-[var(--color-border)] bg-[var(--color-main-bg)] text-[var(--color-text-dark)] hover:bg-[var(--color-surface)]`;
  }

  optionRadioClass(optionId: number): string {
    const isSelected = this.selectedOptionId() === optionId;

    if (isSelected) {
      return 'flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-primary)]';
    }

    return 'flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-text-secondary)]';
  }

  optionRadioDotClass(optionId: number): string {
    return this.selectedOptionId() === optionId
      ? 'h-3 w-3 rounded-full bg-[var(--color-primary)]'
      : 'hidden';
  }

  markButtonClass(): string {
    const base =
      'inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] md:h-12 md:w-12';

    if (this.isMarked()) {
      return `${base} border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]`;
    }

    return `${base} border-[var(--color-border)] bg-[var(--color-card-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]`;
  }
}
