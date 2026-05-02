import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AppMessageService } from '../../../core/services/app-message';
import { Toggle } from '../../../core/services/toggle';
import { IExamQuestions } from '../../../data/models/ExamQuestions/iexam-questions';
import { IupdateExam } from '../../../data/models/ProfessorExam/IupdateExam';
// import { AssignedQuestionsComponent } from './components/assigned-questions/assigned-questions.component';
import {
  ExamSettingsComponent,
  ExamSettingsValue,
} from './components/exam-settings/exam-settings.component';
import { QuestionBankComponent } from './components/question-bank/question-bank.component';
import { ExamBuilderFacade } from '../services/exam-builder.facade';
import { IQuestionResponse } from '../../../data/models/question/iquestion-response';
import { FormsModule } from '@angular/forms';
import {
  QuestionFormComponent,
  QuestionFormSavePayload,
} from '../../../shared/components/question-form/question-form.component';
import { IError } from '../../../data/models/IErrorResponse';
import { IQuestionRequest } from '../../../data/models/question/iquestion-request';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-exam-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    QuestionBankComponent,
    ExamSettingsComponent,
    QuestionFormComponent,
  ],
  templateUrl: './exam-builder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamBuilderComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toggleService = inject(Toggle);
  private readonly appMessageService = inject(AppMessageService);

  protected readonly facade = inject(ExamBuilderFacade);

  private readonly paramMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  private readonly initializedContextKey = signal('');

  // readonly formModalOpen = signal(false);
  private readonly pendingSettings = signal<ExamSettingsValue | null>(null);

  protected readonly isQuestionBankCollapsed = signal(false);
  protected readonly isSettingsCollapsed = signal(false);
  protected readonly createQuestionRequestTick = signal(0);

  protected readonly courseId = computed(() => {
    const rawCourseId = this.paramMap().get('courseId') ?? '';
    const parsed = Number(rawCourseId);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });

  protected readonly examId = computed(() => {
    const rawExamId = this.paramMap().get('examId') ?? '';
    const parsed = Number(rawExamId);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });

  protected readonly exam = computed(() => this.facade.currentExam());
  protected readonly assignedQuestions = computed(() => this.facade.assignedQuestions());
  protected readonly departments = computed(() => this.facade.departments());

  // Main UI Center Workspace State
  protected readonly activeCenterMode = signal<'empty' | 'create' | 'edit' | 'view'>('empty');
  protected readonly viewedQuestion = signal<IQuestionResponse | null>(null);

  protected readonly viewedQuestionImage = computed(() => {
    const q = this.viewedQuestion();
    const imagePath = q ? (q as any).imagePath : null;
    if (!imagePath) return null;

    let path = imagePath;
    if (
      path &&
      !path.startsWith('http') &&
      !path.startsWith('blob:') &&
      !path.startsWith('data:')
    ) {
      const baseUrl = environment.baseUrl.replace(/\/$/, '');
      path = path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
    }
    return path;
  });

  protected readonly editorInitialQuestion = computed(() => {
    if (this.activeCenterMode() === 'edit' && this.viewedQuestion()) {
      const q = this.viewedQuestion()!;
      return {
        id: q.id,
        questionId: q.id,
        text: q.text,
        questionType: q.questionType,
        degree: q.degree,
        options: Array.isArray(q.options) ? q.options : [],
        correctOptionText: q.correctOptionText || '',
        imagePath: (q as any).imagePath || null,
      };
    }
    return null;
  });

  protected readonly isViewedQuestionAssigned = computed(() => {
    const qid = this.viewedQuestion()?.id;
    if (!qid) return false;
    return this.assignedQuestions().some((aq) => aq.id === qid);
  });

  protected readonly totalAssignedDegree = computed(() =>
    this.assignedQuestions().reduce((sum, question) => sum + Number(question.degree || 0), 0),
  );

  protected readonly statusLabel = computed(() => this.exam()?.examStatus ?? 'Draft');

  protected readonly isLoadingWorkspace = computed(
    () =>
      this.facade.loadingExam() ||
      this.facade.loadingDepartments() ||
      this.facade.loadingAssignedQuestions(),
  );

  protected readonly errorMessage = computed(() => this.facade.error());

  protected readonly examSettingsInitial = computed<Partial<ExamSettingsValue> | null>(() => {
    const currentExam = this.exam();
    if (!currentExam) {
      return null;
    }

    return {
      title: currentExam.title,
      passingScore: currentExam.passingScore,
      totalDegree: currentExam.totalDegree,
      startTime: this.toLocalDateTimeInput(currentExam.startTime),
      durationMinutes: currentExam.durationMinutes,
      academicLevel: currentExam.academicLevel,
      departmentIds: currentExam.departmentIds || [],
      isRandomQuestions: currentExam.isRandomQuestions,
      isRandomAnswers: currentExam.isRandomAnswers,
    };
  });

  constructor() {
    effect(() => {
      const currentCourseId = this.courseId();
      const currentExamId = this.examId();

      if (!currentCourseId || !currentExamId) {
        return;
      }

      const contextKey = `${currentCourseId}-${currentExamId}`;
      if (this.initializedContextKey() === contextKey) {
        return;
      }

      this.initializedContextKey.set(contextKey);
      this.loadWorkspace(currentCourseId, currentExamId);
    });
  }

  ngOnInit(): void {
    this.toggleService.examMode(true);
  }

  ngOnDestroy(): void {
    this.toggleService.examMode(false);
  }

  protected onQuestionBankCloseRequested(): void {
    this.isQuestionBankCollapsed.set(true);
  }

  protected expandQuestionBank(): void {
    this.isQuestionBankCollapsed.set(false);
  }

  protected expandSettings(): void {
    this.isSettingsCollapsed.set(false);
  }

  protected collapseSettings(value: boolean): void {
    this.isSettingsCollapsed.set(value);
  }

  protected requestCreateQuestionFromBank(): void {
    this.createQuestionRequestTick.update((value) => value + 1);
    this.activeCenterMode.set('create');
    this.viewedQuestion.set(null);
  }

  protected onViewQuestion(question: IQuestionResponse): void {
    this.viewedQuestion.set(question);
    this.activeCenterMode.set('view');
  }

  protected closeCenterView(): void {
    this.activeCenterMode.set('empty');
    // We intentionally keep viewedQuestion so the next logic can work smoothly or clear it
    this.viewedQuestion.set(null);
  }

  protected editViewedQuestion(): void {
    if (this.viewedQuestion()) {
      this.activeCenterMode.set('edit');
      // this.formModalOpen.set(true);
    }
  }

  protected assignViewedQuestion(): void {
    const q = this.viewedQuestion();
    const examId = this.examId();
    if (q && examId) {
      this.facade
        .assignQuestionsToExam({
          examId,
          questions: [{ id: q.id, questionDegree: q.degree }],
        })
        .subscribe(() => {
          this.appMessageService.addSuccessMessage('Question assigned directly.');
          // Refresh assigned questions
          this.onQuestionsAssigned();
        });
    }
  }

  protected removeAssignedQuestion(questionId: number): void {
    const examId = this.examId();
    if (!examId) return;
    this.facade.removeAssignedQuestion(questionId, examId).subscribe({
      next: () => {
        const newAssigned = this.assignedQuestions().filter((q) => q.id !== questionId);
        this.onAssignedQuestionsChange(newAssigned);
        this.appMessageService.addSuccessMessage('Question removed from exam.');
      },
      error: (error: IError) => {
        this.appMessageService.addErrorMessage(error.errorMessage);
        this.appMessageService.addErrorMessages(error.errors);
      },
    });
  }

  protected getAssignedDegree(questionId: number): number {
    const assigned = this.assignedQuestions().find((q) => q.id === questionId);
    return assigned ? assigned.degree : 1;
  }

  protected onAssignDegreeChange(questionId: number, degreeStr: unknown): void {
    const newDegree = this.normalizePositive(degreeStr as number, 1);
    const existing = this.assignedQuestions().map((q) => {
      if (q.id === questionId) {
        return { ...q, degree: newDegree };
      }
      return q;
    });
    this.onAssignedQuestionsChange(existing);
  }

  protected onQuestionSaved(payload: QuestionFormSavePayload): void {
    const requestPayload: IQuestionRequest = payload.request;

    const request$ =
      payload.mode === 'edit' && payload.id
        ? this.facade.updateQuestion(payload.id, requestPayload)
        : this.facade.createQuestion(requestPayload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.closeCenterView();
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

    this.closeCenterView();
  }

  protected questionTypeLabel(questionType: number): string {
    switch (questionType) {
      case 1:
        return 'Multiple Choice (MCQ)';
      case 2:
        return 'True / False';
      case 3:
        return 'Essay';
      default:
        return 'Other';
    }
  }

  protected hasOptions(questionType: number): boolean {
    return questionType === 1 || questionType === 2;
  }

  protected parseOptions(options: unknown): string[] {
    if (Array.isArray(options)) {
      return options.map(String);
    }
    return [];
  }

  protected onQuestionsAssigned(): void {
    const currentExamId = this.examId();
    if (!currentExamId) {
      return;
    }

    this.facade
      .loadAssignedQuestions(currentExamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          // Error signal is handled in facade.
        },
      });
  }

  protected onAssignedQuestionsChange(questions: IExamQuestions[]): void {
    this.facade.setAssignedQuestions(questions);
  }

  protected onExamSettingsSave(settings: ExamSettingsValue): void {
    this.pendingSettings.set(settings);
    this.saveUpdates();
  }

  protected saveUpdates(): void {
    const currentExamId = this.examId();
    const currentSettings = this.pendingSettings();

    if (!currentExamId || !currentSettings) {
      return;
    }

    const payload: IupdateExam = {
      id: currentExamId,
      title: currentSettings.title.trim(),
      startTime: this.toUtcIsoString(currentSettings.startTime),
      durationMinutes: this.normalizePositive(currentSettings.durationMinutes, 90),
      passingScore: this.normalizeRange(currentSettings.passingScore, 1, 100, 50),
      isRandomQuestions: currentSettings.isRandomQuestions,
      isRandomAnswers: currentSettings.isRandomAnswers,
      totalDegree: this.normalizePositive(currentSettings.totalDegree, 100),
      academicLevel: this.normalizeRange(currentSettings.academicLevel, 1, 6, 1),
      departmentsIds: currentSettings.departmentIds,
    };

    this.facade
      .updateExamSettings(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.appMessageService.addSuccessMessage('Exam settings updated successfully.');
        },
        error: (error) => {
          // Error signal is handled in facade.
          this.appMessageService.addErrorMessage(
            error.errors?.[0] ?? 'Failed to update exam settings.',
          );
        },
      });
  }

  protected publishExam(): void {
    const currentExamId = this.examId();
    if (!currentExamId) {
      return;
    }

    this.facade
      .publishExam(currentExamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.appMessageService.addSuccessMessage('Exam published successfully.');
        },
        error: (error) => {
          this.appMessageService.addErrorMessage(error.errors?.[0] ?? 'Failed to publish exam.');
        },
      });
  }

  protected exitBuilder(): void {
    const currentCourseId = this.courseId();
    if (!currentCourseId) {
      this.router.navigate(['/main/professor/my-courses']);
      return;
    }

    this.router.navigate(['/main/professor/my-courses', currentCourseId, 'exams']);
  }

  private loadWorkspace(courseId: number, examId: number): void {
    this.facade.setContext(courseId, examId);

    this.facade
      .loadExamWorkspace()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error) => {
          // Error signal is handled in facade.
          this.appMessageService.addErrorMessage(
            error.errors?.[0] ?? 'Failed to load exam workspace.',
          );
        },
      });

    this.facade
      .loadCourseDepartments(courseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error) => {
          // Error signal is handled in facade.
          this.appMessageService.addErrorMessage(
            error.errors?.[0] ?? 'Failed to load course departments.',
          );
        },
      });
  }

  private normalizePositive(value: number, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }

    return Math.floor(parsed);
  }

  private normalizeRange(value: number, min: number, max: number, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, Math.floor(parsed)));
  }

  private toUtcIsoString(dateLike: string): string {
    const parsed = new Date(dateLike);
    if (Number.isNaN(parsed.getTime())) {
      return dateLike;
    }

    return parsed.toISOString();
  }

  private toLocalDateTimeInput(dateLike: Date): string {
    const date = new Date(dateLike);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const pad = (value: number) => value.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
