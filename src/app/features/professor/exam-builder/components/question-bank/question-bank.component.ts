import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AppMessageService } from '../../../../../core/services/app-message';
import { QuestionType } from '../../../../../data/enums/question-type';
import { IQuestionResponse } from '../../../../../data/models/question/iquestion-response';
import { ExamBuilderFacade } from '../../../services/exam-builder.facade';

interface QuestionTypeFilterOption {
  label: string;
  value: QuestionType;
}

@Component({
  selector: 'app-question-bank',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './question-bank.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionBankComponent {
  private static readonly DEFAULT_PAGE_SIZE = 12;

  private readonly appMessageService = inject(AppMessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(ExamBuilderFacade);

  readonly examId = input<number | null>(null);
  readonly courseId = input<number | null>(null);
  readonly pageSize = input<number>(QuestionBankComponent.DEFAULT_PAGE_SIZE);

  readonly assignDone = output<number[]>();
  readonly createNewQuestion = output<void>();
  readonly closeRequested = output<void>();

  readonly searchInput = signal('');
  readonly selectedType = signal<QuestionType>(QuestionType.Unknown);
  readonly selectedQuestionIds = signal<number[]>([]);
  readonly localErrorMessage = signal<string | null>(null);

  private readonly debouncedSearchText = signal('');

  readonly questionTypeOptions: readonly QuestionTypeFilterOption[] = [
    { label: 'All Types', value: QuestionType.Unknown },
    { label: 'MCQ', value: QuestionType.MultipleChoice },
    { label: 'True / False', value: QuestionType.TrueFalse },
    { label: 'Essay', value: QuestionType.Essay },
  ];

  readonly questions = computed(() => this.facade.questionBank().items);
  readonly hasMore = computed(() => this.facade.questionBank().hasMore);
  readonly currentPageIndex = computed(() => this.facade.questionBank().pageIndex);
  readonly isLoading = computed(() => this.facade.loadingQuestionBank());
  readonly isAssigning = computed(() => this.facade.mutatingQuestions());
  readonly errorMessage = computed(() => this.localErrorMessage() ?? this.facade.error());

  readonly selectedCount = computed(() => this.selectedQuestionIds().length);
  readonly isInitialLoading = computed(() => this.isLoading() && this.questions().length === 0);
  readonly isLoadingMore = computed(() => this.isLoading() && this.questions().length > 0);

  readonly canAssignSelected = computed(() => {
    const currentExamId = this.examId() ?? 0;
    return currentExamId > 0 && this.selectedCount() > 0 && !this.isAssigning();
  });

  constructor() {
    effect(
      (onCleanup) => {
        const search = this.searchInput().trim();
        const timerId = setTimeout(() => {
          this.debouncedSearchText.set(search);
        }, 350);

        onCleanup(() => clearTimeout(timerId));
      }
    );

    effect(
      () => {
        const currentCourseId = this.courseId();
        this.selectedType();
        this.debouncedSearchText();
        this.pageSize();

        if (!currentCourseId || currentCourseId <= 0) {
          this.selectedQuestionIds.set([]);
          this.localErrorMessage.set(null);
          this.facade.resetQuestionBank();
          return;
        }

        this.facade.setCourseId(currentCourseId);
        this.selectedQuestionIds.set([]);
        this.localErrorMessage.set(null);
        this.loadPage(1);
      }
    );
  }

  onSearchInputChange(value: string): void {
    this.searchInput.set(value);
  }

  onQuestionTypeChange(value: QuestionType | string | number): void {
    const normalized =
      typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
    const type = Number.isFinite(normalized) ? (normalized as QuestionType) : QuestionType.Unknown;

    this.selectedType.set(type);
  }

  onQuestionListScroll(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target || this.isLoading() || !this.hasMore()) {
      return;
    }

    const threshold = 96;
    const isNearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - threshold;

    if (!isNearBottom) {
      return;
    }

    this.loadPage(this.currentPageIndex() + 1);
  }

  onCloseRequested(): void {
    this.closeRequested.emit();
  }

  isSelected(questionId: number): boolean {
    return this.selectedQuestionIds().includes(questionId);
  }

  toggleSelection(questionId: number): void {
    this.selectedQuestionIds.update((ids) =>
      ids.includes(questionId) ? ids.filter((id) => id !== questionId) : [...ids, questionId],
    );
  }

  assignSelectedQuestions(): void {
    const currentExamId = this.examId();
    if (!currentExamId || currentExamId <= 0) {
      this.localErrorMessage.set('Exam id is required before assigning questions.');
      return;
    }

    const selectedIds = this.selectedQuestionIds();
    if (selectedIds.length === 0 || this.isAssigning()) {
      return;
    }

    this.localErrorMessage.set(null);

    this.facade
      .assignQuestionsToExam(currentExamId, selectedIds)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          // State completion is handled by facade; this finalize keeps stream local.
        }),
      )
      .subscribe({
        next: () => {
          this.appMessageService.addSuccessMessage('Selected questions assigned successfully.');
          this.assignDone.emit(selectedIds);
          this.selectedQuestionIds.set([]);
        },
        error: (error) => {
          this.localErrorMessage.set(
            this.appMessageService.showHttpError(error, 'Failed to assign selected questions.'),
          );
        },
      });
  }

  onCreateNewQuestion(): void {
    this.createNewQuestion.emit();
  }

  trackByQuestionId(_: number, question: IQuestionResponse): number {
    return question.id;
  }

  questionTypeLabel(questionType: number): string {
    switch (questionType) {
      case QuestionType.MultipleChoice:
        return 'MCQ';
      case QuestionType.TrueFalse:
        return 'True / False';
      case QuestionType.Essay:
        return 'Essay';
      default:
        return 'Other';
    }
  }

  private loadPage(pageIndex: number): void {
    const safePageSize = this.normalizePageSize(this.pageSize());

    this.facade
      .loadQuestions(pageIndex, safePageSize, this.debouncedSearchText(), this.selectedType())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error) => {
          this.localErrorMessage.set(
            this.appMessageService.showHttpError(error, 'Failed to load question bank.'),
          );
        },
      });
  }

  private normalizePageSize(value: number): number {
    if (!Number.isFinite(value) || value <= 0) {
      return QuestionBankComponent.DEFAULT_PAGE_SIZE;
    }

    return Math.floor(value);
  }
}
