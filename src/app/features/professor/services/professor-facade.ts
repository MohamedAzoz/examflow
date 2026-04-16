import { inject, Injectable, signal } from '@angular/core';
import { Professor } from '../../../data/services/professor';
import { IAssignCourses } from '../../../data/models/department/iassign-courses';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProfessorFacade {
  private readonly professorService = inject(Professor);

  private readonly professorId = signal<boolean>(false);
  setProfessorId(): void {
    this.professorId.set(true);
  }
  // getAssignedCourses rxResource
  public readonly getAssignedCourses = rxResource<IAssignCourses | null, string | null>({
    stream: () => {
      return this.professorService.getAssignedCourses();
    },
  });
}
