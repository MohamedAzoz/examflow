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
import { AppMessageService } from '../../../../../core/services/app-message';
import { QuestionType } from '../../../../../data/enums/question-type';
import {
  IAssignQuestion,
  IAssignQuestionsToExam,
} from '../../../../../data/models/ExamQuestions/IAssignQuestionsToExam';
import { IQuestionResponse } from '../../../../../data/models/question/iquestion-response';
import { ExamBuilderFacade } from '../../../services/exam-builder.facade';

import { BankFilterModalComponent } from './components/bank-filter-modal/bank-filter-modal.component';

@Component({
  selector: 'app-question-bank',
  standalone: true,
  imports: [CommonModule, FormsModule, BankFilterModalComponent],
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
  readonly selectForView = output<IQuestionResponse>();
  readonly viewedQuestionId = input<number | null>(null);

  onSelectForView(question: IQuestionResponse): void {
    this.selectForView.emit(question);
  }

  readonly searchInput = signal('');
  readonly selectedType = signal<QuestionType>(QuestionType.Unknown);
  readonly localErrorMessage = signal<string | null>(null);

  private readonly debouncedSearchText = signal('');

  readonly isFilterOpen = signal(false);

  toggleFilterModal(): void {
    this.isFilterOpen.update((v) => !v);
  }

  getQuestionTypeBadgeClass(questionType: number): string {
    switch (questionType) {
      case QuestionType.MultipleChoice:
        return 'bg-teal-100 text-teal-700';
      case QuestionType.TrueFalse:
        return 'bg-teal-100 text-teal-700';
      case QuestionType.Essay:
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  readonly questions = computed(() => this.facade.questionBank().items);
  readonly hasMore = computed(() => this.facade.questionBank().hasMore);
  readonly currentPageIndex = computed(() => this.facade.questionBank().pageIndex);
  readonly isLoading = computed(() => this.facade.loadingQuestionBank());
  readonly isAssigning = computed(() => this.facade.mutatingQuestions());
  readonly selectedQuestionIds = computed(() => this.facade.selectedQuestionIds());
  readonly errorMessage = computed(() => this.localErrorMessage() ?? this.facade.error());

  readonly selectedCount = computed(() => this.selectedQuestionIds().length);
  readonly pendingSelectedCount = computed(
    () => this.selectedQuestionIds().filter((id) => !this.facade.isPersistedQuestion(id)).length,
  );
  readonly isInitialLoading = computed(() => this.isLoading() && this.questions().length === 0);
  readonly isLoadingMore = computed(() => this.isLoading() && this.questions().length > 0);

  readonly canAssignSelected = computed(() => {
    const currentExamId = this.examId() ?? 0;
    return currentExamId > 0 && this.pendingSelectedCount() > 0 && !this.isAssigning();
  });

  constructor() {
    effect((onCleanup) => {
      const search = this.searchInput().trim();
      const timerId = setTimeout(() => {
        this.debouncedSearchText.set(search);
      }, 350);

      onCleanup(() => clearTimeout(timerId));
    });

    effect(() => {
      const currentCourseId = this.courseId();
      this.selectedType();
      this.debouncedSearchText();
      this.pageSize();

      if (!currentCourseId || currentCourseId <= 0) {
        this.localErrorMessage.set(null);
        this.facade.resetQuestionBank();
        return;
      }

      this.facade.setCourseId(currentCourseId);
      this.localErrorMessage.set(null);
      this.loadPage(1);
    });
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
    return this.facade.isSelectedQuestion(questionId);
  }

  toggleSelection(questionId: number): void {
    if (this.facade.isSelectedQuestion(questionId)) {
      this.facade.deselectQuestionFromBank(questionId);
      return;
    }

    const selectedQuestion = this.questions().find((question) => question.id === questionId);
    if (!selectedQuestion) {
      return;
    }

    this.facade.selectQuestionFromBank(selectedQuestion);
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

    const assignedById = new Map(
      this.facade.assignedQuestions().map((question) => [question.id, question]),
    );

    const questions: IAssignQuestion[] = selectedIds
      .filter((id) => !this.facade.isPersistedQuestion(id))
      .map((id) => {
        const sourceFromCenter = assignedById.get(id);
        const sourceFromBank = this.questions().find((question) => question.id === id);

        const degreeCandidate = sourceFromCenter?.degree ?? sourceFromBank?.degree ?? 1;
        const normalizedDegree =
          Number.isFinite(degreeCandidate) && degreeCandidate > 0 ? Math.floor(degreeCandidate) : 1;

        return {
          id,
          questionDegree: normalizedDegree,
        };
      });

    if (questions.length === 0) {
      this.appMessageService.addInfoMessage('All selected questions are already assigned.');
      return;
    }

    const payload: IAssignQuestionsToExam = {
      examId: currentExamId,
      questions,
    };

    this.localErrorMessage.set(null);

    this.facade
      .assignQuestionsToExam(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.appMessageService.addSuccessMessage('Selected questions assigned successfully.');
          this.assignDone.emit(questions.map((question) => question.id));
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
