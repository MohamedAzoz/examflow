import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { QuestionType } from '../../../../../data/enums/question-type';
import { IQuestionResponse } from '../../../../../data/models/question/iquestion-response';

@Component({
  selector: 'app-question-bank-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './question-bank-panel.component.html',
  styleUrl: './question-bank-panel.component.css',
})
export class QuestionBankPanelComponent implements OnDestroy {
  @Input() questions: IQuestionResponse[] = [];
  @Input() selectedQuestionIds: number[] = [];
  @Input() searchValue = '';
  @Input() selectedQuestionType = QuestionType.Unknown;
  @Input() loading = false;
  @Input() hasMore = true;
  @Input() assigning = false;

  @Output() searchChanged = new EventEmitter<string>();
  @Output() questionTypeChanged = new EventEmitter<number>();
  @Output() toggleQuestionSelection = new EventEmitter<number>();
  @Output() loadMoreQuestions = new EventEmitter<void>();
  @Output() assignSelectedQuestions = new EventEmitter<void>();
  @Output() createQuestion = new EventEmitter<void>();
  @Output() exitBuilder = new EventEmitter<void>();

  protected readonly QuestionType = QuestionType;
  protected readonly typeOptions = [
    { value: QuestionType.Unknown, label: 'All Types' },
    { value: QuestionType.MultipleChoice, label: 'Multiple Choice' },
    { value: QuestionType.TrueFalse, label: 'True / False' },
    { value: QuestionType.Essay, label: 'Essay' },
  ];

  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  protected onSearchInput(value: string): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.searchChanged.emit(value);
    }, 300);
  }

  protected onQuestionTypeChange(value: string): void {
    const parsed = Number(value);
    this.questionTypeChanged.emit(Number.isFinite(parsed) ? parsed : QuestionType.Unknown);
  }

  protected onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const threshold = 100;
    const reachedBottom =
      element.scrollTop + element.clientHeight >= element.scrollHeight - threshold;

    if (reachedBottom && this.hasMore && !this.loading) {
      this.loadMoreQuestions.emit();
    }
  }

  protected isSelected(questionId: number): boolean {
    return this.selectedQuestionIds.includes(questionId);
  }

  protected onToggleSelection(questionId: number): void {
    this.toggleQuestionSelection.emit(questionId);
  }

  protected typeLabel(questionType: number): string {
    if (questionType === QuestionType.MultipleChoice) {
      return 'MCQ';
    }

    if (questionType === QuestionType.TrueFalse) {
      return 'True/False';
    }

    if (questionType === QuestionType.Essay) {
      return 'Essay';
    }

    return 'Unknown';
  }

  protected selectedCount(): number {
    return this.selectedQuestionIds.length;
  }
}
