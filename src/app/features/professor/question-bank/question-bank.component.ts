import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { AppMessageService } from '../../../core/services/app-message';
import { QuestionType } from '../../../data/enums/question-type';
import { IQuestionRequest } from '../../../data/models/question/iquestion-request';
import { IQuestionResponse } from '../../../data/models/question/iquestion-response';
import { QuestionBankFacade } from '../services/question-bank.facade';
import {
  QuestionBankFilterModalComponent,
  QuestionBankFilterPayload,
} from './components/question-bank-filter-modal/question-bank-filter-modal.component';
import { QuestionBankListComponent } from './components/question-bank-list/question-bank-list.component';
import { QuestionBankToolbarComponent } from './components/question-bank-toolbar/question-bank-toolbar.component';
import {
  QuestionFormModalComponent,
  QuestionFormMode,
  QuestionFormSavePayload,
} from './components/question-form-modal/question-form-modal.component';
import {
  QuestionImportModalComponent,
  QuestionImportPayload,
} from './components/question-import-modal/question-import-modal.component';

@Component({
  selector: 'app-professor-question-bank',
  standalone: true,
  imports: [
    CommonModule,
    QuestionBankToolbarComponent,
    QuestionBankListComponent,
    QuestionBankFilterModalComponent,
    QuestionFormModalComponent,
    QuestionImportModalComponent,
  ],
  templateUrl: './question-bank.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorQuestionBankComponent {
  private readonly facade = inject(QuestionBankFacade);
  private readonly appMessageService = inject(AppMessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  private readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly searchTerm = signal('');

  readonly formModalOpen = signal(false);
  readonly importModalOpen = signal(false);
  readonly filterModalOpen = signal(false);

  readonly formMode = signal<QuestionFormMode>('create');
  readonly editingQuestion = signal<IQuestionResponse | null>(null);

  readonly activeCourseId = computed(() => {
    const raw = this.routeParams().get('courseId') ?? '';
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  });

  readonly questions = computed(() => this.facade.questions());
  readonly filters = computed(() => this.facade.filters());

  readonly loadingQuestions = computed(() => this.facade.loadingQuestions());
  readonly mutatingQuestion = computed(() => this.facade.mutatingQuestion());
  readonly importingQuestions = computed(() => this.facade.importingQuestions());
  readonly hasMore = computed(() => this.facade.hasMore());
  readonly errorMessage = computed(() => this.facade.error());
  readonly actionsDisabled = computed(() => this.activeCourseId() <= 0);

  readonly pageIndex = computed(() => this.filters().pageIndex);
  readonly pageSize = computed(() => this.filters().pageSize);

  readonly activeFilterCount = computed(() => {
    let count = 0;

    if (this.filters().questionType !== QuestionType.Unknown) {
      count += 1;
    }

    return count;
  });

  constructor() {
    this.searchTerm.set(this.filters().searchTerm);

    effect((onCleanup) => {
      const search = this.searchTerm().trim();
      const timeoutId = setTimeout(() => {
        if (search === this.filters().searchTerm) {
          return;
        }

        this.facade.updateFilters({
          searchTerm: search,
          pageIndex: 1,
        });

        this.reloadQuestions();
      }, 350);

      onCleanup(() => clearTimeout(timeoutId));
    });

    effect(() => {
      this.facade.setCourseId(this.activeCourseId());

      this.reloadQuestions();
    });
  }

  onSearchChanged(value: string): void {
    this.searchTerm.set(value);
  }

  onOpenFilter(): void {
    this.filterModalOpen.set(true);
  }

  onCloseFilter(): void {
    this.filterModalOpen.set(false);
  }

  onApplyFilter(payload: QuestionBankFilterPayload): void {
    this.filterModalOpen.set(false);
    this.facade.updateFilters({
      questionType: payload.questionType,
      pageIndex: 1,
    });

    this.reloadQuestions();
  }

  onOpenImportModal(): void {
    if (this.actionsDisabled()) {
      this.appMessageService.addErrorMessage('Invalid course context for import operation.');
      return;
    }

    this.importModalOpen.set(true);
  }

  onCloseImportModal(): void {
    if (this.importingQuestions()) {
      return;
    }

    this.importModalOpen.set(false);
  }

  onImportQuestions(payload: QuestionImportPayload): void {
    this.facade
      .importQuestions({
        excelFile: payload.file,
        courseId: payload.courseId,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.importModalOpen.set(false);
          this.appMessageService.addSuccessMessage('Questions imported successfully.');
        },
        error: (error) => {
          this.appMessageService.showHttpError(error, 'Failed to import questions.');
        },
      });
  }

  onOpenCreateModal(): void {
    if (this.actionsDisabled()) {
      this.appMessageService.addErrorMessage('Invalid course context for create operation.');
      return;
    }

    this.formMode.set('create');
    this.editingQuestion.set(null);
    this.formModalOpen.set(true);
  }

  onOpenEditModal(question: IQuestionResponse): void {
    this.formMode.set('edit');
    this.editingQuestion.set(question);
    this.formModalOpen.set(true);
  }

  onCloseFormModal(): void {
    if (this.mutatingQuestion()) {
      return;
    }

    this.formModalOpen.set(false);
  }

  onQuestionSaved(payload: QuestionFormSavePayload): void {
    const requestPayload: IQuestionRequest = payload.request;

    const request$ =
      payload.mode === 'edit' && payload.id
        ? this.facade.updateQuestion(payload.id, requestPayload)
        : this.facade.createQuestion(requestPayload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.formModalOpen.set(false);
        this.appMessageService.addSuccessMessage(
          payload.mode === 'edit'
            ? 'Question updated successfully.'
            : 'Question created successfully.',
        );
      },
      error: (error) => {
        this.appMessageService.showHttpError(
          error,
          payload.mode === 'edit' ? 'Failed to update question.' : 'Failed to create question.',
        );
      },
    });
  }

  onDeleteQuestion(question: IQuestionResponse): void {
    const confirmed = window.confirm('Delete this question permanently?');
    if (!confirmed) {
      return;
    }

    this.facade
      .deleteQuestion(question.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.appMessageService.addSuccessMessage('Question deleted successfully.');
        },
        error: (error) => {
          this.appMessageService.showHttpError(error, 'Failed to delete question.');
        },
      });
  }

  onNextPage(): void {
    if (!this.hasMore()) {
      return;
    }

    this.facade.updateFilters({
      pageIndex: this.pageIndex() + 1,
    });

    this.reloadQuestions();
  }

  onPreviousPage(): void {
    if (this.pageIndex() <= 1) {
      return;
    }

    this.facade.updateFilters({
      pageIndex: this.pageIndex() - 1,
    });

    this.reloadQuestions();
  }

  private reloadQuestions(): void {
    this.facade
      .reloadQuestions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error) => {
          this.appMessageService.showHttpError(error, 'Failed to refresh question bank.');
        },
      });
  }
}
