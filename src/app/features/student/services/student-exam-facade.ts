import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, from, of, switchMap, tap, throwError } from 'rxjs';
import { AppDatabase } from '../../../core/AppDbContext/app-database';
import { Timer } from '../../../core/services/timer';
import { Toggle } from '../../../core/services/toggle';
import { IavailableExams } from '../../../data/models/StudentExam/IavailableExams';
import { IpastExams, data } from '../../../data/models/StudentExam/IpastExams';
import { IResultExam } from '../../../data/models/StudentExam/IResultExam';
import { IsubmitExam } from '../../../data/models/StudentExam/IsubmitExam';
import { IstartExam } from '../../../data/models/StudentExam/IstartExam';
import { IsendAnswer } from '../../../data/models/StudentExam/isend-answer';
import { StudentExam } from '../../../data/services/student-exam';
import { AppMessageService } from '../../../core/services/app-message';

@Injectable({
  providedIn: 'root',
})
export class StudentExamFacade {
  private readonly percentage = 2 / 3;
  private readonly studentExamService = inject(StudentExam);
  private readonly router = inject(Router);
  private readonly toggleService = inject(Toggle);
  private readonly timerService = inject(Timer);
  private readonly appMessage = inject(AppMessageService);
  private readonly appDb = inject(AppDatabase);
  private readonly isOnline = connectivitySignal();

  readonly upcomingExams = signal<IavailableExams[]>([]);
  readonly pastExams = signal<data[]>([]);
  readonly pastExamResult = signal<data[]>([]);

  readonly currentExam = signal<IstartExam | null>(null);
  readonly examResults = signal<IResultExam | null>(null);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly totalPages = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(6);

  readonly sessionExamId = signal<number | null>(null);
  readonly currentQuestionIndex = signal<number>(0);

  readonly currentTime = this.timerService.now;

  readonly activeExam = computed<IavailableExams | null>(() => {
    const now = this.currentTime();
    return (
      this.upcomingExams().find((exam) => {
        const start = new Date(exam.startTime).getTime();
        const end = start + exam.durationMinutes * 60_000;
        return start <= now && end > now;
      }) ?? null
    );
  });

  readonly availableTimeToStart = computed<number>(() => {
    const active = this.activeExam();
    const current = this.currentExam()?.exam;
    const exam = current || active;

    if (!exam || !exam.startTime) return 0;

    const start = new Date(exam.startTime).getTime();
    const joinWindowEnd = start + exam.durationMinutes * 60_000 * this.percentage;
    const remainingMs = joinWindowEnd - this.currentTime();

    if (remainingMs <= 0) {
      return 0;
    }

    return Math.ceil(remainingMs / 1000);
  });

  readonly activeExamRemainingSeconds = computed<number>(() => {
    const exam = this.activeExam();
    if (!exam || !exam.startTime) return 0;

    const end = new Date(exam.startTime).getTime() + exam.durationMinutes * 60_000;
    return Math.max(0, Math.floor((end - this.currentTime()) / 1000));
  });

  readonly futureExams = computed<IavailableExams[]>(() => {
    const now = this.currentTime();
    return this.upcomingExams().filter((exam) => new Date(exam.startTime).getTime() > now);
  });

  readonly activeExamCountdown = computed<string>(() =>
    this.timerService.formatTime(this.activeExamRemainingSeconds()),
  );

  setSessionExamId(examId: number): void {
    this.sessionExamId.set(examId);
  }

  setCurrentQuestionIndex(index: number): void {
    if (index < 0) return;
    this.currentQuestionIndex.set(index);
  }

  resetExamSessionState(): void {
    this.sessionExamId.set(null);
    this.currentQuestionIndex.set(0);
    this.currentExam.set(null);
  }

  loadAvailableExams(): void {
    if (!this.isOnline()) {
      this.appMessage.addWarnMessage('No internet connection.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.studentExamService.getAvailableExams().subscribe({
      next: (exams) => {
        this.upcomingExams.set(exams);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        const detail = this.appMessage.showHttpError(error, 'Failed to load upcoming exams.');
        this.errorMessage.set(detail);
      },
    });
  }

  startExam(examId: number): void {
    if (!this.isOnline()) {
      this.appMessage.addWarnMessage('No internet connection.');
      return;
    }

    this.setSessionExamId(examId);
    this.setCurrentQuestionIndex(0);

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.studentExamService.startExam(examId).subscribe({
      next: (response) => {
        this.currentExam.set(response);
        this.isLoading.set(false);

        const targetRoute = `/main/student/exam/${response.exam.examId}`;
        if (this.router.url !== targetRoute) {
          this.router.navigate(['/main/student/exam', response.exam.examId]);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        const detail = this.appMessage.showHttpError(error, 'Failed to start the exam.');
        this.errorMessage.set(detail);
      },
    });
  }

  getExamResults(examId: number): void {
    if (!this.isOnline()) {
      this.appMessage.addWarnMessage('No internet connection.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.studentExamService.getExamResults(examId).subscribe({
      next: (results) => {
        this.examResults.set(results);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.examResults.set(null);
        const detail = this.appMessage.showHttpError(error, 'Failed to load exam results.');
        this.errorMessage.set(detail);
      },
    });
  }

  submitExam(exam: IsubmitExam) {
    if (!this.isOnline()) {
      this.appMessage.addWarnMessage('No internet connection.');
      return of(null);
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.studentExamService.submitExam(exam).pipe(
      switchMap(() => from(this.appDb.clearExamSessionState(exam.examId))),
      tap(() => {
        this.toggleService.examMode(false);
        this.resetExamSessionState();
        this.appMessage.addSuccessMessage('Exam submitted successfully.');
        this.router.navigate(['/main/student/past-results']);
      }),
      catchError((error) => {
        const detail = this.appMessage.showHttpError(error, 'Failed to submit exam.');
        this.errorMessage.set(detail);
        return throwError(() => error);
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  sendAnswer(data: IsendAnswer) {
    if (!this.isOnline()) return of(null);

    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.studentExamService.sendAnswer(data).pipe(finalize(() => this.isLoading.set(false)));
  }

  loadPastExams(page: number = 1, pageSize: number = 2): void {
    if (!this.isOnline()) {
      this.appMessage.addWarnMessage('No internet connection.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.studentExamService.getPastExams(page, pageSize).subscribe({
      next: (exams: IpastExams) => {
        this.pastExams.set(exams.data);
        this.totalPages.set(exams.totalSize);
        this.currentPage.set(exams.pageIndex);
        this.pastExamResult.set(exams.data);
        this.pageSize.set(exams.pageSize);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.pastExams.set([]);
        this.totalPages.set(0);
        this.pastExamResult.set([]);
        const detail = this.appMessage.showHttpError(error, 'Failed to load past exams.');
        this.errorMessage.set(detail);
      },
    });
  }
}

export function connectivitySignal() {
  if (!connectivityInitialized) {
    connectivityInitialized = true;
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => sharedConnectivity.set(true));
      window.addEventListener('offline', () => sharedConnectivity.set(false));
    }
  }

  return sharedConnectivity;
}

const sharedConnectivity = signal(typeof navigator !== 'undefined' ? navigator.onLine : true);
let connectivityInitialized = false;
