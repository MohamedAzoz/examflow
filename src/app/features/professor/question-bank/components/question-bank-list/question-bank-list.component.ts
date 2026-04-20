import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { QuestionType } from '../../../../../data/enums/question-type';
import { IQuestionResponse } from '../../../../../data/models/question/iquestion-response';

@Component({
  selector: 'app-question-bank-list',
  standalone: true,
  templateUrl: './question-bank-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionBankListComponent {
  readonly questions = input<readonly IQuestionResponse[]>([]);
  readonly loading = input(false);
  readonly pageIndex = input(1);
  readonly pageSize = input(8);
  readonly totalCount = input(0);
  readonly hasMore = input(false);
  readonly mutating = input(false);

  readonly editQuestion = output<IQuestionResponse>();
  readonly deleteQuestion = output<IQuestionResponse>();
  readonly nextPage = output<void>();
  readonly previousPage = output<void>();

  readonly showingFrom = computed(() => {
    if (this.totalCount() === 0) {
      return 0;
    }

    return (this.pageIndex() - 1) * this.pageSize() + 1;
  });

  readonly showingTo = computed(() => {
    if (this.totalCount() === 0) {
      return 0;
    }

    const pageEnd = this.pageIndex() * this.pageSize();
    return pageEnd > this.totalCount() ? this.totalCount() : pageEnd;
  });

  readonly canGoPrevious = computed(() => this.pageIndex() > 1 && !this.loading());
  readonly canGoNext = computed(() => this.hasMore() && !this.loading());

  trackByQuestionId(_: number, question: IQuestionResponse): number {
    return question.id;
  }

  onEdit(question: IQuestionResponse): void {
    this.editQuestion.emit(question);
  }

  onDelete(question: IQuestionResponse): void {
    this.deleteQuestion.emit(question);
  }

  onPreviousPage(): void {
    this.previousPage.emit();
  }

  onNextPage(): void {
    this.nextPage.emit();
  }

  questionTypeLabel(questionType: number): string {
    switch (questionType) {
      case QuestionType.MultipleChoice:
        return 'MCQ';
      case QuestionType.TrueFalse:
        return 'T / F';
      case QuestionType.Essay:
        return 'Essay';
      default:
        return 'Unknown';
    }
  }

  questionTypeClass(questionType: number): string {
    switch (questionType) {
      case QuestionType.MultipleChoice:
        return 'bg-cyan-100 text-cyan-700';
      case QuestionType.TrueFalse:
        return 'bg-emerald-100 text-emerald-700';
      case QuestionType.Essay:
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }
}
