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

  textDirection(text?: string): 'rtl' | 'ltr' {
    if (!text) return 'ltr';
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text) ? 'rtl' : 'ltr';
  }
}
