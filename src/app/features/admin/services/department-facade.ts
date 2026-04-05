import { inject, Injectable, signal } from '@angular/core';
import { Department } from '../../../data/services/department';
import { IDepartment } from '../../../data/models/department/idepartment';
import { IDepartmentById } from '../../../data/models/department/idepartment-by-id';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { IAssignCourses } from '../../../data/models/department/iassign-courses';
import { IReqAssignCourses } from '../../../data/models/department/ireq-assign-courses';

@Injectable({
  providedIn: 'root',
})
export class DepartmentFacade {
  private department = inject(Department);

  public departments = signal<IDepartmentById[]>([]);
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

  getDepartments() {
    this.startRequest();
    this.department.getDepartments().subscribe({
      next: (res) => {
        this.departments.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.setErrorFromUnknown(err);
        this.loading.set(false);
      },
    });
  }

  getDepartmentById(id: number) {
    this.startRequest();
    this.department.getDepartmentById(id).subscribe({
      next: (res) => {
        this.departmentById.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.setErrorFromUnknown(err);
        this.loading.set(false);
      },
    });
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

  getAssignCourses(id: number): Observable<IAssignCourses> {
    this.startRequest();
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
}
