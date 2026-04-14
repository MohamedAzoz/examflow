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
    'btn flex h-11 lg:h-13 items-center justify-center rounded-lg border border-text-secondary bg-card-bg px-1.5 py-1.5 md:px-4 md:py-2.5 text-text-dark transition text-sm md:text-xl hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[110px]';

  textDirection(text?: string): 'rtl' | 'ltr' {
    if (!text) return 'ltr';
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text) ? 'rtl' : 'ltr';
  }

  optionClass(optionId: number): string {
    const isSelected = this.selectedOptionId() === optionId;
    const base =
      'flex btn items-center gap-3 rounded-lg border transition-all duration-150 px-4 py-2 text-base md:px-5 md:py-4 md:text-xl font-medium lg:font-semibold shadow-sm';

    if (isSelected) {
    return `${base} border-primary bg-border-teal dark:bg-border-teal/50 text-text-dark`;
    }

    return `${base} border-text-dark/30 bg-main-bg/20 text-text-dark hover:bg-surface`;
  }

  optionRadioClass(optionId: number): string {
    const isSelected = this.selectedOptionId() === optionId;

    if (isSelected) {
      return 'flex h-6 w-6 items-center justify-center rounded-full border border-primary';
    }

    return 'flex h-6 w-6 items-center justify-center rounded-full border border-text-secondary';
  }

  optionRadioDotClass(optionId: number): string {
    return this.selectedOptionId() === optionId ? 'h-3 w-3 rounded-full bg-primary' : 'hidden';
  }

  markButtonClass(): string {
    const base =
      'inline-flex btn h-11 lg:h-13 w-11 lg:w-13 items-center justify-center rounded-lg border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lightmd:h-12 md:w-12';

    if (this.isMarked()) {
      return `${base} border-orange bg-orange/20 text-orange hover:text-text-secondary hover:bg-surface`;
    }

    return `${base} border-border bg-card-bg text-text-secondary hover:text-orange hover:bg-orange/40`;
  }
}
