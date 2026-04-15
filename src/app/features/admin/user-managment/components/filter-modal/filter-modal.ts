import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface SortOption {
  label: string;
  value: number;
}

export interface DepartmentOption {
  id: number;
  code: string;
}

export interface FilterConfig {
  title: string;
  sortOptions: readonly SortOption[];
  showAcademicLevel: boolean;
  academicLevels: readonly number[];
  showDepartment: boolean;
  departments: readonly DepartmentOption[];
}

export interface FilterResult {
  sortOption: number;
  academicLevel?: number;
  departmentId?: number;
}

@Component({
  selector: 'app-filter-modal',
  imports: [FormsModule],
  templateUrl: './filter-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterModal {
  readonly config = input.required<FilterConfig>();

  readonly closed = output<void>();
  readonly applied = output<FilterResult>();
  readonly reset = output<void>();

  protected readonly selectedSort = signal(0);
  protected readonly selectedLevel = signal(0);
  protected readonly selectedDeptId = signal(0);

  protected toggleLevel(level: number): void {
    this.selectedLevel.update((curr) => (curr === level ? 0 : level));
  }

  protected toggleDept(deptId: number): void {
    this.selectedDeptId.update((curr) => (curr === deptId ? 0 : deptId));
  }

  protected isLevelSelected(level: number): boolean {
    return this.selectedLevel() === level;
  }

  protected isDeptSelected(deptId: number): boolean {
    return this.selectedDeptId() === deptId;
  }

  protected onApply(): void {
    this.applied.emit({
      sortOption: this.selectedSort(),
      academicLevel: this.selectedLevel() || undefined,
      departmentId: this.selectedDeptId() || undefined,
    });
  }

  protected onReset(): void {
    this.selectedSort.set(0);
    this.selectedLevel.set(0);
    this.selectedDeptId.set(0);
    this.reset.emit();
  }

  protected onBackdropClick(): void {
    this.closed.emit();
  }
}
