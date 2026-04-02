import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  computed,
  signal,
  effect,
  untracked,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { StudentExamFacade } from '../../services/student-exam-facade';
import { Toggle } from '../../../../core/services/toggle';
import { ExamHeaderComponent } from './components/exam-header/exam-header';
import { QuestionAreaComponent } from './components/question-area/question-area';
import { QuestionMapComponent } from './components/question-map/question-map';
import { IsendAnswer } from '../../../../data/models/StudentExam/isend-answer';
import { toSignal } from '@angular/core/rxjs-interop';
import { LocalStorage } from '../../../../core/services/local-storage';
import { finalize } from 'rxjs';

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
  private readonly examId = computed(() => Number(this.params()?.get('examId') ?? 0));
  private indexInitialized = false;

  constructor() {
    effect(
      () => {
        const examData = this.currentExam();
        // Populate previously saved answers on load if they exist
        if (examData?.savedAnswers && Array.isArray(examData.savedAnswers)) {
          const currentOpts = untracked(this.selectedOptions);
          if (Object.keys(currentOpts).length === 0 && examData.savedAnswers.length > 0) {
            const initialAnswers: Record<number, number> = {};
            const initialEssayAnswers: Record<number, string> = {};

            examData.savedAnswers.forEach((ans: any) => {
              if (ans.selectedOptionId) {
                initialAnswers[ans.questionId] = ans.selectedOptionId;
              }
              if (ans.eassayAnswer) {
                initialEssayAnswers[ans.questionId] = ans.eassayAnswer;
              }
            });

            this.selectedOptions.set(initialAnswers);
            this.essayAnswers.set(initialEssayAnswers);
          }
        }

        if (examData?.exam && !this.indexInitialized) {
          untracked(() => {
            this.initCountdown();

            let targetQId = Number(this.params()?.get('qId'));

            // If URL is 0 (due to facade hard-redirect) or empty, check LocalStorage
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
            const savedMarks = this.localStorage.get(`marked_q_${this.examId()}`);
            if (savedMarks) {
              try {
                this.markedQuestions.set(JSON.parse(savedMarks));
              } catch (e) {
                console.error('Error parsing marked questions', e);
              }
            }

            this.indexInitialized = true;
          });
        }
      },
      { allowSignalWrites: true },
    );

    // Sync URL silently when question changes for high-performance session tracking
    effect(() => {
      const q = this.currentQuestion();
      if (q && this.indexInitialized) {
        // Save the last viewed question to LocalStorage for bulletproof session restoring
        if (this.examId()) {
          this.localStorage.set(`last_q_${this.examId()}`, q.questionId.toString());
        }

        this.router.navigate(['../', q.questionId], {
          relativeTo: this.route,
          replaceUrl: true,
        });
      }
    });
  }

  readonly currentExam = computed(() => this.facade.currentExam());
  readonly errorMessage = computed(() => this.facade.errorMessage());
  // readonly isLoading = computed(() => this.facade.isLoading());
  readonly availableTimeToStart = computed(() => this.facade.availableTimeToStart());

  readonly questionIndex = signal<number>(0);
  readonly selectedOptions = signal<Record<number, number>>({});
  readonly essayAnswers = signal<Record<number, string>>({});
  readonly markedQuestions = signal<Record<number, boolean>>({});

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
    if (!this.currentQuestion()) {
      return;
    }
    this.selectedOptions.update((v) => ({ ...v, [this.currentQuestion().questionId]: optionId }));
    this.saveCurrentAnswer();
  }

  essayAnswer(answer: string, questionId: number): void {
    if (!this.currentQuestion()) {
      return;
    }
    this.essayAnswers.update((v) => ({ ...v, [questionId]: answer }));
    this.saveCurrentAnswer();
  }

  toggleMark(): void {
    const qId = this.currentQuestion()?.questionId;
    if (qId === undefined) return;
    this.markedQuestions.update((v) => {
      const newMarks = { ...v, [qId]: !v[qId] };
      // Save marked questions for persistent reloading resilience
      this.localStorage.set(`marked_q_${this.examId()}`, JSON.stringify(newMarks));
      return newMarks;
    });
  }

  saveCurrentAnswer(): void {
    const q = this.currentQuestion();
    if (!q) return;

    const examId = this.currentExam()?.exam?.examId;
    const studentExamId = this.currentExam()?.studentExamId;

    if (!examId || !studentExamId) return;

    const selectedOptionId = this.selectedOptions()[q.questionId] || 0;
    const essayText = this.essayAnswers()[q.questionId] || '';

    const data: IsendAnswer = {
      examId: examId,
      studentExamId: studentExamId.toString(),
      questionId: q.questionId,
      selectedOptionId: Number(selectedOptionId),
      eassayAnswer: essayText,
    };

    this.facade.sendAnswer(data).subscribe();
  }

  previous(): void {
    this.questionIndex.update((i) => Math.max(0, i - 1));
  }

  next(): void {
    this.questionIndex.update((i) => Math.min(this.questions().length - 1, i + 1));
  }

  jumpTo(index: number): void {
    this.questionIndex.set(index);
  }

  submit(): void {
    this.saveCurrentAnswer(); // Save the last question if not navigated away

    const examId = this.currentExam()?.exam?.examId;
    if (!examId) {
      return;
    }

    this.facade
      .submitExam(examId)
      .pipe(
        finalize(() => {
          // Clean up user's local storage regardless of API outcome status so they can take the exam again cleanly
          this.localStorage.remove(`exam_start_${examId}`);
          this.localStorage.remove(`last_q_${examId}`);
          this.localStorage.remove(`marked_q_${examId}`);
          this.toggleService.examMode(false);
          this.router.navigate(['/main/student']);
        }),
      )
      .subscribe();
  }
}
