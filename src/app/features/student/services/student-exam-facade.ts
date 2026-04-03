import { inject, Injectable, signal, computed } from '@angular/core';
import { finalize, of, Subject } from 'rxjs';
import { Toggle } from '../../../core/services/toggle';
import { LocalStorage } from '../../../core/services/local-storage';
import { StudentExam } from '../../../data/services/student-exam';
import { Router } from '@angular/router';
import { IavailableExams } from '../../../data/models/StudentExam/IavailableExams';
import { IstartExam } from '../../../data/models/StudentExam/IstartExam';
import { IsendAnswer } from '../../../data/models/StudentExam/isend-answer';
import { data, IpastExams } from '../../../data/models/StudentExam/IpastExams';
import { IResultExam } from '../../../data/models/StudentExam/IResultExam';

@Injectable({
  providedIn: 'root',
})
export class StudentExamFacade {
  private readonly percentage = 2 / 3;
  private readonly studentExamService = inject(StudentExam);
  private readonly router = inject(Router);
  private readonly toggleService = inject(Toggle);
  private readonly localStorage = inject(LocalStorage);
  private readonly isOnline = connectivitySignal();

  /** All available exams from the API */
  readonly upcomingExams = signal<IavailableExams[]>([]);
  readonly pastExams = signal<data[]>([]);
  readonly pastExamResult = signal<data[]>([]);

  readonly currentExam = signal<IstartExam | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // getExamResults
  readonly examResults = signal<IResultExam | null>(null);

  readonly totalPages = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(6);

  /** Active Reactive Timer signal */
  private readonly currentTime = signal<number>(Date.now());

  public updateTime(): void {
    this.currentTime.set(Date.now());
  }

  /**
   * The currently active exam — one whose startTime <= now
   * and startTime + durationMinutes > now.
   */
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
    
    // Prioritize current ongoing exam info if available
    const exam = current || active;
    
    if (!exam || !exam.startTime) return 0;
    const start = new Date(exam.startTime).getTime();
    const joinWindowEnd = start + exam.durationMinutes * 60_000 * this.percentage;
    return Math.floor(joinWindowEnd - this.currentTime());
  });

  /**
   * Remaining seconds for the active exam countdown.
   * Returns 0 when no active exam.
   */
  readonly activeExamRemainingSeconds = computed<number>(() => {
    const exam = this.activeExam();
    if (!exam || !exam.startTime) return 0;
    const end = new Date(exam.startTime).getTime() + exam.durationMinutes * 60_000;
    return Math.max(0, Math.floor((end - this.currentTime()) / 1000));
  });

  /**
   * Upcoming-only exams — those whose startTime is still in the future.
   */
  readonly futureExams = computed<IavailableExams[]>(() => {
    const now = this.currentTime();
    return this.upcomingExams().filter((exam) => new Date(exam.startTime).getTime() > now);
  });

  readonly activeExamCountdown = computed<string>(() =>
    this.formatTime(this.activeExamRemainingSeconds()),
  );

  private formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  private pad(n: number): string {
    return n < 10 ? '0' + n : '' + n;
  }

  loadAvailableExams(): void {
    if (this.isOnline()) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.studentExamService.getAvailableExams().subscribe({
        next: (exams) => {
          this.upcomingExams.set(exams);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set('Failed to load upcoming exams.');
          console.error(error);
        },
      });
    }
  }

  startExam(examId: number): void {
    if (this.isOnline()) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      this.studentExamService.startExam(examId).subscribe({
        next: (response: IstartExam) => {
          this.currentExam.set(response);
          this.isLoading.set(false);
          const targetRoute = `/main/student/exam/${response.exam.examId}/0`;
          if (this.router.url !== targetRoute) {
            this.router.navigate(['/main/student/exam', response.exam.examId, 0]);
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set('Failed to start the exam.');
          console.error(error);
        },
      });
    }
  }
  getExamResults(examId: number): void {
    if (this.isOnline()) {
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
          this.errorMessage.set('Failed to load exam results.');
          console.error(error);
        },
      });
    }
  }
  submitExam(examId: number): any {
    if (this.isOnline()) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      return this.studentExamService.submitExam(examId).pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.localStorage.remove(`exam_start_${examId}`);
          this.localStorage.remove(`last_q_${examId}`);
          this.localStorage.remove(`marked_q_${examId}`);
          this.localStorage.remove(`sync_queue_${examId}`);
          this.localStorage.remove(`answers_cache_${examId}`);
          this.toggleService.examMode(false);
          this.router.navigate(['/main/student/past-results']);
        }),
      );
    }
    return of(null);
  }

  sendAnswer(data: IsendAnswer): any {
    if (this.isOnline()) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      return this.studentExamService
        .sendAnswer(data)
        .pipe(finalize(() => this.isLoading.set(false)));
    }
    return of(null);
  }

  loadPastExams(page: number = 1, pageSize: number = 2): void {
    if (this.isOnline()) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.studentExamService.getPastExams(page, pageSize).subscribe({
        next: (exams: IpastExams) => {
          this.pastExams.set(exams.data);
          this.isLoading.set(false);
          this.totalPages.set(exams.totalSize);
          this.currentPage.set(exams.pageIndex);
          this.pastExamResult.set(exams.data);
          this.pageSize.set(exams.pageSize);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.pastExams.set([]);
          this.totalPages.set(0);
          this.pastExamResult.set([]);
          this.errorMessage.set(error.message);
          console.error(error);
        },
      });
    }
  }
}

export function connectivitySignal() {
  const isOnline = signal(navigator.onLine);
  window.addEventListener('online', () => isOnline.set(true));
  window.addEventListener('offline', () => isOnline.set(false));
  return isOnline;
}
