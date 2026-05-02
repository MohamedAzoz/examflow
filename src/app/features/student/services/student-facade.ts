import { inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { Student } from '../../../data/services/student';
import { IMyCourse } from '../../../data/models/Student/IMyCourse';

@Injectable({
  providedIn: 'root',
})
export class StudentFacade {
  private readonly studentService = inject(Student);

  // Enrolled Courses rxResource
  private shouldLoadCourses = signal<boolean>(false);

  public loadEnrolledCourses(): void {
    this.shouldLoadCourses.set(true);
  }

  public readonly enrolledCoursesResource = rxResource<IMyCourse[] | null, boolean>({
    params: () => this.shouldLoadCourses(),
    stream: ({ params }) => {
      if (params) {
        return this.studentService.getEnrolledCourses();
      }
      return EMPTY;
    },
  });
}
