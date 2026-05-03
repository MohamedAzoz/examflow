import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CourseFacade } from '../../../services/course-facade';
import { ICoueseResponse } from '../../../../../data/models/course/icouese-response';
import {
  getInitials,
  getAvatarColor,
  getAvatarText,
} from '../../../../../shared/utils/avatar.util';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-course-table',
  imports: [ButtonModule],
  templateUrl: './course-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseTable {
  public readonly courseFacade = inject(CourseFacade);

  // Computed courses for pagination and search
  protected readonly filteredCourses = computed(() => {
    const all = this.courseFacade.allCourses.value()?.data || [];
    const query = this.courseFacade.searchQuery().trim().toLowerCase();

    if (!query) {
      return all;
    }

    return all.filter(
      (course) =>
        course.name.toLowerCase().includes(query) || course.code.toLowerCase().includes(query),
    );
  });

  protected readonly paginatedCourses = computed(() => {
    // The backend is already returning the current page's slice
    return this.filteredCourses();
  });

  protected readonly totalCount = computed(
    () => this.courseFacade.allCourses.value()?.totalSize || 0,
  );
  protected readonly pageSize = computed(
    () => this.courseFacade.allCourses.value()?.pageSize || 10,
  );
  protected readonly currentPage = computed(
    () => this.courseFacade.allCourses.value()?.pageIndex || 1,
  );

  protected readonly totalPages = computed(
    () => Math.ceil(this.totalCount() / this.pageSize()) || 1,
  );

  protected readonly showingFrom = computed(() =>
    this.totalCount() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1,
  );

  protected readonly showingTo = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.totalCount()),
  );

  protected trackByCourseId(_: number, course: ICoueseResponse): number {
    return course.id;
  }

  protected prevPage(): void {
    if (this.currentPage() > 1) {
      this.courseFacade.setPageIndex(this.currentPage() - 1);
    }
  }

  protected nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.courseFacade.setPageIndex(this.currentPage() + 1);
    }
  }

  protected editCourse(course: ICoueseResponse): void {
    this.courseFacade.selectedCourse.set(course);
  }

  protected deleteCourse(course: ICoueseResponse): void {
    if (confirm(`Are you sure you want to delete "${course.name}"?`)) {
      this.courseFacade.deleteCourse(course.id).subscribe();
    }
  }

  protected getInitials(name: string): string {
    return getInitials(name);
  }

  protected getAvatarColor(index: number): string {
    return getAvatarColor(index);
  }

  protected getAvatarText(index: number): string {
    return getAvatarText(index);
  }

  protected getLevelClass(level: number): string {
    const base = 'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold';

    switch (level) {
      case 1:
        return `${base} bg-indigo-100 text-indigo-700`;
      case 2:
        return `${base} bg-orange-100 text-orange-700`;
      case 3:
        return `${base} bg-purple-100 text-purple-700`;
      case 4:
        return `${base} bg-teal-100 text-teal-700`;
      default:
        return `${base} bg-slate-100 text-slate-700`;
    }
  }
}
