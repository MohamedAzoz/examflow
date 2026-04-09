import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { CourseFacade } from '../../../services/course-facade';
import { ICoueseResponse } from '../../../../../data/models/course/icouese-response';
import {
  getInitials,
  getAvatarColor,
  getAvatarText,
} from '../../../../../shared/utils/avatar.util';
import { CutPipe } from '../../../../../shared/pipes/cut-pipe';

@Component({
  selector: 'app-course-table',
  imports: [NgClass, CutPipe],
  templateUrl: './course-table.html',
  styleUrls: ['../../../shard-style.css', './course-table.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseTable {
  public readonly courseFacade = inject(CourseFacade);

  protected readonly pageSize = 5;
  protected readonly currentPage = signal(1);

  // Computed courses for pagination and search
  protected readonly filteredCourses = computed(() => {
    const all = this.courseFacade.allCourses.value() || [];
    // You can add local filtering here if needed,
    // but usually search is handled at the facade level.
    return all;
  });

  protected readonly paginatedCourses = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredCourses().slice(start, start + this.pageSize);
  });

  protected readonly totalCount = computed(() => this.filteredCourses().length);
  protected readonly totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize) || 1);

  protected readonly showingFrom = computed(() =>
    this.totalCount() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1,
  );

  protected readonly showingTo = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.totalCount()),
  );

  protected prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  protected nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
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
    return `badge-level-${level}`;
  }
}
