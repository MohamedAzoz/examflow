import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  computed,
  signal,
  effect,
  untracked,
  DestroyRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentExamFacade, connectivitySignal } from '../../services/student-exam-facade';
import { Toggle } from '../../../../core/services/toggle';
import { ExamHeaderComponent } from './components/exam-header/exam-header';
import { QuestionAreaComponent } from './components/question-area/question-area';
import { QuestionMapComponent } from './components/question-map/question-map';
import { IsendAnswer } from '../../../../data/models/StudentExam/isend-answer';
import { toSignal, toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LocalStorage } from '../../../../core/services/local-storage';
import {
  debounceTime,
  distinctUntilChanged,
  from,
  concatMap,
  filter,
  finalize,
  map,
  catchError,
  of,
  takeWhile,
  Subject,
} from 'rxjs';

@Component({
  selector: 'app-exam-session',
  imports: [ExamHeaderComponent, QuestionAreaComponent, QuestionMapComponent],
  templateUrl: './exam-session.html',
  styleUrl: './exam-session.css',
})
export class ExamSessionComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private localStorage = inject(LocalStorage);
  private facade = inject(StudentExamFacade);
  private toggleService = inject(Toggle);

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly examId = computed(() => Number(this.params().get('examId') ?? 0));
  private indexInitialized = false;

  private readonly destroyRef = inject(DestroyRef);
  private readonly essayTrigger$ = new Subject<{ qId: number; text: string }>();
  private readonly syncTrigger$ = new Subject<void>();
  readonly isOnline = connectivitySignal();
  private isSyncing = false;

  constructor() {
    this.setupDataInitialization();
    this.setupUrlSyncEffect();
    this.setupRxjsPipelines();
    this.setupOnlineSyncTrigger();
  }

  readonly currentExam = computed(() => this.facade.currentExam());
  readonly errorMessage = computed(() => this.facade.errorMessage());
  readonly availableTimeToStart = computed(() => this.facade.availableTimeToStart());

  readonly questionIndex = signal<number>(0);
  readonly selectedOptions = signal<Record<number, number>>({});
  readonly essayAnswers = signal<Record<number, string>>({});
  readonly markedQuestions = signal<Record<number, boolean>>({});
  readonly allAnsweredIds = computed(() => {
    const mcq = this.selectedOptions();
    const essay = this.essayAnswers();
    const combined: Record<number, any> = { ...mcq };
    Object.entries(essay).forEach(([id, val]) => {
      if (val && val.trim() !== '') {
        combined[Number(id)] = val;
      }
    });
    return combined;
  });

  readonly questions = computed(() => this.currentExam()?.exam.liveExamQuestios ?? []);
  readonly currentQuestion = computed(() => this.questions()[this.questionIndex()] ?? null);
  readonly questionIds = computed(() => this.questions().map((q) => q.questionId));
  readonly currentQuestionImage = computed(() => {
    const path = this.currentQuestion()?.imagePath;
    return path ? `https://examflow.runasp.net${path}` : '';
  });

  readonly countdown = signal<string>('00:00:00');

  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    // Hide sidebar definitely during exam session
    this.toggleService.examMode(true);

    if (!this.currentExam() && this.examId()) {
      this.facade.startExam(this.examId());
      return;
    }

    if (!this.currentExam()) {
      this.router.navigate(['/main/student']);
    }
  }

  ngOnDestroy(): void {
    // Restore sidebar visibility
    this.toggleService.examMode(false);
    if (this.timer) {
      clearInterval(this.timer);
    }
    // Flush any pending essay updates
    const q = this.currentQuestion();
    if (q) {
      this.addQuestionToSyncQueue(q.questionId);
    }
  }

  initCountdown(): void {
    if (this.timer) return; // Guard against multiple timers

    const activeExam = this.currentExam();
    if (!activeExam?.exam?.durationMinutes) {
      return;
    }

    const examId = activeExam.exam.examId;
    const storageKey = `exam_start_${examId}`;

    // Get start time from local storage or fallback to backend startTime / current time
    let startTimestamp = parseInt(this.localStorage.get(storageKey) || '0', 10);
    if (!startTimestamp) {
      startTimestamp = activeExam.exam.startTime
        ? new Date(activeExam.exam.startTime).getTime()
        : Date.now();
      this.localStorage.set(storageKey, startTimestamp.toString());
    }

    const durationSeconds = activeExam.exam.durationMinutes * 60;

    const tick = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTimestamp) / 1000);
      let remaining = durationSeconds - elapsedSeconds;

      if (remaining <= 0) {
        remaining = 0;
        this.countdown.set('00:00:00');
        if (this.timer) clearInterval(this.timer);
        this.localStorage.remove(storageKey);
        this.submit(); // Auto-submit when time is expired
        return;
      }

      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = remaining % 60;
      this.facade.updateTime();
      this.countdown.set(
        `${h.toString().padStart(2, '0')}:${m
          .toString()
          .padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
      );
    };

    tick(); // Execute immediately so UI reflects without 1 second delay
    this.timer = setInterval(tick, 1000);
  }

  selectOption(optionId: number): void {
    const qId = this.currentQuestion()?.questionId;
    if (!qId) return;

    this.selectedOptions.update((v: Record<number, number>) => ({ ...v, [qId]: optionId }));
    this.updateLocalCache(qId, optionId, this.essayAnswers()[qId] || '');
    this.addQuestionToSyncQueue(qId);
  }

  essayAnswer(answer: string, questionId: number): void {
    if (!this.currentQuestion()) return;

    this.essayAnswers.update((v: Record<number, string>) => ({ ...v, [questionId]: answer }));
    // 1. Update cache immediately so it survives refresh
    this.updateLocalCache(questionId, this.selectedOptions()[questionId] || 0, answer);
    // 2. Trigger debounced sync
    this.essayTrigger$.next({ qId: questionId, text: answer });
  }

  toggleMark(): void {
    const qId = this.currentQuestion()?.questionId;
    if (qId === undefined) return;
    this.markedQuestions.update((v: Record<number, boolean>) => {
      const newMarks = { ...v, [qId]: !v[qId] };
      // Save marked questions for persistent reloading resilience
      this.localStorage.set(`marked_q_${this.examId()}`, JSON.stringify(newMarks));
      return newMarks;
    });
  }

  private updateLocalCache(qId: number, optId: number, essay: string): void {
    const examId = this.examId();
    if (!examId) return;
    const cacheKey = `answers_cache_${examId}`;
    const cache = this.getParsedLocalStorage<Record<number, any>>(cacheKey, {});
    cache[qId] = { selectedOptionId: optId, eassayAnswer: essay };
    this.localStorage.set(cacheKey, JSON.stringify(cache));
  }

  private addQuestionToSyncQueue(qId: number): void {
    const examId = this.examId();
    if (!examId) return;

    const queueKey = `sync_queue_${examId}`;
    let currentQueue = this.getParsedLocalStorage<number[]>(queueKey, []);

    if (!currentQueue.includes(qId)) {
      currentQueue.push(qId);
      this.localStorage.set(queueKey, JSON.stringify(currentQueue));
    }

    // Trigger sequential sync
    this.syncTrigger$.next();
  }

  private processSyncQueue(): void {
    const examId = this.examId();
    if (!examId || this.isSyncing || !this.isOnline()) return;

    const queueKey = `sync_queue_${examId}`;
    let queue = this.getParsedLocalStorage<number[]>(queueKey, []);

    if (queue.length === 0) return;

    this.isSyncing = true;

    // Sequential process using concatMap
    from(queue)
      .pipe(
        // Stop immediately if we go offline during processing
        takeWhile(() => this.isOnline()),
        concatMap((qId: number) => this.sendAnswerToBackend(qId)),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isSyncing = false;
        }),
      )
      .subscribe();
  }

  private sendAnswerToBackend(qId: number) {
    const examId = this.examId();
    const studentExamId = this.currentExam()?.studentExamId;
    if (!examId || !studentExamId || !this.isOnline()) return of(null);

    // Read from cache to ensure we send the latest persisted state (important after refresh)
    const cacheKey = `answers_cache_${examId}`;
    const cache = this.getParsedLocalStorage<Record<number, any>>(cacheKey, {});
    const cachedData = cache[qId];

    const optId = cachedData ? cachedData.selectedOptionId : this.selectedOptions()[qId] || 0;
    const essayText = cachedData ? cachedData.eassayAnswer : this.essayAnswers()[qId] || '';

    const data: IsendAnswer = {
      examId: examId,
      studentExamId: studentExamId.toString(),
      questionId: qId,
      selectedOptionId: Number(optId),
      eassayAnswer: essayText,
    };

    return this.facade.sendAnswer(data).pipe(
      map(() => {
        // Success: remove from local queue AND local cache
        const queueKey = `sync_queue_${examId}`;
        const queue = this.getParsedLocalStorage<number[]>(queueKey, []);
        const updatedQueue = queue.filter((id) => id !== qId);
        this.localStorage.set(queueKey, JSON.stringify(updatedQueue));

        const updatedCache = this.getParsedLocalStorage<Record<number, any>>(cacheKey, {});
        delete updatedCache[qId];
        this.localStorage.set(cacheKey, JSON.stringify(updatedCache));

        console.log('Synced question:', qId);
        return qId;
      }),
      catchError((err) => {
        console.error('Failed to sync question:', qId, err);
        return of(null);
      }),
    );
  }

  previous(): void {
    this.questionIndex.update((i: number) => Math.max(0, i - 1));
  }

  next(): void {
    this.questionIndex.update((i: number) => Math.min(this.questions().length - 1, i + 1));
  }

  jumpTo(index: number): void {
    this.questionIndex.set(index);
  }

  submit(): void {
    // Flush current question to sync queue
    const q = this.currentQuestion();
    if (q) {
      this.addQuestionToSyncQueue(q.questionId);
    }

    const examId = this.currentExam()?.exam?.examId;
    if (!examId) {
      return;
    }

    this.facade.submitExam(examId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.router.navigate(['/main/student/past-results']);
      }
    });
  }

  /* ---------------- Initialization Methods ---------------- */

  private setupDataInitialization(): void {
    effect(
      () => {
        const examData = this.currentExam();
        if (!examData) return;

        this.initializeAnswers(examData);
        this.initializeQuestionIndex(examData);
      },
      { allowSignalWrites: true },
    );
  }

  private initializeAnswers(examData: any): void {
    // Populate previously saved answers on load if they exist
    if (!examData.savedAnswers || !Array.isArray(examData.savedAnswers)) return;

    const currentOpts = untracked(this.selectedOptions);
    // Merge if empty, or just initialization case
    if (Object.keys(currentOpts).length === 0 && examData.savedAnswers.length > 0) {
      const initialAnswers: Record<number, number> = {};
      const initialEssayAnswers: Record<number, string> = {};

      // 1. Start with backend data
      examData.savedAnswers.forEach((ans: any) => {
        if (ans.selectedOptionId) initialAnswers[ans.questionId] = ans.selectedOptionId;
        if (ans.eassayAnswer) initialEssayAnswers[ans.questionId] = ans.eassayAnswer;
      });

      // 2. Merge with local unsynced work (local takes priority)
      const localCache = this.getParsedLocalStorage<Record<number, any>>(
        `answers_cache_${this.examId()}`,
        {},
      );
      Object.entries(localCache).forEach(([qId, data]) => {
        const numQId = Number(qId);
        if (data.selectedOptionId) initialAnswers[numQId] = data.selectedOptionId;
        if (data.eassayAnswer) initialEssayAnswers[numQId] = data.eassayAnswer;
      });

      this.selectedOptions.set(initialAnswers);
      this.essayAnswers.set(initialEssayAnswers);

      // 3. Trigger sync if there's work in the queue
      const queue = this.getParsedLocalStorage<number[]>(`sync_queue_${this.examId()}`, []);
      if (queue.length > 0) {
        this.syncTrigger$.next();
      }
    }
  }

  private initializeQuestionIndex(examData: any): void {
    if (!examData.exam || this.indexInitialized) return;

    untracked(() => {
      this.initCountdown();

      let targetQId = Number(this.params().get('qId'));

      // If URL is 0 or empty, check LocalStorage
      if (!targetQId || targetQId === 0) {
        targetQId = Number(this.localStorage.get(`last_q_${this.examId()}`));
      }

      if (targetQId && targetQId !== 0) {
        const idx = this.questionIds().indexOf(targetQId);
        if (idx !== -1) {
          this.questionIndex.set(idx);
        }
      }

      // Restore marked questions state if available
      this.markedQuestions.set(
        this.getParsedLocalStorage<Record<number, boolean>>(`marked_q_${this.examId()}`, {}),
      );

      this.indexInitialized = true;
    });
  }

  private setupUrlSyncEffect(): void {
    effect(() => {
      const q = this.currentQuestion();
      if (q && this.indexInitialized) {
        const examId = this.examId();
        if (examId) {
          this.localStorage.set(`last_q_${examId}`, q.questionId.toString());
        }

        this.router.navigate(['../', q.questionId], {
          relativeTo: this.route,
          replaceUrl: true,
        });
      }
    });
  }

  private setupRxjsPipelines(): void {
    // 1. Essay Debounce Pipeline
    this.essayTrigger$
      .pipe(
        debounceTime(1000),
        distinctUntilChanged((prev, curr) => prev.qId === curr.qId && prev.text === curr.text),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((v) => {
        this.addQuestionToSyncQueue(v.qId);
      });

    // 2. Sequential Sync Pipeline
    this.syncTrigger$
      .pipe(
        filter(() => !this.isSyncing && this.isOnline()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.processSyncQueue();
      });
  }

  private setupOnlineSyncTrigger(): void {
    effect(() => {
      // Upon coming back online, trigger the flush
      if (this.isOnline()) {
        untracked(() => this.syncTrigger$.next());
      }
    });
  }

  private getParsedLocalStorage<T>(key: string, defaultValue: T): T {
    try {
      const item = this.localStorage.get(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error parsing localStorage key: ${key}`, e);
      return defaultValue;
    }
  }
}
