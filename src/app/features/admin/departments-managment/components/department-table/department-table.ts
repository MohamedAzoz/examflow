import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { IDepartmentById } from '../../../../../data/models/department/idepartment-by-id';
import { DepartmentFacade } from '../../../services/department-facade';

@Component({
  selector: 'app-department-table',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './department-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentTable {
  private readonly departmentFacade = inject(DepartmentFacade);

  readonly searchQuery = input<string>('');

  protected readonly loading = this.departmentFacade.allDepartments.isLoading;

  protected readonly departments = computed(
    () => this.departmentFacade.allDepartments.value() || [],
  );

  protected readonly filteredDepartments = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.departments();

    return this.departments().filter(
      (department) =>
        department.name.toLowerCase().includes(query) ||
        department.code.toLowerCase().includes(query),
    );
  });

  protected trackByDepartmentId(_: number, department: IDepartmentById): number {
    return department.id;
  }

  protected openEditModal(department: IDepartmentById): void {
    this.departmentFacade.selectedDepartment.set(department);
  }

  protected deleteDepartment(department: IDepartmentById): void {
    const isConfirmed = window.confirm(
      `Delete department "${department.name}" (${department.code})? This action cannot be undone.`,
    );

    if (!isConfirmed) return;

    this.departmentFacade.deleteDepartment(department.id).subscribe({
      next: () => {
        this.departmentFacade.getDepartments();
      },
      error: () => undefined,
    });
  }
}
