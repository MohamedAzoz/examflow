import { Injectable, inject, signal, computed } from '@angular/core';
import { ProfessorExam } from '../../../data/services/professor-exam';
import { finalize, tap, catchError } from 'rxjs/operators';
import { throwError, Observable } from 'rxjs';

export interface EssaySubmission {
  id?: number;
  questionId: number;
  questionTitle?: string;
  questionText: string;
  studentAnswer: string;
  maxScore: number;
  score?: number;
}

export interface StudentEssayDetails {
  studentId: number;
  studentName?: string;
  universityId: string;
  examId: number;
  examTitle: string;
  totalPendingStudents: number;
  essays: EssaySubmission[];
}

@Injectable({
  providedIn: 'root'
})
export class EssayGradingFacade {
  private readonly professorExam = inject(ProfessorExam);

  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  
  private readonly _studentEssays = signal<StudentEssayDetails | null>(null);
  
  public readonly loading = this._loading.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly studentEssays = this._studentEssays.asReadonly();

  loadStudentsEssaysForGrading(examId: number, pageIndex: number = 1, pageSize: number = 1): void {
    this._loading.set(true);
    this._error.set(null);

    const data = {
      ExamId: examId,
      PageIndex: pageIndex,
      PageSize: pageSize
    };

    this.professorExam.getStudentsEssaysForGrading(data).pipe(
      tap((res: any) => {
        // Map response logic based on typical shape
        this._studentEssays.set(res ?? null);
      }),
      catchError((err) => {
        this._error.set(err.message || 'Error occurred while fetching essays');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    ).subscribe();
  }

  submitGrades(gradingData: { examId: number; studentId: number; questionId: number; grade: number }[]): Observable<any> {
    this._loading.set(true);
    this._error.set(null);

    return this.professorExam.gradeEssays(gradingData).pipe(
      tap(() => {
        // Clear or refresh after successful grading
        this._studentEssays.set(null); 
      }),
      catchError((err) => {
        this._error.set(err.message || 'Error occurred while submitting grades');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  clear(): void {
    this._studentEssays.set(null);
    this._error.set(null);
    this._loading.set(false);
  }
}
