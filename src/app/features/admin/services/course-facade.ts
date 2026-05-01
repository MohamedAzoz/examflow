import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, of, throwError } from 'rxjs';
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

  private readonly AcademicLevel = signal<number | null>(null);
  private readonly HasProfessor = signal<boolean | null>(null);
  private readonly HasDepartment = signal<boolean | null>(null);
  private readonly PageIndex = signal(1);
  private readonly PageSize = signal(10);
  public readonly allCourses = rxResource<
    ICoueseResponse[],
    {
      AcademicLevel: number | null;
      HasProfessor: boolean | null;
      HasDepartment: boolean | null;
      PageIndex: number;
      PageSize: number;
    }
  >({
    params: () => ({
      AcademicLevel: this.AcademicLevel(),
      HasProfessor: this.HasProfessor(),
      HasDepartment: this.HasDepartment(),
      PageIndex: this.PageIndex(),
      PageSize: this.PageSize(),
    }),
    stream: ({ params }) => {
      return this.courseService.getAllCourses(
        params.AcademicLevel,
        params.HasProfessor,
        params.HasDepartment,
        params.PageIndex,
        params.PageSize,
      );
    },
  });

  //#endregion

  createCourse(course: ICoueseRequest): Observable<any> {
    this.startRequest();
    return this.courseService.postCourse(course).pipe(
      catchError((err) => this.handleRequestError(err)),
      finalize(() => {
        this.allCourses.reload();
      }),
    );
  }

  updateCourse(course: ICoueseResponse): Observable<any> {
    this.startRequest();
    return this.courseService.putCourse(course).pipe(
      catchError((err) => this.handleRequestError(err)),
      finalize(() => {
        this.allCourses.reload();
      }),
    );
  }

  deleteCourse(id: number): Observable<any> {
    this.startRequest();
    return this.courseService.deleteCourse(id).pipe(
      catchError((err) => this.handleRequestError(err)),
      finalize(() => {
        this.allCourses.reload();
      }),
    );
  }
}
