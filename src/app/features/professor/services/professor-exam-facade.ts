import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, finalize, Observable, of, tap, throwError } from 'rxjs';
import { IcreateExam } from '../../../data/models/ProfessorExam/icreate-exam';
import { Iexamdetails } from '../../../data/models/ProfessorExam/Iexamdetails.1';
import { IexamDetails, IexamDetailsData } from '../../../data/models/ProfessorExam/IexamDetails';
import { IupdateExam } from '../../../data/models/ProfessorExam/IupdateExam';
import { Department } from '../../../data/services/department';
import { ProfessorExam } from '../../../data/services/professor-exam';
import { IAssignCourses } from '../../../data/models/department/iassign-courses';
import { Course } from '../../../data/services/course';
import { IassignDepartments } from '../../../data/models/course/IassignDepartments';

@Injectable({
  providedIn: 'root',
})
export class ProfessorExamFacade {
  private readonly professorExamService = inject(ProfessorExam);
  private readonly courseService = inject(Course);

  public readonly examsRequest = signal<Iexamdetails>({
    courseId: null,
    academicLevel: null,
    departmentId: null,
    sorting: null,
    examStatus: null,
    semesterId: null,
    searchTitle: null,
    pageSize: 5,
    pageIndex: 1,
  });

  public readonly courseId = signal<number | null>(null);
  public readonly loading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);
  public readonly exams = signal<IexamDetailsData[]>([]);
  public readonly totalSize = signal<number>(0);
  // public readonly departments = signal<IDepartmentById[]>([]);

  private readonly reloadToken = signal(0);

  public readonly examDetailsResource = rxResource<IexamDetails | null, unknown>({
    stream: () => {
      this.reloadToken();
      const request = this.examsRequest();
      return this.professorExamService.getExamDetails(request).pipe(
        tap((res) => {
          this.exams.set(res?.data ?? []);
          this.totalSize.set(res?.totalSize ?? 0);
        }),
      );
    },
  });

  public readonly departmentsResource = rxResource<IassignDepartments[] | [], number | null>({
    params: () => this.courseId(),
    stream: ({ params }) => {
      if (params === 0 || params === null) {
        return of([]);
      }
      return this.courseService.assignDepartments(params);
    },
  });

  setCourseId(courseId: number | null): void {
    this.courseId.set(courseId);
    this.examsRequest.update((current) => ({
      ...current,
      courseId,
    }));
  }

  setPagination(pageIndex: number, pageSize: number): void {
    this.examsRequest.update((current) => ({
      ...current,
      pageIndex,
      pageSize,
    }));
  }

  applyFilters(filters: Partial<Iexamdetails>): void {
    this.examsRequest.update((current) => ({
      ...current,
      ...filters,
      pageIndex: 1,
    }));
  }

  resetFilters(): void {
    this.examsRequest.update((current) => ({
      ...current,
      academicLevel: null,
      departmentId: null,
      sorting: null,
      examStatus: null,
      semesterId: null,
      searchTitle: null,
      pageIndex: 1,
    }));
  }

  reloadExams(): void {
    this.reloadToken.update((value) => value + 1);
    this.examDetailsResource.reload();
  }

  createExam(payload: Omit<IcreateExam, 'courseId'>): Observable<unknown> {
    const currentCourseId = this.courseId();
    if (currentCourseId === null) {
      const message = 'Course id is required to create an exam.';
      this.error.set(message);
      return throwError(() => new Error(message));
    }

    this.startRequest();
    return this.professorExamService
      .createExam({
        ...payload,
        courseId: currentCourseId,
      })
      .pipe(
        tap(() => this.reloadExams()),
        catchError((err) => this.handleRequestError(err)),
        finalize(() => this.loading.set(false)),
      );
  }

  updateExam(payload: IupdateExam): Observable<unknown> {
    this.startRequest();
    return this.professorExamService.updateExam(payload).pipe(
      tap(() => this.reloadExams()),
      catchError((err) => this.handleRequestError(err)),
      finalize(() => this.loading.set(false)),
    );
  }

  deleteExam(examId: number): Observable<unknown> {
    this.startRequest();
    return this.professorExamService.deleteExam(examId).pipe(
      tap(() => this.reloadExams()),
      catchError((err) => this.handleRequestError(err)),
      finalize(() => this.loading.set(false)),
    );
  }

  publishExam(examId: number): Observable<unknown> {
    this.startRequest();
    return this.professorExamService.publishExam(examId).pipe(
      tap(() => this.reloadExams()),
      catchError((err) => this.handleRequestError(err)),
      finalize(() => this.loading.set(false)),
    );
  }

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
}
