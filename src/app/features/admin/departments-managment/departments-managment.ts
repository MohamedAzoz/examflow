import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { DepartmentFacade } from '../services/department-facade';
import { DepartmentFilter } from './components/department-filter/department-filter';
import { DepartmentTable } from './components/department-table/department-table';
import { DepartmentModal } from './components/department-modal/department-modal';

@Component({
  selector: 'app-departments-managment',
  imports: [DepartmentFilter, DepartmentTable, DepartmentModal],
  templateUrl: './departments-managment.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentsManagment {
  private readonly departmentFacade = inject(DepartmentFacade);

  protected readonly searchQuery = signal('');
  protected readonly showFormModal = signal(false);

  constructor() {
    this.departmentFacade.getDepartments();

    effect(() => {
      if (this.departmentFacade.selectedDepartment()) {
        this.showFormModal.set(true);
      }
    });
  }

  protected onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  protected onAddDepartment(): void {
    this.departmentFacade.selectedDepartment.set(null);
    this.showFormModal.set(true);
  }

  protected onModalClosed(): void {
    this.showFormModal.set(false);
    this.departmentFacade.selectedDepartment.set(null);
  }
}
