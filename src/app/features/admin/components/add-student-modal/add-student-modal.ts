import {
  Component,
    inject,
  output,
  ChangeDetectionStrategy,
  DestroyRef,
  signal,
  Input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Student } from '../../../../data/services/student';
import { IStudentRequest } from '../../../../data/services/student';
import { FilterConfig } from '../filter-modal/filter-modal';

@Component({
  selector: 'app-add-student-modal',
  imports: [FormsModule],
  templateUrl: './add-student-modal.html',
  styleUrls: ['../shard-model.css', './add-student-modal.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddStudentModal{
  private readonly studentService = inject(Student);
  private readonly destroyRef = inject(DestroyRef);

  readonly closed = output<void>();
  readonly studentAdded = output<void>();

  @Input() config!: FilterConfig;

  protected readonly submitting = signal(false);

  protected form = {
    nationalId: '',
    univCode: '',
    fullName: '',
    level: 1,
    deptId: 1,
    email: '',
    phone: '',
  };

  protected readonly academicLevels = [
    { label: 'Level 1', value: 1 },
    { label: 'Level 2', value: 2 },
    { label: 'Level 3', value: 3 },
    { label: 'Level 4', value: 4 },
    { label: 'Level 5 (Graduate)', value: 5 },
  ];

  protected readonly departments = [
    { label: 'Computer Science', id: 1 },
    { label: 'Electrical Engineering', id: 2 },
    { label: 'Mathematics', id: 3 },
    { label: 'Physics', id: 4 },
    { label: 'Biology', id: 5 },
    { label: 'Chemistry', id: 6 },
  ];

  protected isFormValid(): boolean {
    return !!(
      this.form.nationalId.trim() &&
      this.form.univCode.trim() &&
      this.form.fullName.trim() &&
      this.form.email.trim()
    );
  }

  protected submit(): void {
    if (!this.isFormValid() || this.submitting()) return;

    this.submitting.set(true);

    const request: IStudentRequest = {
      nationalId: this.form.nationalId.trim(),
      fullName: this.form.fullName.trim(),
      universityCode: this.form.univCode.trim(),
      academicLevel: this.form.level,
      departmentId: this.form.deptId,
      email: this.form.email.trim(),
      phoneNumber: this.form.phone.trim(),
    };

    this.studentService
      .createStudent(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.studentAdded.emit();
        },
        error: (err) => {
          console.error('Create student failed:', err);
          this.submitting.set(false);
        },
      });
  }
}