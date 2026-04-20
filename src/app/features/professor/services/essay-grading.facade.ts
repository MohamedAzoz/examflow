import { Injectable, inject, signal, computed } from '@angular/core';
import { ProfessorExam } from '../../../data/services/professor-exam';
import { finalize, tap, catchError } from 'rxjs/operators';
import { throwError, Observable } from 'rxjs';
import { IEssayGradingDetailsResponse } from '../../../data/models/ProfessorExam/IEssayGradingDetailsResponse';
import { IEssayGradingSubmit } from '../../../data/models/ProfessorExam/IEssayGradingSubmit';

@Injectable({
  providedIn: 'root'
})
export class EssayGradingFacade {
  private readonly professorExam = inject(ProfessorExam);

  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  
  private readonly _studentEssays = signal<IEssayGradingDetailsResponse | null>(null);
  
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
      tap((res: IEssayGradingDetailsResponse) => {
        this._studentEssays.set(res ?? null);
      }),
      catchError((err) => {
        this._error.set(err.message || 'Error occurred while fetching essays');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    ).subscribe();
  }

  submitGrades(gradingData: IEssayGradingSubmit): Observable<any> {
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
