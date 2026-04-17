import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ROUTES, ROUTESPROFESSOR } from '../../../core/constants/const.route';
import { IcreateExam } from '../../../data/models/ProfessorExam/icreate-exam';
import { Iexamdetails } from '../../../data/models/ProfessorExam/Iexamdetails.1';
import { IexamDetailsData } from '../../../data/models/ProfessorExam/IexamDetails';
import { IupdateExam } from '../../../data/models/ProfessorExam/IupdateExam';
import { ProfessorExamFacade } from '../services/professor-exam-facade';
import { ExamFilterModalComponent } from './components/exam-filter-modal/exam-filter-modal.component';
import {
  ExamEditorModalComponent,
  ExamEditorSubmitPayload,
} from './components/exam-editor-modal/exam-editor-modal.component';
import { ExamsTableComponent } from './components/exams-table/exams-table.component';

@Component({
  selector: 'app-exams-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ExamsTableComponent,
    ExamEditorModalComponent,
    ExamFilterModalComponent,
  ],
  templateUrl: './exams-management.component.html',
  styleUrl: './exams-management.component.css',
})
export class ExamsManagementComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly examFacade = inject(ProfessorExamFacade);

  protected readonly routes = ROUTES;
  protected readonly professorRoutes = ROUTESPROFESSOR;

  protected readonly examDetailsResource = this.examFacade.examDetailsResource;
  protected readonly departmentsResource = this.examFacade.departmentsResource;

  protected readonly pageSize = signal(5);
  protected readonly pageIndex = signal(1);
  protected readonly searchTerm = signal('');
  protected readonly filterVisible = signal(false);

  protected readonly editorVisible = signal(false);
  protected readonly editorMode = signal<'create' | 'edit'>('create');
  protected readonly selectedExam = signal<IexamDetailsData | null>(null);
  protected readonly currentFilters = this.examFacade.examsRequest;

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly courseId = computed(() => {
    const rawId = this.params().get('courseId') ?? '';
    const parsed = Number(rawId);
    return Number.isFinite(parsed) ? parsed : null;
  });

  protected readonly exams = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const rows = this.examFacade.exams();

    if (!term) {
      return rows;
    }

    return rows.filter(
      (exam) =>
        exam.title.toLowerCase().includes(term) || exam.courseName.toLowerCase().includes(term),
    );
  });

  protected readonly totalSize = this.examFacade.totalSize;

  protected readonly totalPages = computed(() => {
    const pages = Math.ceil(this.totalSize() / this.pageSize());
    return pages > 0 ? pages : 1;
  });

  protected readonly isLoading = computed(
    () =>
      this.examDetailsResource.isLoading() ||
      this.departmentsResource.isLoading() ||
      this.examFacade.loading(),
  );

  protected readonly errorMessage = computed(() => {
    const facadeError = this.examFacade.error();
    if (facadeError) {
      return facadeError;
    }

    return (
      this.readHttpError(this.examDetailsResource.error()) ||
      this.readHttpError(this.departmentsResource.error())
    );
  });

  private syncCourseEffect() { effect(() => {
    this.examFacade.setCourseId(this.courseId());
  });
}

  constructor() {
    this.examFacade.setPagination(this.pageIndex(), this.pageSize());
    this.syncCourseEffect();
  }

  protected openCreateModal(): void {
    this.editorMode.set('create');
    this.selectedExam.set(null);
    this.editorVisible.set(true);
  }

  protected openFilterModal(): void {
    this.filterVisible.set(true);
  }

  protected closeFilterModal(): void {
    this.filterVisible.set(false);
  }

  protected applyFilter(filters: Partial<Iexamdetails>): void {
    this.examFacade.applyFilters(filters);
    this.pageIndex.set(1);
    this.filterVisible.set(false);
  }

  protected resetFilter(): void {
    this.examFacade.resetFilters();
    this.pageIndex.set(1);
  }

  protected openEditModal(exam: IexamDetailsData): void {
    this.editorMode.set('edit');
    this.selectedExam.set(exam);
    this.editorVisible.set(true);
  }

  protected closeModal(): void {
    this.editorVisible.set(false);
  }

  protected submitExam(payload: ExamEditorSubmitPayload): void {
    if (this.editorMode() === 'create') {
      const createPayload: Omit<IcreateExam, 'courseId'> = {
        title: payload.title,
        passingScore: payload.passingScore,
        startTime: payload.startTime,
        durationMinutes: payload.durationMinutes,
        totalDegree: payload.totalDegree,
        isRandomQuestions: payload.isRandomQuestions,
        isRandomAnswers: payload.isRandomAnswers,
        academicLevel: payload.academicLevel,
        departmentsIds: payload.departmentsIds,
      };

      this.examFacade.createExam(createPayload).subscribe({
        next: () => this.closeModal(),
      });
      return;
    }

    if (!payload.id) {
      return;
    }

    const updatePayload: IupdateExam = {
      id: payload.id,
      title: payload.title,
      startTime: payload.startTime,
      durationMinutes: payload.durationMinutes,
      passingScore: payload.passingScore,
      isRandomQuestions: payload.isRandomQuestions,
      isRandomAnswers: payload.isRandomAnswers,
      totalDegree: payload.totalDegree,
      academicLevel: payload.academicLevel,
      departmentId: payload.departmentsIds[0] ?? 0,
    };

    this.examFacade.updateExam(updatePayload).subscribe({
      next: () => this.closeModal(),
    });
  }

  protected publishExam(exam: IexamDetailsData): void {
    this.examFacade.publishExam(exam.id).subscribe();
  }

  protected deleteExam(exam: IexamDetailsData): void {
    const confirmed = confirm(`Delete exam "${exam.title}"?`);
    if (!confirmed) {
      return;
    }

    this.examFacade.deleteExam(exam.id).subscribe();
  }

  protected retry(): void {
    this.examFacade.reloadExams();
    this.departmentsResource.reload();
  }

  protected previousPage(): void {
    if (this.pageIndex() <= 1) {
      return;
    }

    const next = this.pageIndex() - 1;
    this.pageIndex.set(next);
    this.examFacade.setPagination(next, this.pageSize());
  }

  protected nextPage(): void {
    if (this.pageIndex() >= this.totalPages()) {
      return;
    }

    const next = this.pageIndex() + 1;
    this.pageIndex.set(next);
    this.examFacade.setPagination(next, this.pageSize());
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
