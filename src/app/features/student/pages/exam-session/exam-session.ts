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
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  EMPTY,
  Observable,
  defaultIfEmpty,
  fromEvent,
  merge,
  throttleTime,
} from 'rxjs';
import { Timer } from '../../../../core/services/timer';
import { IsubmitExam } from '../../../../data/models/StudentExam/IsubmitExam';
import { Iexam, IstartExam } from '../../../../data/models/StudentExam/IstartExam';

interface AntiCheatCounters {
  copyPasteCnt: number;
  tabSwitchCnt: number;
}

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly timerService = inject(Timer);

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private indexInitialized = false;

  private readonly essayTrigger$ = new Subject<{ qId: number; text: string }>();
  private readonly syncTrigger$ = new Subject<void>();
  readonly isOnline = connectivitySignal();
  private isSyncing = false;

  private antiCheatLoadedForExamId: number | null = null;
  private lastShortcutTimestamp = 0;
  private readonly shortcutKeys = new Set(['x', 'c', 'v']);

  private readonly examId = computed(() => Number(this.params().get('examId') ?? 0));

  readonly antiCheatCounters = signal<AntiCheatCounters>({
    copyPasteCnt: 0,
    tabSwitchCnt: 0,
  });

  constructor() {
    this.setupDataInitialization();
    this.setupUrlSyncEffect();
    this.setupRxjsPipelines();
    this.setupOnlineSyncTrigger();
    this.setupAntiCheatStorageSync();
    this.setupFacadeTimeSyncEffect();
  }

  //#region  Signals

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
    const combined: Record<number, unknown> = { ...mcq };
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

  readonly countdown = computed(() => this.timerService.countdown());

  //#endregion

  ngOnInit(): void {
    this.setupAntiCheatDetection();

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
    this.timerService.stopExam();

    // Flush any pending essay updates
    const q = this.currentQuestion();
    if (q) {
      this.addQuestionToSyncQueue(q.questionId);
    }
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
    const cache = this.getParsedLocalStorage<Record<number, { selectedOptionId: number; eassayAnswer: string }>>(
      cacheKey,
      {},
    );
    cache[qId] = { selectedOptionId: optId, eassayAnswer: essay };
    this.localStorage.set(cacheKey, JSON.stringify(cache));
  }

  private addQuestionToSyncQueue(qId: number): void {
    const examId = this.examId();
    if (!examId) return;

    const queueKey = `sync_queue_${examId}`;
    const currentQueue = this.getParsedLocalStorage<number[]>(queueKey, []);

    if (!currentQueue.includes(qId)) {
      currentQueue.push(qId);
      this.localStorage.set(queueKey, JSON.stringify(currentQueue));
    }

    // Trigger sequential sync
    this.syncTrigger$.next();
  }

  private processSyncQueue(): void {
    this.flushSyncQueue().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  private flushSyncQueue(): Observable<void> {
    const examId = this.examId();
    if (!examId || this.isSyncing || !this.isOnline()) return of(void 0);

    const queueKey = `sync_queue_${examId}`;
    const queue = this.getParsedLocalStorage<number[]>(queueKey, []);

    if (queue.length === 0) return of(void 0);

    this.isSyncing = true;

    // Sequential process using concatMap
    return from(queue).pipe(
      // Stop immediately if we go offline during processing
      takeWhile(() => this.isOnline()),
      concatMap((qId: number) => this.sendAnswerToBackend(qId)),
      map(() => void 0),
      defaultIfEmpty(void 0),
      finalize(() => {
        this.isSyncing = false;
      }),
    );
  }

  private sendAnswerToBackend(qId: number) {
    const examId = this.examId();
    const studentExamId = this.currentExam()?.studentExamId;
    if (!examId || !studentExamId || !this.isOnline()) return EMPTY;

    // Read from cache to ensure we send the latest persisted state (important after refresh)
    const cacheKey = `answers_cache_${examId}`;
    const cache = this.getParsedLocalStorage<Record<number, { selectedOptionId: number; eassayAnswer: string }>>(
      cacheKey,
      {},
    );
    const cachedData = cache[qId];

    const optId = cachedData ? cachedData.selectedOptionId : this.selectedOptions()[qId] || 0;
    const essayText = cachedData ? cachedData.eassayAnswer : this.essayAnswers()[qId] || '';

    const counters = this.antiCheatCounters();

    const data: IsendAnswer = {
      examId: examId,
      studentExamId: studentExamId.toString(),
      questionId: qId,
      selectedOptionId: Number(optId),
      eassayAnswer: essayText,
      copyPasteCnt: counters.copyPasteCnt,
      tabSwitchCnt: counters.tabSwitchCnt,
    };

    return this.facade.sendAnswer(data).pipe(
      map(() => {
        // Success: remove from local queue AND local cache
        const queueKey = `sync_queue_${examId}`;
        const queue = this.getParsedLocalStorage<number[]>(queueKey, []);
        const updatedQueue = queue.filter((id) => id !== qId);
        this.localStorage.set(queueKey, JSON.stringify(updatedQueue));

        const updatedCache = this.getParsedLocalStorage<Record<number, { selectedOptionId: number; eassayAnswer: string }>>(
          cacheKey,
          {},
        );
        delete updatedCache[qId];
        this.localStorage.set(cacheKey, JSON.stringify(updatedCache));
        return qId;
      }),
      catchError(() => EMPTY),
    );
  }

  //#region  Methods
  previous(): void {
    this.questionIndex.update((i: number) => Math.max(0, i - 1));
  }

  next(): void {
    this.questionIndex.update((i: number) => Math.min(this.questions().length - 1, i + 1));
  }

  jumpTo(index: number): void {
    this.questionIndex.set(index);
  }

  //#endregion

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

    const counters = this.antiCheatCounters();
    const exam: IsubmitExam = {
      examId: examId,
      finalCopyPasteCnt: counters.copyPasteCnt,
      finalTabSwitchCnt: counters.tabSwitchCnt,
    };

    this.flushSyncQueue()
      .pipe(
        concatMap(() => this.facade.submitExam(exam)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  //#region  Initialization Methods

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

  private initializeAnswers(examData: IstartExam): void {
    // Populate previously saved answers on load if they exist
    if (!examData.savedAnswers || !Array.isArray(examData.savedAnswers)) return;

    const currentOpts = untracked(this.selectedOptions);
    // Merge if empty, or just initialization case
    if (Object.keys(currentOpts).length === 0) {
      const initialAnswers: Record<number, number> = {};
      const initialEssayAnswers: Record<number, string> = {};

      // 1. Start with backend data
      examData.savedAnswers.forEach((ans) => {
        if (ans.selectedOptionId) initialAnswers[ans.questionId] = ans.selectedOptionId;
        if (ans.eassayAnswer) initialEssayAnswers[ans.questionId] = ans.eassayAnswer;
      });

      // 2. Merge with local unsynced work (local takes priority)
      const localCache = this.getParsedLocalStorage<Record<number, { selectedOptionId: number; eassayAnswer: string }>>(
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

  private initializeQuestionIndex(examData: IstartExam): void {
    if (!examData.exam || this.indexInitialized) return;

    untracked(() => {
      this.startServerTimer(examData.exam);

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

  private setupAntiCheatStorageSync(): void {
    effect(
      () => {
        const examId = this.examId();
        if (!examId) return;

        if (this.antiCheatLoadedForExamId !== examId) {
          const loaded = this.getParsedLocalStorage<AntiCheatCounters>(
            this.getAntiCheatStorageKey(examId),
            { copyPasteCnt: 0, tabSwitchCnt: 0 },
          );
          this.antiCheatCounters.set({
            copyPasteCnt: Number(loaded.copyPasteCnt || 0),
            tabSwitchCnt: Number(loaded.tabSwitchCnt || 0),
          });
          this.antiCheatLoadedForExamId = examId;
        }

        this.localStorage.set(
          this.getAntiCheatStorageKey(examId),
          JSON.stringify(this.antiCheatCounters()),
        );
      },
      { allowSignalWrites: true },
    );
  }

  private setupAntiCheatDetection(): void {
    merge(
      fromEvent(document, 'copy'),
      fromEvent(document, 'cut'),
      fromEvent(document, 'paste'),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.trackClipboardAction());

    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter((event) => (event.ctrlKey || event.metaKey) && this.shortcutKeys.has(event.key.toLowerCase())),
        throttleTime(150),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.trackShortcutAction());

    merge(
      fromEvent(document, 'visibilitychange').pipe(filter(() => document.hidden)),
      fromEvent(window, 'blur').pipe(filter(() => document.visibilityState === 'hidden')),
    )
      .pipe(throttleTime(800), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.incrementTabSwitch());
  }

  private setupFacadeTimeSyncEffect(): void {
    effect(() => {
      this.timerService.now();
      this.facade.updateTime();
    });
  }

  private startServerTimer(exam: Iexam): void {
    this.timerService.startExam(exam.startTime, exam.durationMinutes, () => {
      this.submit();
    });
  }

  private trackShortcutAction(): void {
    this.lastShortcutTimestamp = Date.now();
    this.incrementCopyPaste();
  }

  private trackClipboardAction(): void {
    // Prevent double count when Ctrl/Cmd shortcut fires then clipboard event follows immediately.
    if (Date.now() - this.lastShortcutTimestamp < 400) {
      return;
    }
    this.incrementCopyPaste();
  }

  private incrementCopyPaste(): void {
    this.antiCheatCounters.update((value) => ({
      ...value,
      copyPasteCnt: value.copyPasteCnt + 1,
    }));
  }

  private incrementTabSwitch(): void {
    this.antiCheatCounters.update((value) => ({
      ...value,
      tabSwitchCnt: value.tabSwitchCnt + 1,
    }));
  }

  private getAntiCheatStorageKey(examId: number): string {
    return `anti_cheat_${examId}`;
  }

  private getParsedLocalStorage<T>(key: string, defaultValue: T): T {
    try {
      const item = this.localStorage.get(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  //#endregion
}
