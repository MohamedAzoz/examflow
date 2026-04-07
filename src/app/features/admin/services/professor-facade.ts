import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, tap, throwError } from 'rxjs';
import { IAssignCourse } from '../../../data/models/Professor/iassign-courses';
import { IAssignCourses } from '../../../data/models/department/iassign-courses';
import { IProfessorResponse, Professor } from '../../../data/services/professor';
import { rxResource } from '@angular/core/rxjs-interop';

export interface ProfessorOption {
  id: string;
  fullName: string;
  universityCode: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfessorFacade {
  private readonly professorService = inject(Professor);

  public readonly professorsSearch = signal({
    nameSearch: '',
    sortingOption: 0,
    pageSize: 300,
    pageIndex: 1,
  });

  public readonly allProfessors = rxResource<ProfessorOption[], any>({
    stream: () => {
      const { nameSearch, sortingOption, pageSize, pageIndex } = this.professorsSearch();
      return this.professorService
        .getAllProfessors(nameSearch, sortingOption, pageSize, pageIndex)
        .pipe(
          map((res: IProfessorResponse) => {
            const mapped = (res.data || [])
              .map((item: any) => ({
                id: item.id || item.nationalId || item.universityCode || '',
                fullName: item.fullName || '',
                universityCode: item.universityCode || '',
              }))
              .filter((item: any) => !!item.id);
            this.professors.set(mapped);
            return mapped;
          })
        );
    },
  });

  public readonly assignedCoursesRequest = signal<string | null>(null);
  public readonly assignedCoursesResource = rxResource<IAssignCourses | null, string | null>({
    stream: () => {
      const id = this.assignedCoursesRequest();
      return id !== null ? this.professorService.getAssignedCourses(id).pipe(tap((res) => this.assignedCourses.set(res.assignedCourses || []))) : of(null);
    },
  });

  public readonly professors = signal<ProfessorOption[]>([]);
  public readonly assignedCourses = signal<IAssignCourses['assignedCourses']>([]);
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

  /** @deprecated Use allProfessors resource and professorsSearch signal. */
  getAllProfessors(
    nameSearch: string = '',
    professorSortingOption: number = 0,
    pageSize: number = 300,
    pageIndex: number = 1,
  ): void {
    this.professorsSearch.set({ 
      nameSearch, 
      sortingOption: professorSortingOption, 
      pageSize, 
      pageIndex 
    });
  }

  /** @deprecated Use assignedCoursesResource and assignedCoursesRequest signal. */
  getAssignedCourses(professorId: string): Observable<IAssignCourses> {
    this.assignedCoursesRequest.set(professorId);
    return this.professorService.getAssignedCourses(professorId).pipe(
      tap((res) => this.assignedCourses.set(res.assignedCourses || [])),
      catchError((err) => this.handleRequestError(err)),
      finalize(() => this.loading.set(false)),
    );
  }

  assignCourses(payload: IAssignCourse): Observable<unknown> {
    this.startRequest();
    return this.professorService.assignCourses(payload).pipe(
      catchError((err) => this.handleRequestError(err)),
      finalize(() => this.loading.set(false)),
    );
  }
}
