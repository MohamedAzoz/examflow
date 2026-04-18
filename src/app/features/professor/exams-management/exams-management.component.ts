import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { IcreateExam } from '../../../data/models/ProfessorExam/icreate-exam';
import { Iexamdetails } from '../../../data/models/ProfessorExam/Iexamdetails.1';
import { IexamDetailsData } from '../../../data/models/ProfessorExam/IexamDetails';
import { ROUTES } from '../../../core/constants/const.route';
import { ROUTESPROFESSOR } from '../../../core/constants/const.route';
import { ProfessorExamFacade } from '../services/professor-exam-facade';
import { ProfessorExamBuilderFacade } from '../services/professor-exam-builder-facade';
import { ExamFilterModalComponent } from './components/exam-filter-modal/exam-filter-modal.component';
import {
  ExamEditorModalComponent,
  ExamEditorSubmitPayload,
} from './components/exam-editor-modal/exam-editor-modal.component';
import { ExamsTableComponent } from './components/exams-table/exams-table.component';

@Component({
  selector: 'app-exams-management',
  standalone: true,
  imports: [CommonModule, ExamsTableComponent, ExamEditorModalComponent, ExamFilterModalComponent],
  templateUrl: './exams-management.component.html',
  styleUrl: './exams-management.component.css',
})
export class ExamsManagementComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly examFacade = inject(ProfessorExamFacade);
  private readonly examBuilderFacade = inject(ProfessorExamBuilderFacade);

  protected readonly pageSize = signal(5);
  protected readonly pageIndex = signal(1);
  protected readonly searchTerm = signal('');
  protected readonly filterVisible = signal(false);

  protected readonly editorVisible = signal(false);
  protected readonly currentFilters = this.examFacade.examsRequest;

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly courseId = computed(() => {
    const rawId = this.params().get('courseId') ?? '';
    const parsed = Number(rawId);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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

  protected readonly draftCount = computed(() => {
    return this.exams().filter((exam) => exam.examStatus.toLowerCase().includes('draft')).length;
  });

  protected readonly publishedCount = computed(() => {
    return this.exams().filter((exam) => exam.examStatus.toLowerCase().includes('publish')).length;
  });

  protected readonly noticeMessage = this.examFacade.notice;

  protected readonly isDataLoading = computed(
    () => this.examFacade.loadingExams() || this.examFacade.loadingDepartments(),
  );

  protected readonly isMutating = computed(
    () =>
      this.examFacade.creatingExam() ||
      this.examFacade.updatingExam() ||
      this.examFacade.deletingExam() ||
      this.examFacade.publishingExam(),
  );

  protected readonly errorMessage = this.examFacade.error;

  private syncCourseEffect() {
    effect(() => {
      this.examFacade.setCourseId(this.courseId());
    });
  }

  constructor() {
    this.examFacade.setPagination(this.pageIndex(), this.pageSize());
    this.syncCourseEffect();
  }

  protected openCreateModal(): void {
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

  protected openBuilder(exam: IexamDetailsData): void {
    const currentCourseId = this.courseId();
    if (!currentCourseId) {
      return;
    }

    this.examBuilderFacade.seedExamFromExisting(exam);
    this.navigateToBuilder(currentCourseId, exam.id);
  }

  protected closeModal(): void {
    this.editorVisible.set(false);
  }

  protected submitExam(payload: ExamEditorSubmitPayload): void {
    void this.handleCreateExam(payload);
  }

  protected publishExam(exam: IexamDetailsData): void {
    void this.examFacade.publishExam(exam.id);
  }

  protected deleteExam(exam: IexamDetailsData): void {
    const confirmed = confirm(`Delete exam "${exam.title}"?`);
    if (!confirmed) {
      return;
    }

    void this.examFacade.deleteExam(exam.id);
  }

  protected retry(): void {
    void this.examFacade.reloadAll();
  }

  protected dismissNotice(): void {
    this.examFacade.notice.set(null);
  }

  protected dismissError(): void {
    this.examFacade.error.set(null);
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

  private async handleCreateExam(payload: ExamEditorSubmitPayload): Promise<void> {
    const currentCourseId = this.courseId();
    if (!currentCourseId) {
      return;
    }

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

    const response = await this.examFacade.createExam(createPayload);
    if (!response) {
      return;
    }

    this.examBuilderFacade.seedExamFromCreate(response.id, createPayload);
    this.closeModal();
    this.navigateToBuilder(currentCourseId, response.id);
  }

  private navigateToBuilder(courseId: number, examId: number): void {
    this.router.navigate([
      '/',
      ROUTES.MAIN.path,
      ROUTES.PROFESSOR.path,
      ROUTESPROFESSOR.COURSES.path,
      courseId,
      'exams',
      examId,
      'builder',
    ]);
  }
}
