import { inject, Injectable, signal, computed } from '@angular/core';
import { StudentExam } from '../../../data/services/student-exam';
import { Router } from '@angular/router';
import { IavailableExams } from '../../../data/models/StudentExam/IavailableExams';

@Injectable({
  providedIn: 'root',
})
export class StudentExamFacade {
  private studentExamService = inject(StudentExam);
  private router = inject(Router);

  upcomingExams = signal<IavailableExams[]>([]);
  // Simulated data for active and past exams since there is no endpoint for them yet.
  activeExams = signal<any[]>([]); 
  pastExams = signal<any[]>([]);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  loadAvailableExams() {
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

    // Mocking Past Exams until endpoint is created
    this.pastExams.set([
      { title: 'Physics 101', grade: '90% (A)' },
      { title: 'Electronic 301', grade: '90% (A+)' }
    ]);

    // Mocking Active Exams
    this.activeExams.set([
      { id: 1, title: 'Math 202', timeRemaining: 1800 } // 30 minutes in seconds
    ]);
  }

  startExam(examId: number) {
    this.isLoading.set(true);
    this.studentExamService.startExam(examId).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        // Navigate or handle exam start
        console.log('Exam started', response);
        // this.router.navigate(['/exam', examId]);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('Failed to start the exam.');
      }
    });
  }
}
