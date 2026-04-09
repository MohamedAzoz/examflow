import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { ICoueseResponse } from '../../../data/models/course/icouese-response';
import { Course } from '../../../data/services/course';
import { IassignDepartments } from '../../../data/models/course/IassignDepartments';
import { rxResource } from '@angular/core/rxjs-interop';
import { ICoueseRequest } from '../../../data/models/course/icouese-request';

@Injectable({
  providedIn: 'root',
})
export class CourseFacade {
  private readonly courseService = inject(Course);

  public readonly assignToDepartment = signal<IassignDepartments[]>([]);
  public readonly loading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);
  public readonly selectedCourse = signal<ICoueseResponse | null>(null);

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

  //#region Get All Course

  public readonly allCourses = rxResource<ICoueseResponse[], unknown>({
    stream: () => this.courseService.getAllCourses(),
  });

  /**
   * @deprecated Use allCourses resource value directly.
   * Call refreshCourses() or allCourses.reload() if needed.
   */
  getAllCourses(): void {
    this.allCourses.reload();
  }

  //#endregion

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

  createCourse(course: ICoueseRequest): Observable<any> {
    this.startRequest();
    return this.courseService.postCourse(course).pipe(
      catchError((err) => this.handleRequestError(err)),
      finalize(() => {
        this.loading.set(false);
        this.allCourses.reload();
      })
    );
  }

  updateCourse(course: ICoueseResponse): Observable<any> {
    this.startRequest();
    return this.courseService.putCourse(course).pipe(
      catchError((err) => this.handleRequestError(err)),
      finalize(() => {
        this.loading.set(false);
        this.allCourses.reload();
      })
    );
  }

  deleteCourse(id: number): Observable<any> {
    this.startRequest();
    return this.courseService.deleteCourse(id).pipe(
      catchError((err) => this.handleRequestError(err)),
      finalize(() => {
        this.loading.set(false);
        this.allCourses.reload();
      })
    );
  }
}
