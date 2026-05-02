import { HttpErrorResponse } from '@angular/common/http';
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
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { examBuilderPath } from '../../../core/constants/const.route';
import { IcreateExam } from '../../../data/models/ProfessorExam/icreate-exam';
import { IexamDetailsData } from '../../../data/models/ProfessorExam/IexamDetails';
import { CreateExamModalComponent } from './components/create-exam-modal/create-exam-modal.component';
import { ExamsTableComponent } from './components/exams-table/exams-table.component';
import { FilterExamsModalComponent } from './components/filter-exams-modal/filter-exams-modal.component';
import { ProfessorExamFacade } from '../services/professor-exam-facade';
import { isDraftExamStatus, isPublishedExamStatus } from '../../../shared/utils/exam-status.utils';
import { ExamSortingOptions } from '../../../data/enums/ExamSortingOptions';
import { ProfessorExamStatus } from '../../../data/enums/ProfessorExamStatus';

@Component({
  selector: 'app-exams-management',
  standalone: true,
  imports: [CommonModule, ExamsTableComponent, CreateExamModalComponent, FilterExamsModalComponent],
  templateUrl: './exams-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamsManagementComponent {
  private static readonly DEFAULT_PAGE_SIZE = 8;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly examFacade = inject(ProfessorExamFacade);

  private readonly paramMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly examSortingOptions = ExamSortingOptions;
  readonly professorExamStatus = ProfessorExamStatus;

  readonly requestState = computed(() => this.examFacade.examsRequest());
  readonly currentSorting = computed(() => this.requestState().sorting);
  readonly currentStatus = computed(() => this.requestState().examStatus);
  readonly currentSemester = computed(() => this.requestState().semesterId);

  readonly pageSize = signal(ExamsManagementComponent.DEFAULT_PAGE_SIZE);
  readonly pageIndex = signal(1);
  readonly searchTerm = signal('');

  readonly createModalOpen = signal(false);
  readonly filterModalOpen = signal(false);

  readonly creatingExam = signal(false);

  readonly courseId = computed(() => {
    const rawCourseId = this.paramMap().get('courseId') ?? '';
    const parsed = Number(rawCourseId);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });

  readonly exams = computed(() => this.examFacade.exams());
  readonly totalSize = computed(() => this.examFacade.totalSize());
  readonly departments = computed(() => this.examFacade.departmentsResource.value() ?? []);

  readonly totalPages = computed(() => {
    const total = this.totalSize();
    const size = this.pageSize();

    if (size <= 0) {
      return 1;
    }

    return Math.max(1, Math.ceil(total / size));
  });

  readonly isLoading = computed(
    () =>
      this.examFacade.examDetailsResource.isLoading() ||
      this.examFacade.departmentsResource.isLoading() ||
      this.examFacade.loading(),
  );

  readonly errorMessage = computed(() => {
    const facadeError = this.examFacade.error();
    if (facadeError) {
      return facadeError;
    }

    return (
      this.readHttpError(this.examFacade.examDetailsResource.error()) ||
      this.readHttpError(this.examFacade.departmentsResource.error())
    );
  });

  constructor() {
    effect(() => {
      const currentCourseId = this.courseId();
      if (!currentCourseId) {
        return;
      }

      this.pageIndex.set(1);
      this.searchTerm.set('');
      this.pageSize.set(ExamsManagementComponent.DEFAULT_PAGE_SIZE);

      this.examFacade.setCourseId(currentCourseId);
      this.examFacade.resetFilters();
      this.examFacade.setPagination(1, ExamsManagementComponent.DEFAULT_PAGE_SIZE);
      this.examFacade.reloadExams();
      this.examFacade.departmentsResource.reload();
    });
  }

  onOpenCreateModal(): void {
    this.createModalOpen.set(true);
  }

  onCloseCreateModal(): void {
    if (this.creatingExam()) {
      return;
    }
    this.createModalOpen.set(false);
  }

  onOpenFilterModal(): void {
    this.filterModalOpen.set(true);
  }

  onCloseFilterModal(): void {
    this.filterModalOpen.set(false);
  }

  onApplyFilters(filters: any): void {
    // Basic filter logic (would be expanded in facade ideally)
    const activeFilters: any = {};
    if (filters.status !== undefined && filters.status !== null) {
      activeFilters.examStatus = filters.status;
    } else {
      activeFilters.examStatus = null;
    }

    if (filters.level !== undefined && filters.level !== null) {
      activeFilters.academicLevel = filters.level;
    }

    if (filters.semester !== undefined && filters.semester !== null) {
      // In real scenario this would map properly, using placeholder to show logic matching UI
      activeFilters.semesterId = filters.semester;
    }

    this.examFacade.applyFilters(activeFilters);
    this.examFacade.setPagination(1, this.pageSize());
    this.examFacade.reloadExams();
  }

  clearFilter(filterKey: 'status' | 'semester'): void {
    if (filterKey === 'status') {
      this.examFacade.applyFilters({ examStatus: null });
    } else if (filterKey === 'semester') {
      this.examFacade.applyFilters({ semesterId: null });
    }
    this.examFacade.reloadExams();
  }

  onSortChange(value: string | number | any): void {
    const parsed = Number(value);
    this.examFacade.applyFilters({ sorting: parsed });
    this.examFacade.reloadExams();
  }

  getStatusName(status: number | null | undefined): string {
    switch (status) {
      case ProfessorExamStatus.Draft:
        return 'Draft';
      case ProfessorExamStatus.Published:
        return 'Published';
      case ProfessorExamStatus.Completed:
        return 'Completed';
      case ProfessorExamStatus.PendingManualGrading:
        return 'Pending Manual Grading';
      case ProfessorExamStatus.AllGraded:
        return 'All Graded';
      default:
        return 'Unknown Status';
    }
  }

  onCreateExam(payload: Omit<IcreateExam, 'courseId'>): void {
    this.creatingExam.set(true);

    this.examFacade
      .createExam(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.creatingExam.set(false)),
      )
      .subscribe({
        next: (response) => {
          const examId = this.extractCreatedExamId(response);
          if (!examId) {
            this.examFacade.error.set('Exam was created but no exam id was returned.');
            return;
          }

          this.createModalOpen.set(false);
          this.navigateToBuilder(examId);
        },
      });
  }

  onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
    this.pageIndex.set(1);

    this.examFacade.applyFilters({
      searchTitle: value.trim().length > 0 ? value.trim() : null,
    });
    this.examFacade.setPagination(1, this.pageSize());
    this.examFacade.reloadExams();
  }

  onOpenBuilder(exam: IexamDetailsData): void {
    if (isDraftExamStatus(exam.examStatus) || isPublishedExamStatus(exam.examStatus)) {
      this.navigateToBuilder(exam.id);
    }
  }

  onPublishExam(exam: IexamDetailsData): void {
    if (!isDraftExamStatus(exam.examStatus)) {
      return;
    }
    this.examFacade.publishExam(exam.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  onDeleteExam(exam: IexamDetailsData): void {
    this.examFacade.deleteExam(exam.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  onGradeEssays(exam: IexamDetailsData): void {
    const currentCourseId = this.courseId();
    if (currentCourseId) {
      this.router.navigate([
        '/main',
        'professor',
        'my-courses',
        currentCourseId,
        'exams',
        exam.id,
        'grade',
      ]);
    }
  }

  onDownloadPdf(exam: IexamDetailsData): void {
    this.examFacade['professorExamService']
      ?.getExamResultsReport(exam.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const blob = new Blob([response], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${exam.title}_results.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          window.alert('Error occurred while fetching PDF report.');
        },
      });
  }

  onPreviousPage(): void {
    if (this.pageIndex() <= 1) {
      return;
    }

    this.pageIndex.update((value) => value - 1);
    this.examFacade.setPagination(this.pageIndex(), this.pageSize());
    this.examFacade.reloadExams();
  }

  onNextPage(): void {
    if (this.pageIndex() >= this.totalPages()) {
      return;
    }

    this.pageIndex.update((value) => value + 1);
    this.examFacade.setPagination(this.pageIndex(), this.pageSize());
    this.examFacade.reloadExams();
  }

  onPageSizeChange(value: string | number): void {
    const parsed = Number(value);
    const safePageSize = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 5;

    this.pageSize.set(safePageSize);
    this.pageIndex.set(1);
    this.examFacade.setPagination(1, safePageSize);
    this.examFacade.reloadExams();
  }

  private navigateToBuilder(examId: number): void {
    const currentCourseId = this.courseId();
    if (!currentCourseId) {
      this.examFacade.error.set('Course id is missing. Unable to open exam builder.');
      return;
    }

    this.router.navigateByUrl(examBuilderPath(currentCourseId, examId));
  }

  private extractCreatedExamId(response: unknown): number | null {
    if (typeof response === 'number' && response > 0) {
      return response;
    }

    if (!response || typeof response !== 'object') {
      return null;
    }

    const payload = response as Record<string, unknown>;
    const candidates = [payload['id'], payload['examId'], payload['result']];

    for (const candidate of candidates) {
      if (typeof candidate === 'number' && candidate > 0) {
        return candidate;
      }

      if (!candidate || typeof candidate !== 'object') {
        continue;
      }

      const nested = candidate as Record<string, unknown>;
      const nestedId = nested['id'] ?? nested['examId'];

      if (typeof nestedId === 'number' && nestedId > 0) {
        return nestedId;
      }
    }

    return null;
  }

  private readHttpError(error: unknown): string | null {
    if (!error) {
      return null;
    }

    if (error instanceof HttpErrorResponse) {
      const backendError = error.error as Record<string, unknown> | null;
      const message = backendError?.['errorMessage'] ?? backendError?.['message'];

      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }

      return error.message || 'Failed to load exams.';
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Failed to load exams.';
  }
}
