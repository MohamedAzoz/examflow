import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { ICoueseResponse } from '../../../data/models/course/icouese-response';
import { Course } from '../../../data/services/course';
import { IassignDepartments } from '../../../data/models/course/IassignDepartments';

@Injectable({
  providedIn: 'root',
})
export class CourseFacade {
  private readonly courseService = inject(Course);

  public readonly courses = signal<ICoueseResponse[]>([]);
  public readonly assignToDepartment = signal<IassignDepartments[]>([]);
  public readonly loading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);

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
      return;
    }

    this.error.set(err instanceof Error ? err.message : fallbackMessage);
  }

  private handleRequestError(err: unknown): Observable<never> {
    this.setErrorFromUnknown(err);
    return throwError(() => err);
  }

  getAllCourses(): void {
    this.startRequest();
    this.courseService.getAllCourses().subscribe({
      next: (res) => {
        this.courses.set(res || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.setErrorFromUnknown(err);
        this.loading.set(false);
      },
    });
  }

  refreshCourses(): Observable<ICoueseResponse[]> {
    this.startRequest();
    return this.courseService.getAllCourses().pipe(
      catchError((err) => this.handleRequestError(err)),
      finalize(() => this.loading.set(false)),
    );
  }
  assignCourseDepartments(courseId: number): void {
    this.startRequest();
    this.courseService
      .assignDepartments(courseId)
      .pipe(
        catchError((err) => this.handleRequestError(err)),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((departments) => {
        this.assignToDepartment.set(departments);
      });
  }
}
