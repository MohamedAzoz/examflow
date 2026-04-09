import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { SemesterFacade } from '../../../services/semester-facade';
import { ISemesterResponse } from '../../../../../data/models/semester/isemester-response';

@Component({
  selector: 'app-semester-table',
  imports: [DatePipe, NgClass],
  templateUrl: './semester-table.html',
  styleUrls: ['../../../shard-style.css', './semester-table.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SemesterTable {
  public readonly semesterFacade = inject(SemesterFacade);

  protected readonly pageSize = 5;
  protected readonly currentPage = signal(1);

  protected readonly allSemesters = computed(
    () => this.semesterFacade.allSemestersResource.value() || [],
  );

  protected readonly paginatedSemesters = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.allSemesters().slice(start, start + this.pageSize);
  });

  protected readonly totalCount = computed(() => this.allSemesters().length);
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

  protected editSemester(semester: ISemesterResponse): void {
    this.semesterFacade.selectedSemester.set(semester);
  }

  protected deleteSemester(semester: ISemesterResponse): void {
    if (confirm(`Are you sure you want to delete "${semester.name}"?`)) {
      this.semesterFacade.deleteSemester(semester.id).subscribe();
    }
  }

  protected toggleActivation(semester: ISemesterResponse): void {
    if (semester.status === 'Active') {
      this.semesterFacade.deactivateSemester(semester.id).subscribe();
    } else {
      this.semesterFacade.activateSemester(semester.id).subscribe();
    }
  }
}
