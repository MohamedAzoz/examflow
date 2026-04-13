import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { QuestionType } from '../../../data/enums/question-type';
import { IsubmitExam } from '../../../data/models/StudentExam/IsubmitExam';
import { IsendAnswer } from '../../../data/models/StudentExam/isend-answer';
import { IstartExam } from '../../../data/models/StudentExam/IstartExam';
import { AppDatabase } from '../../../core/AppDbContext/app-database';
import { PersistedExamSessionState } from '../../../core/AppDbContext/storage.models';
import { Timer } from '../../../core/services/timer';
import { Toggle } from '../../../core/services/toggle';
import { StudentExamFacade, connectivitySignal } from '../services/student-exam-facade';
import { ExamHeaderComponent } from './components/exam-header/exam-header';
import { QuestionAreaComponent } from './components/question-area/question-area';
import { QuestionMapComponent } from './components/question-map/question-map';

interface AntiCheatCounters {
  serverResponses: number;
  sessionId: number;
}

@Component({
  selector: 'app-exam-session',
  imports: [ExamHeaderComponent, QuestionAreaComponent, QuestionMapComponent],
  templateUrl: './exam-session.html',
  styleUrl: './exam-session.css',
})
export class ExamSessionComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(StudentExamFacade);
  private readonly appDb = inject(AppDatabase);
  private readonly toggleService = inject(Toggle);
  private readonly timerService = inject(Timer);

  readonly isOnline = connectivitySignal();
  readonly currentExam = computed(() => this.facade.currentExam());
  readonly errorMessage = computed(() => this.facade.errorMessage());
  readonly availableTimeToStart = computed(() => this.facade.availableTimeToStart());
  readonly questionIndex = computed(() => this.facade.currentQuestionIndex());

  readonly selectedOptions = signal<Record<number, number>>({});
  readonly essayAnswers = signal<Record<number, string>>({});
  readonly markedQuestions = signal<Record<number, boolean>>({});
  readonly syncedAnsweredIds = signal<Record<number, boolean>>({});
  readonly essayDirtyMap = signal<Record<number, boolean>>({});
  readonly antiCheatCounters = signal<AntiCheatCounters>({ serverResponses: 0, sessionId: 0 });

  readonly showNavigationWarning = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly isSavingEssay = signal<boolean>(false);

  private answersInitialized = false;
  private timerInitialized = false;
  private lastShortcutTimestamp = 0;
  private lastTabSwitchTimestamp = 0;

  readonly questions = computed(() => this.currentExam()?.exam.liveExamQuestios ?? []);
  readonly currentQuestion = computed(() => this.questions()[this.questionIndex()] ?? null);
  readonly questionIds = computed(() => this.questions().map((q) => q.questionId));
  readonly currentQuestionImage = computed(() => {
    const path = this.currentQuestion()?.imagePath;
    return path ? `${environment.baseUrl}${path}` : '';
  });

  readonly allAnsweredIds = computed(() => {
    return this.syncedAnsweredIds();
  });

  readonly countdown = computed(() => this.timerService.countdown());
  readonly isDirty = computed(() => {
    const q = this.currentQuestion();
    if (!q || q.questionType !== QuestionType.Essay) {
      return false;
    }

    const currentAnswer = this.essayAnswers()[q.questionId] || '';

    // If result is only whitespace or empty, don't mark as dirty/block navigation
    if (!currentAnswer.trim()) {
      return false;
    }

    return Boolean(this.essayDirtyMap()[q.questionId]);
  });

  constructor() {
    this.setupExamInitialization();
  }

  async ngOnInit(): Promise<void> {
    this.toggleService.examMode(true);

    const examId = Number(this.route.snapshot.paramMap.get('examId') ?? 0);
    if (!examId) {
      this.router.navigate(['/main/student']);
      return;
    }

    this.facade.setSessionExamId(examId);

    const restored = await this.restoreExamSessionState(examId);
    if (restored) {
      return;
    }

    const existingExamId = this.currentExam()?.exam.examId;
    if (existingExamId !== examId) {
      this.facade.startExam(examId);
    }
  }

  ngOnDestroy(): void {
    this.persistExamSessionStateInBackground();
    this.toggleService.examMode(false);
    this.timerService.stopExam();
  }

  canDeactivate(): boolean {
    if (this.isDirty()) {
      this.showNavigationWarning.set(true);
      return false;
    }

    return true;
  }

  async selectOption(optionId: number): Promise<void> {
    const q = this.currentQuestion();
    if (!q) return;

    this.selectedOptions.update((state) => ({ ...state, [q.questionId]: optionId }));
    await this.sendAnswerAndIgnoreErrors(q.questionId);
  }

  essayAnswer(answer: string, questionId: number): void {
    this.essayAnswers.update((state) => ({ ...state, [questionId]: answer }));
    this.essayDirtyMap.update((state) => ({ ...state, [questionId]: true }));
    this.showNavigationWarning.set(false);
  }

  async saveEssayAnswer(): Promise<void> {
    const q = this.currentQuestion();
    const isDirty = this.isDirty();

    if (!q || q.questionType !== QuestionType.Essay || !isDirty || this.isSavingEssay()) {
      return;
    }

    this.isSavingEssay.set(true);
    try {
      const isSaved = await this.sendAnswerAndIgnoreErrors(q.questionId);
      if (isSaved) {
        this.essayDirtyMap.update((state) => ({ ...state, [q.questionId]: false }));
        this.showNavigationWarning.set(false);
      }
    } finally {
      this.isSavingEssay.set(false);
    }
  }

  toggleMark(): void {
    const qId = this.currentQuestion()?.questionId;
    if (!qId) return;

    this.markedQuestions.update((state) => ({ ...state, [qId]: !state[qId] }));
    this.persistExamSessionStateInBackground();
  }

  previous(): void {
    if (this.blockNavigationWhileDirty()) return;

    this.facade.setCurrentQuestionIndex(Math.max(0, this.questionIndex() - 1));
    this.persistExamSessionStateInBackground();
  }

  next(): void {
    if (this.blockNavigationWhileDirty()) return;

    this.facade.setCurrentQuestionIndex(
      Math.min(this.questions().length - 1, this.questionIndex() + 1),
    );
    this.persistExamSessionStateInBackground();
  }

  jumpTo(index: number): void {
    if (this.blockNavigationWhileDirty()) return;

    this.facade.setCurrentQuestionIndex(index);
    this.persistExamSessionStateInBackground();
  }

  async submit(): Promise<void> {
    if (this.isSubmitting()) return;

    const examId = this.currentExam()?.exam.examId;
    if (!examId) return;

    const counters = this.antiCheatCounters();
    const payload: IsubmitExam = {
      examId,
      serverResponses: counters.serverResponses,
      sessionId: counters.sessionId,
    };

    this.isSubmitting.set(true);
    try {
      await this.saveCurrentEssayIfDirty();
      await firstValueFrom(this.facade.submitExam(payload));
      await this.appDb.clearExamSessionState(examId);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  @HostListener('document:copy')
  onCopy(): void {
    this.incrementCopyPaste();
  }

  @HostListener('document:cut')
  onCut(): void {
    this.incrementCopyPaste();
  }

  @HostListener('document:paste')
  onPaste(): void {
    this.incrementCopyPaste();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!(event.ctrlKey || event.metaKey)) return;

    const key = event.key.toLowerCase();
    if (key !== 'x' && key !== 'c' && key !== 'v') return;

    const now = Date.now();
    if (now - this.lastShortcutTimestamp < 150) return;

    this.lastShortcutTimestamp = now;
    this.incrementCopyPaste();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.hidden) {
      this.incrementTabSwitch();
    }
  }

  @HostListener('window:blur')
  onWindowBlur(): void {
    if (document.visibilityState === 'hidden') {
      this.incrementTabSwitch();
    }
  }

  private setupExamInitialization(): void {
    effect(
      () => {
        const exam = this.currentExam();
        if (!exam) return;

        this.initializeAnswers(exam);
        this.startTimer(exam);
        this.persistExamSessionStateInBackground();
      },
      { allowSignalWrites: true },
    );
  }

  private initializeAnswers(exam: IstartExam): void {
    if (this.answersInitialized) return;

    const selected: Record<number, number> = {};
    const essays: Record<number, string> = {};
    const syncedAnswered: Record<number, boolean> = {};

    for (const answer of exam.savedAnswers ?? []) {
      if (answer.selectedOptionId) {
        selected[answer.questionId] = answer.selectedOptionId;
      }

      if (answer.eassayAnswer) {
        essays[answer.questionId] = answer.eassayAnswer;
      }

      if (answer.selectedOptionId || answer.eassayAnswer?.trim()) {
        syncedAnswered[answer.questionId] = true;
      }
    }

    this.selectedOptions.set(selected);
    this.essayAnswers.set(essays);
    this.syncedAnsweredIds.set(syncedAnswered);
    this.answersInitialized = true;
  }

  private startTimer(exam: IstartExam): void {
    if (this.timerInitialized) return;

    this.timerService.startExam(exam.exam.startTime, exam.exam.durationMinutes, () => {
      void this.submit();
    });
    this.timerInitialized = true;
  }

  private blockNavigationWhileDirty(): boolean {
    if (!this.isDirty()) {
      this.showNavigationWarning.set(false);
      return false;
    }

    this.showNavigationWarning.set(true);
    return true;
  }

  private async saveCurrentEssayIfDirty(): Promise<void> {
    const q = this.currentQuestion();
    if (!q || q.questionType !== QuestionType.Essay || !this.isDirty()) {
      return;
    }

    const saved = await this.sendAnswerAndIgnoreErrors(q.questionId);
    if (saved) {
      this.essayDirtyMap.update((state) => ({ ...state, [q.questionId]: false }));
    }
  }

  private async sendAnswerAndIgnoreErrors(questionId: number): Promise<boolean> {
    const exam = this.currentExam();
    if (!exam) return false;

    const counters = this.antiCheatCounters();
    const payload: IsendAnswer = {
      examId: exam.exam.examId,
      studentExamId: exam.studentExamId,
      questionId,
      selectedOptionId: this.selectedOptions()[questionId] ?? 0,
      eassayAnswer: this.essayAnswers()[questionId] ?? '',
      serverResponses: counters.serverResponses,
      sessionId: counters.sessionId,
    };

    try {
      await firstValueFrom(this.facade.sendAnswer(payload));
      this.updateSyncedAnsweredState(questionId);
      await this.persistExamSessionState();
      return true;
    } catch {
      return false;
    }
  }

  private incrementCopyPaste(): void {
    this.antiCheatCounters.update((state) => ({
      ...state,
      serverResponses: state.serverResponses + 1,
    }));
    this.persistExamSessionStateInBackground();
  }

  private incrementTabSwitch(): void {
    const now = Date.now();
    if (now - this.lastTabSwitchTimestamp < 800) return;

    this.lastTabSwitchTimestamp = now;
    this.antiCheatCounters.update((state) => ({
      ...state,
      sessionId: state.sessionId + 1,
    }));
    this.persistExamSessionStateInBackground();
  }

  private async restoreExamSessionState(examId: number): Promise<boolean> {
    const cachedState = await this.appDb.getExamSessionState(examId);
    if (!cachedState) {
      return false;
    }

    this.facade.currentExam.set(cachedState.examSnapshot);

    this.selectedOptions.set(cachedState.selectedOptions ?? {});
    this.essayAnswers.set(cachedState.essayAnswers ?? {});
    this.markedQuestions.set(cachedState.markedQuestions ?? {});
    this.syncedAnsweredIds.set(cachedState.syncedAnsweredIds ?? {});
    this.antiCheatCounters.set({
      serverResponses: cachedState.serverResponses ?? 0,
      sessionId: cachedState.sessionId ?? 0,
    });

    const restoredIndex = this.resolveQuestionIndex(
      cachedState.examSnapshot,
      cachedState.currentQuestionId,
      cachedState.currentQuestionIndex,
    );
    this.facade.setCurrentQuestionIndex(restoredIndex);

    this.answersInitialized = true;
    this.timerInitialized = false;

    return true;
  }

  private resolveQuestionIndex(
    exam: IstartExam,
    currentQuestionId: number | null,
    fallbackIndex: number,
  ): number {
    const questions = exam.exam.liveExamQuestios ?? [];
    if (!questions.length) {
      return 0;
    }

    if (currentQuestionId) {
      const indexFromId = questions.findIndex((q) => q.questionId === currentQuestionId);
      if (indexFromId >= 0) {
        return indexFromId;
      }
    }

    return Math.min(Math.max(fallbackIndex ?? 0, 0), questions.length - 1);
  }

  private persistExamSessionStateInBackground(): void {
    void this.persistExamSessionState();
  }

  private updateSyncedAnsweredState(questionId: number): void {
    const hasSelectedOption = (this.selectedOptions()[questionId] ?? 0) > 0;
    const hasEssayAnswer = Boolean((this.essayAnswers()[questionId] ?? '').trim());

    this.syncedAnsweredIds.update((state) => {
      const next = { ...state };

      if (hasSelectedOption || hasEssayAnswer) {
        next[questionId] = true;
      } else {
        delete next[questionId];
      }

      return next;
    });
  }

  private getPersistableSelectedOptions(): Record<number, number> {
    const persisted: Record<number, number> = {};
    const synced = this.syncedAnsweredIds();
    const selected = this.selectedOptions();

    Object.keys(synced).forEach((id) => {
      const questionId = Number(id);
      if (!synced[questionId]) {
        return;
      }

      const optionId = selected[questionId] ?? 0;
      if (optionId > 0) {
        persisted[questionId] = optionId;
      }
    });

    return persisted;
  }

  private getPersistableEssayAnswers(): Record<number, string> {
    const persisted: Record<number, string> = {};
    const synced = this.syncedAnsweredIds();
    const essays = this.essayAnswers();

    Object.keys(synced).forEach((id) => {
      const questionId = Number(id);
      if (!synced[questionId]) {
        return;
      }

      const answer = essays[questionId] ?? '';
      if (answer.trim()) {
        persisted[questionId] = answer;
      }
    });

    return persisted;
  }

  private async persistExamSessionState(): Promise<void> {
    const exam = this.currentExam();
    if (!exam) {
      return;
    }

    const counters = this.antiCheatCounters();
    const state: PersistedExamSessionState = {
      examId: exam.exam.examId,
      examSnapshot: exam,
      selectedOptions: this.getPersistableSelectedOptions(),
      essayAnswers: this.getPersistableEssayAnswers(),
      markedQuestions: { ...this.markedQuestions() },
      syncedAnsweredIds: { ...this.syncedAnsweredIds() },
      currentQuestionId: this.currentQuestion()?.questionId ?? null,
      currentQuestionIndex: this.questionIndex(),
      serverResponses: counters.serverResponses,
      sessionId: counters.sessionId,
      updatedAt: Date.now(),
    };

    await this.appDb.saveExamSessionState(state);
  }
}
