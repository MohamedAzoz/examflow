import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CourseFacade } from '../services/course-facade';
import { CourseFilter } from './components/course-filter/course-filter';
import { CourseTable } from './components/course-table/course-table';
import { CourseModal } from './components/course-modal/course-modal';

@Component({
  selector: 'app-courses-managment',
  imports: [CourseFilter, CourseTable, CourseModal],
  templateUrl: './courses-managment.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursesManagment {
  public readonly courseFacade = inject(CourseFacade);

  protected readonly showModal = signal(false);

  constructor() {
    // Show modal if a course is selected for editing
    effect(() => {
      if (this.courseFacade.selectedCourse()) {
        this.showModal.set(true);
      }
    });
  }

  protected onAddCourse(): void {
    this.courseFacade.selectedCourse.set(null);
    this.showModal.set(true);
  }

  protected onSearchChanges(query: string): void {
    const filteredCourses = this.courseFacade.allCourses
      .value()
      ?.filter((course) => course.name.toLowerCase().includes(query.toLowerCase()));
    this.courseFacade.allCourses.set(filteredCourses);
  }

  protected onModalClosed(): void {
    this.showModal.set(false);
  }
}
