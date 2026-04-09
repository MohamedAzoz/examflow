import { inject, Injectable, signal } from '@angular/core';
import { Semester } from '../../../data/services/semester';
import { ISemesterResponse } from '../../../data/models/semester/isemester-response';
import { ISemesterRequest } from '../../../data/models/semester/isemester-request';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class SemesterFacade {
  private readonly semesterService = inject(Semester);

  // Resources
  public readonly allSemestersResource = rxResource<ISemesterResponse[], unknown>({
    stream: () => this.semesterService.getAllSemesters(),
  });

  public readonly activeSemestersResource = rxResource<ISemesterResponse, unknown>({
    stream: () => this.semesterService.getActiveSemester(),
  });

  // State
  public readonly loading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);
  public readonly selectedSemester = signal<ISemesterResponse | null>(null);

  private startRequest(): void {
    this.loading.set(true);
    this.error.set(null);
  }

  private setErrorFromUnknown(err: unknown): void {
    const fallbackMessage = 'An unexpected error occurred. Please try again.';
    if (err instanceof HttpErrorResponse) {
      const apiMessage =
        typeof err.error === 'string'
          ? err.error
          : err.error?.message || err.error?.title || err.message;
      this.error.set(apiMessage || fallbackMessage);
    } else if (err instanceof Error) {
      this.error.set(err.message || fallbackMessage);
    } else {
      this.error.set(fallbackMessage);
    }
  }

  private handleRequestError(err: unknown): Observable<never> {
    this.setErrorFromUnknown(err);
    return throwError(() => err);
  }

  // Actions
  createSemester(data: ISemesterRequest): Observable<any> {
    this.startRequest();
    return this.semesterService.postSemesters(data).pipe(
      tap(() => {
        this.allSemestersResource.reload();
        this.activeSemestersResource.reload();
      }),
      catchError((err) => this.handleRequestError(err)),
      finalize(() => this.loading.set(false)),
    );
  }

  updateSemester(data: ISemesterResponse): Observable<any> {
    this.startRequest();
    return this.semesterService.putSemesters(data).pipe(
      tap(() => {
        this.allSemestersResource.reload();
        this.activeSemestersResource.reload();
      }),
      catchError((err) => this.handleRequestError(err)),
      finalize(() => this.loading.set(false)),
    );
  }

  deleteSemester(id: number): Observable<any> {
    this.startRequest();
    return this.semesterService.deleteSemesters(id).pipe(
      tap(() => {
        this.allSemestersResource.reload();
        this.activeSemestersResource.reload();
      }),
      catchError((err) => this.handleRequestError(err)),
      finalize(() => this.loading.set(false)),
    );
  }

  activateSemester(id: number): Observable<any> {
    this.startRequest();
    return this.semesterService.activateSemesters(id).pipe(
      tap(() => {
        this.allSemestersResource.reload();
        this.activeSemestersResource.reload();
      }),
      catchError((err) => this.handleRequestError(err)),
      finalize(() => this.loading.set(false)),
    );
  }

  deactivateSemester(id: number): Observable<any> {
    this.startRequest();
    return this.semesterService.deactivateSemesters(id).pipe(
      tap(() => {
        this.allSemestersResource.reload();
        this.activeSemestersResource.reload();
      }),
      catchError((err) => this.handleRequestError(err)),
      finalize(() => this.loading.set(false)),
    );
  }
}
