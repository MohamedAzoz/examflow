import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IDepartment } from '../../../data/models/department/idepartment';
import { IDepartmentById } from '../../../data/models/department/idepartment-by-id';
import { DepartmentFacade } from '../services/department-facade';

@Component({
  selector: 'app-departments-managment',
  imports: [ReactiveFormsModule],
  templateUrl: './departments-managment.html',
  styleUrl: './departments-managment.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentsManagment {
  private readonly departmentFacade = inject(DepartmentFacade);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly searchQuery = signal('');
  protected readonly showFormModal = signal(false);
  protected readonly modalError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly editingDepartment = signal<IDepartmentById | null>(null);

  protected readonly departments = computed(
    () => this.departmentFacade.allDepartments.value() || [],
  );
  protected readonly loading = this.departmentFacade.allDepartments.isLoading;
  protected readonly requestError = computed(
    () => (this.departmentFacade.allDepartments.error() as any)?.message || null,
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

  protected readonly departmentForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: [
      '',
      [Validators.required, Validators.maxLength(12), Validators.pattern(/^[a-zA-Z0-9]+$/)],
    ],
  });

  constructor() {
    this.departmentFacade.getDepartments();
  }

  protected onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  protected openCreateModal(): void {
    this.editingDepartment.set(null);
    this.modalError.set(null);
    this.departmentForm.reset({ name: '', code: '' });
    this.showFormModal.set(true);
  }

  protected openEditModal(department: IDepartmentById): void {
    this.editingDepartment.set(department);
    this.modalError.set(null);
    this.departmentForm.reset({ name: department.name, code: department.code });
    this.showFormModal.set(true);
  }

  protected closeModal(): void {
    this.showFormModal.set(false);
    this.modalError.set(null);
    this.submitting.set(false);
    this.departmentForm.reset({ name: '', code: '' });
    this.editingDepartment.set(null);
  }

  protected saveDepartment(): void {
    if (this.departmentForm.invalid || this.submitting()) {
      this.departmentForm.markAllAsTouched();
      return;
    }

    const rawName = this.departmentForm.controls.name.value;
    const rawCode = this.departmentForm.controls.code.value;

    const name = rawName.trim().replace(/\s+/g, ' ');
    const code = rawCode.trim().toUpperCase();
    const currentDepartment = this.editingDepartment();

    if (this.isDuplicateCode(code, currentDepartment?.id)) {
      this.modalError.set(`Duplicate Department Code. The code "${code}" is already assigned.`);
      this.departmentForm.controls.code.setErrors({ duplicate: true });
      this.departmentForm.controls.code.markAsTouched();
      return;
    }

    this.modalError.set(null);
    this.submitting.set(true);

    if (currentDepartment) {
      this.updateDepartment({ id: currentDepartment.id, name, code });
      return;
    }

    this.createDepartment({ name, code });
  }

  protected deleteDepartment(department: IDepartmentById): void {
    const isConfirmed = window.confirm(
      `Delete department "${department.name}" (${department.code})? This action cannot be undone.`,
    );

    if (!isConfirmed) return;

    this.departmentFacade
      .deleteDepartment(department.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.departmentFacade.getDepartments();
        },
        error: () => undefined,
      });
  }

  protected trackByDepartmentId(_: number, department: IDepartmentById): number {
    return department.id;
  }

  protected isEditing(): boolean {
    return !!this.editingDepartment();
  }

  protected hasControlError(controlName: 'name' | 'code', errorKey: string): boolean {
    const control = this.departmentForm.controls[controlName];
    return !!(control.touched && control.hasError(errorKey));
  }

  private createDepartment(payload: IDepartment): void {
    this.departmentFacade
      .postDepartment(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeModal();
          this.departmentFacade.getDepartments();
        },
        error: () => {
          this.submitting.set(false);
          this.modalError.set(this.requestError() || 'Failed to create department.');
        },
      });
  }

  private updateDepartment(payload: IDepartmentById): void {
    this.departmentFacade
      .putDepartment(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeModal();
          this.departmentFacade.getDepartments();
        },
        error: () => {
          this.submitting.set(false);
          this.modalError.set(this.requestError() || 'Failed to update department.');
        },
      });
  }

  private isDuplicateCode(code: string, currentId?: number): boolean {
    return this.departments().some(
      (department) =>
        department.code.trim().toUpperCase() === code &&
        (!currentId || department.id !== currentId),
    );
  }
}
