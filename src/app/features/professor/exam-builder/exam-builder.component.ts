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
  ExamSettingsComponent, ExamSettingsValue
} from './components/exam-settings/exam-settings.component';
// import { QuestionBankComponent } from './components/question-bank/question-bank.component';
import { ExamBuilderFacade } from '../services/exam-builder.facade';
import { AssignedQuestionsComponent } from './components/assigned-questions/assigned-questions.component';
import { QuestionBankComponent } from './components/question-bank/question-bank.component';

@Component({
  selector: 'app-exam-builder',
  standalone: true,
  imports: [CommonModule, QuestionBankComponent, AssignedQuestionsComponent, ExamSettingsComponent ],
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
  private readonly pendingSettings = signal<ExamSettingsValue | null>(null);

  protected readonly isQuestionBankCollapsed = signal(false);
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
      departmentId: currentExam.departmentIds[0] ?? 0,
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

  protected requestCreateQuestionFromBank(): void {
    this.createQuestionRequestTick.update((value) => value + 1);
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
      departmentId: this.normalizePositive(currentSettings.departmentId, 0),
    };

    this.facade
      .updateExamSettings(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.appMessageService.addSuccessMessage('Exam settings updated successfully.');
        },
        error: () => {
          // Error signal is handled in facade.
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
        error: () => {
          // Error signal is handled in facade.
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
        error: () => {
          // Error signal is handled in facade.
        },
      });

    this.facade
      .loadCourseDepartments(courseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          // Error signal is handled in facade.
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
