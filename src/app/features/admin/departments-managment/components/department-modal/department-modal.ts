import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IDepartment } from '../../../../../data/models/department/idepartment';
import { IDepartmentById } from '../../../../../data/models/department/idepartment-by-id';
import { DepartmentFacade } from '../../../services/department-facade';

@Component({
  selector: 'app-department-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './department-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentModal implements OnInit {
  private readonly departmentFacade = inject(DepartmentFacade);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly closed = output<void>();

  protected readonly submitting = signal(false);
  protected readonly modalError = signal<string | null>(null);

  protected readonly selectedDepartment = computed(() =>
    this.departmentFacade.selectedDepartment(),
  );

  protected readonly requestError = this.departmentFacade.error;

  protected readonly departmentForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: [
      '',
      [Validators.required, Validators.maxLength(12), Validators.pattern(/^[a-zA-Z0-9]+$/)],
    ],
  });

  ngOnInit(): void {
    const current = this.selectedDepartment();

    if (current) {
      this.departmentForm.reset({ name: current.name, code: current.code });
      return;
    }

    this.departmentForm.reset({ name: '', code: '' });
  }

  protected onClose(): void {
    this.submitting.set(false);
    this.modalError.set(null);
    this.departmentForm.reset({ name: '', code: '' });
    this.departmentFacade.selectedDepartment.set(null);
    this.closed.emit();
  }

  protected isEditing(): boolean {
    return !!this.selectedDepartment();
  }

  protected hasControlError(controlName: 'name' | 'code', errorKey: string): boolean {
    const control = this.departmentForm.controls[controlName];
    return !!(control.touched && control.hasError(errorKey));
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
    const currentDepartment = this.selectedDepartment();

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

  private createDepartment(payload: IDepartment): void {
    this.departmentFacade
      .postDepartment(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.departmentFacade.getDepartments();
          this.onClose();
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
          this.departmentFacade.getDepartments();
          this.onClose();
        },
        error: () => {
          this.submitting.set(false);
          this.modalError.set(this.requestError() || 'Failed to update department.');
        },
      });
  }

  private isDuplicateCode(code: string, currentId?: number): boolean {
    const departments = this.departmentFacade.allDepartments.value() || [];

    return departments.some(
      (department) =>
        department.code.trim().toUpperCase() === code &&
        (!currentId || department.id !== currentId),
    );
  }
}
