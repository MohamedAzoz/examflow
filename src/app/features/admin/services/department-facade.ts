import { inject, Injectable, signal } from '@angular/core';
import { Department } from '../../../data/services/department';
import { IDepartment } from '../../../data/models/department/idepartment';
import { IDepartmentById } from '../../../data/models/department/idepartment-by-id';
import { catchError, finalize, Observable, of, tap, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { IAssignCourses } from '../../../data/models/department/iassign-courses';
import { IReqAssignCourses } from '../../../data/models/department/ireq-assign-courses';
import { rxResource } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class DepartmentFacade {
  private department = inject(Department);

  public readonly allDepartments = rxResource<IDepartmentById[], unknown>({
    stream: () =>
      this.department.getDepartments().pipe(tap((res) => this.departments.set(res || []))),
  });

  public readonly departmentByIdRequest = signal<number | null>(null);
  public readonly departmentByIdResource = rxResource<IDepartmentById | null, number | null>({
    stream: () => {
      const id = this.departmentByIdRequest();
      return id !== null
        ? this.department.getDepartmentById(id).pipe(tap((res) => this.departmentById.set(res)))
        : of(null);
    },
  });

  public readonly assignedCoursesRequest = signal<number | null>(null);
  public readonly assignedCoursesResource = rxResource<IAssignCourses | null, number | null>({
    stream: () => {
      const id = this.assignedCoursesRequest();
      return id !== null
        ? this.department
            .getAssignCourses(id)
            .pipe(tap((res) => this.assignedCourses.set(res.assignedCourses || [])))
        : of(null);
    },
  });

  public departments = signal<IDepartmentById[]>([]);
  public readonly selectedDepartment = signal<IDepartmentById | null>(null);
  public departmentById = signal<IDepartmentById | null>(null);
  public assignedCourses = signal<IAssignCourses['assignedCourses']>([]);
  public loading = signal<boolean>(false);
  public error = signal<string | null>(null);

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

  /** @deprecated Use allDepartments resource value. */
  getDepartments() {
    this.allDepartments.reload();
  }

  /** @deprecated Set departmentByIdRequest signal instead. */
  getDepartmentById(id: number) {
    this.departmentByIdRequest.set(id);
  }

  postDepartment(department: IDepartment) {
    this.startRequest();
    return this.department.postDepartment(department).pipe(
      catchError((err) => this.handleRequestError(err)),
      finalize(() => this.loading.set(false)),
    );
  }

  putDepartment(department: IDepartmentById) {
    this.startRequest();
    return this.department.putDepartment(department).pipe(
      catchError((err) => this.handleRequestError(err)),
      finalize(() => this.loading.set(false)),
    );
  }

  deleteDepartment(id: number) {
    this.startRequest();
    return this.department.deleteDepartment(id).pipe(
      catchError((err) => this.handleRequestError(err)),
      finalize(() => this.loading.set(false)),
    );
  }

  // /** @deprecated Use assignedCoursesResource. */
  getAssignCourses(id: number): Observable<IAssignCourses> {
    this.assignedCoursesRequest.set(id);
    return this.department.getAssignCourses(id).pipe(
      tap((res) => this.assignedCourses.set(res.assignedCourses || [])),
      catchError((err) => this.handleRequestError(err)),
      finalize(() => this.loading.set(false)),
    );
  }

  assignCourses(payload: IReqAssignCourses): Observable<unknown> {
    this.startRequest();
    return this.department.assignCourses(payload).pipe(
      catchError((err) => this.handleRequestError(err)),
      finalize(() => this.loading.set(false)),
    );
  }

  // /api/Department/deassign-courses
  deassignCourses(payload: IReqAssignCourses): Observable<unknown> {
    this.startRequest();
    return this.department.deassignCourses(payload).pipe(
      catchError((err) => this.handleRequestError(err)),
      finalize(() => this.loading.set(false)),
    );
  }
}
