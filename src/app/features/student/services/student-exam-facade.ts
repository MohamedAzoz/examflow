import { inject, Injectable, signal, computed } from '@angular/core';
import { finalize } from 'rxjs';
import { StudentExam } from '../../../data/services/student-exam';
import { Router } from '@angular/router';
import { IavailableExams } from '../../../data/models/StudentExam/IavailableExams';
import { IstartExam } from '../../../data/models/StudentExam/IstartExam';
import { IsendAnswer } from '../../../data/models/StudentExam/isend-answer';

@Injectable({
  providedIn: 'root',
})
export class StudentExamFacade {
  private readonly studentExamService = inject(StudentExam);
  private readonly router = inject(Router);

  /** All available exams from the API */
  readonly upcomingExams = signal<IavailableExams[]>([]);

  readonly currentExam = signal<IstartExam | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

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

  /**
   * Remaining seconds for the active exam countdown.
   * Returns 0 when no active exam.
   */
  readonly activeExamRemainingSeconds = computed<number>(() => {
    const exam = this.activeExam();
    if (!exam) return 0;
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

  /**
   * Past exams — those which have completely finished (endTime < now).
   */
  readonly pastExams = computed<IavailableExams[]>(() => {
    const now = this.currentTime();
    return this.upcomingExams().filter(
      (exam) => new Date(exam.startTime).getTime() + exam.durationMinutes * 60_000 <= now,
    );
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

  startExam(examId: number): void {
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

  submitExam(examId: number) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    return this.studentExamService.submitExam(examId).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }
  //sendAnswer
  sendAnswer(data: IsendAnswer) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    return this.studentExamService.sendAnswer(data).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }
}
