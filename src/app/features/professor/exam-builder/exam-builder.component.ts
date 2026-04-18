import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ROUTES, ROUTESPROFESSOR } from '../../../core/constants/const.route';
import { Toggle } from '../../../core/services/toggle';
import { IupdateExam } from '../../../data/models/ProfessorExam/IupdateExam';
import { IassignDepartments } from '../../../data/models/course/IassignDepartments';
import { IQuestionRequest } from '../../../data/models/question/iquestion-request';
import { IQuestionResponse } from '../../../data/models/question/iquestion-response';
import { Course } from '../../../data/services/course';
import {
  BuilderCreateQuestionPayload,
  SelectedQuestionDegreeChangePayload,
  BuilderUpdateQuestionPayload,
  QuestionWorkspaceComponent,
} from './components/question-workspace/question-workspace.component';
import { ExamSettingsPanelComponent } from './components/exam-settings-panel/exam-settings-panel.component';
import { QuestionBankPanelComponent } from './components/question-bank-panel/question-bank-panel.component';
import { ProfessorExamBuilderFacade } from '../services/professor-exam-builder-facade';

@Component({
  selector: 'app-exam-builder',
  standalone: true,
  imports: [
    CommonModule,
    QuestionBankPanelComponent,
    QuestionWorkspaceComponent,
    ExamSettingsPanelComponent,
  ],
  templateUrl: './exam-builder.component.html',
  styleUrl: './exam-builder.component.css',
})
export class ExamBuilderComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toggle = inject(Toggle);
  private readonly courseService = inject(Course);

  protected readonly builderFacade = inject(ProfessorExamBuilderFacade);
  protected readonly rightPanelOpen = signal(true);

  private departmentsRequestVersion = 0;

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly courseId = computed(() => {
    const value = Number(this.params().get('courseId') ?? 0);
    return Number.isFinite(value) && value > 0 ? value : null;
  });

  protected readonly examId = computed(() => {
    const value = Number(this.params().get('examId') ?? 0);
    return Number.isFinite(value) && value > 0 ? value : null;
  });

  protected readonly departments = signal<IassignDepartments[]>([]);
  protected readonly loadingDepartments = signal(false);
  protected readonly departmentsError = signal<string | null>(null);

  protected readonly exam = this.builderFacade.exam;
  protected readonly questionBank = this.builderFacade.questionBank;
  protected readonly selectedQuestionIds = this.builderFacade.selectedQuestionIds;
  protected readonly selectedQuestionDegrees = this.builderFacade.selectedQuestionDegrees;
  protected readonly selectedQuestionPreview = this.builderFacade.selectedQuestionPreview;
  protected readonly assignedQuestions = this.builderFacade.assignedQuestions;

  protected readonly questionSearch = this.builderFacade.questionSearch;
  protected readonly questionType = this.builderFacade.questionType;
  protected readonly loadingQuestionBank = this.builderFacade.loadingQuestionBank;
  protected readonly hasMoreQuestions = this.builderFacade.hasMoreQuestions;
  protected readonly assigningQuestions = this.builderFacade.assigningQuestions;
  protected readonly savingQuestion = this.builderFacade.savingQuestion;
  protected readonly savingExam = this.builderFacade.savingExam;
  protected readonly publishingExam = this.builderFacade.publishingExam;
  protected readonly loadingExam = this.builderFacade.loadingExam;
  protected readonly loadingAssignedQuestions = this.builderFacade.loadingAssignedQuestions;
  protected readonly isCreateQuestionVisible = this.builderFacade.isCreateQuestionVisible;
  protected readonly error = this.builderFacade.error;
  protected readonly notice = this.builderFacade.notice;

  protected readonly isWorkspaceLoading = computed(
    () => this.loadingExam() || this.loadingAssignedQuestions() || this.loadingDepartments(),
  );

  protected readonly canPublish = computed(
    () => this.assignedQuestions().length > 0 && !this.publishingExam(),
  );

  protected readonly totalAssignedDegree = computed(() => {
    return this.assignedQuestions().reduce((total, item) => total + Number(item.degree || 0), 0);
  });

  private readonly initializedContextKey = signal('');
  private readonly syncContextEffect = effect(() => {
    const courseId = this.courseId();
    const examId = this.examId();

    if (!courseId || !examId) {
      return;
    }

    const key = `${courseId}-${examId}`;
    if (this.initializedContextKey() === key) {
      return;
    }

    this.initializedContextKey.set(key);

    this.builderFacade.setContext(courseId, examId);
    void this.loadDepartments(courseId);
    void this.builderFacade.loadExamById();
    void this.builderFacade.loadAssignedQuestions();
    void this.builderFacade.loadMoreQuestions();
  });

  ngOnInit(): void {
    this.toggle.examMode(true);

    if (!this.courseId() || !this.examId()) {
      this.exitBuilder();
    }
  }

  ngOnDestroy(): void {
    this.toggle.examMode(false);
    this.builderFacade.clearMessages();
  }

  protected onSearchChanged(value: string): void {
    this.builderFacade.updateQuestionFilters(value, this.questionType());
  }

  protected onQuestionTypeChanged(value: number): void {
    this.builderFacade.updateQuestionFilters(this.questionSearch(), value);
  }

  protected onLoadMoreQuestions(): void {
    void this.builderFacade.loadMoreQuestions();
  }

  protected onToggleQuestionSelection(questionId: number): void {
    this.builderFacade.toggleQuestionSelection(questionId);
  }

  protected onAssignSelectedQuestions(): void {
    void this.builderFacade.assignSelectedQuestions();
  }

  protected onSelectedQuestionDegreeChanged(payload: SelectedQuestionDegreeChangePayload): void {
    this.builderFacade.setSelectedQuestionDegree(payload.id, payload.degree);
  }

  protected onOpenCreateQuestion(): void {
    this.builderFacade.setCreateQuestionVisible(true);
  }

  protected onCloseCreateQuestion(): void {
    this.builderFacade.setCreateQuestionVisible(false);
  }

  protected onCreateQuestion(payload: BuilderCreateQuestionPayload): void {
    const courseId = this.courseId();
    if (!courseId) {
      return;
    }

    const request: IQuestionRequest = {
      text: payload.text,
      questionType: payload.questionType,
      degree: payload.degree,
      courseId,
      options: payload.options,
      correctOptionText: payload.correctOptionText,
    };

    void this.builderFacade.createQuestion(request, payload.mediaFile);
  }

  protected onUpdateQuestion(payload: BuilderUpdateQuestionPayload): void {
    const courseId = this.courseId();
    if (!courseId) {
      return;
    }

    const request: IQuestionResponse = {
      id: payload.id,
      text: payload.text,
      questionType: payload.questionType,
      degree: payload.degree,
      courseId,
      options: payload.options,
      correctOptionText: payload.correctOptionText,
    };

    void this.builderFacade.updateQuestion(request);
  }

  protected onSaveSettings(payload: IupdateExam): void {
    void this.builderFacade.updateExamSettings(payload);
  }

  protected onPublishExam(): void {
    void this.handlePublishExam();
  }

  protected toggleSettingsPanel(): void {
    this.rightPanelOpen.update((current) => !current);
  }

  protected clearNotice(): void {
    this.builderFacade.notice.set(null);
  }

  protected clearError(): void {
    this.builderFacade.error.set(null);
  }

  private async handlePublishExam(): Promise<void> {
    const isPublished = await this.builderFacade.publishExam();
    if (isPublished) {
      this.exitBuilder();
    }
  }

  private async loadDepartments(courseId: number): Promise<void> {
    const version = ++this.departmentsRequestVersion;

    this.loadingDepartments.set(true);
    this.departmentsError.set(null);

    try {
      const departments = await firstValueFrom(this.courseService.assignDepartments(courseId));
      if (version !== this.departmentsRequestVersion) {
        return;
      }

      this.departments.set(departments ?? []);
    } catch (error) {
      if (version !== this.departmentsRequestVersion) {
        return;
      }

      this.departments.set([]);
      this.departmentsError.set(
        error instanceof Error ? error.message : 'Failed to load departments.',
      );
    } finally {
      if (version === this.departmentsRequestVersion) {
        this.loadingDepartments.set(false);
      }
    }
  }

  protected exitBuilder(): void {
    const courseId = this.courseId();
    this.toggle.examMode(false);

    if (!courseId) {
      this.router.navigate(['/', ROUTES.MAIN.path, ROUTES.PROFESSOR.path]);
      return;
    }

    this.router.navigate([
      '/',
      ROUTES.MAIN.path,
      ROUTES.PROFESSOR.path,
      ROUTESPROFESSOR.COURSES.path,
      courseId,
      'exams',
    ]);
  }
}
