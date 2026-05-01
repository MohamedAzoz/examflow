import { inject, Injectable, signal } from '@angular/core';
import { Professor } from '../../../data/services/professor';
import { IAssignCourses } from '../../../data/models/department/iassign-courses';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { ICoueseResponse } from '../../../data/models/course/icouese-response';
import { Course } from '../../../data/services/course';
import { ICoueseResponseDetails } from '../../../data/models/course/ICoueseResponseDetails';

@Injectable({
  providedIn: 'root',
})
export class ProfessorFacade {
  private readonly professorService = inject(Professor);
  private readonly courseService = inject(Course);

  // getAssignedCourses rxResource
  private AssignedCourses = signal<boolean>(false);
  public GetCourses(val: boolean): void {
    this.AssignedCourses.set(val);
  }
  public readonly getAssignedCourses = rxResource<IAssignCourses | null, boolean>({
    params: () => this.AssignedCourses(),
    stream: ({ params }) => {
      if (params) {
        return this.professorService.getAssignedCourses();
      }
      return of(null);
    },
  });
  // getCourseOverview rxResource
  private courseId = signal<number | null>(null);
  setCourseId(courseId: number): void {
    this.courseId.set(courseId);
  }
  public readonly getCourseOverview = rxResource<ICoueseResponse | null, number | null>({
    params: () => this.courseId(),
    stream: ({ params }) => {
      if (params) {
        return this.courseService.getCourseById(params);
      }
      return of(null);
    },
  });

  public readonly getCourseOverviewDetails = rxResource<
    ICoueseResponseDetails | null,
    number | null
  >({
    params: () => this.courseId(),
    stream: ({ params }) => {
      if (params) {
        return this.courseService.getCourseOverview(params);
      }
      return of(null);
    },
  });
}
