import {
  Component,
  inject,
  output,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
  Input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Professor } from '../../../../../data/services/professor';
import { FilterConfig } from '../filter-modal/filter-modal';

export interface IProfessorRequest {
  nationalId: string;
  fullName: string;
  universityCode: string;
  academicRank: string;
  email: string;
  phoneNumber: string;
}

@Component({
  selector: 'app-add-professor-modal',
  imports: [FormsModule],
  templateUrl: './add-professor-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddProfessorModalComponent {
  private readonly professorService = inject(Professor);
  private readonly destroyRef = inject(DestroyRef);

  @Input() config!: FilterConfig;
  readonly closed = output<void>();
  readonly professorAdded = output<void>();

  protected readonly submitting = signal(false);

  protected form = {
    nationalId: '',
    fullName: '',
    universityCode: '',
    academicRank: 'Assistant Professor',
    email: '',
    phoneNumber: '',
  };

  protected readonly academicRanks = [
    'Teaching Assistant',
    'Assistant Lecturer',
    'Lecturer',
    'Assistant Professor',
    'Associate Professor',
    'Professor',
  ];

  protected isFormValid(): boolean {
    return !!(
      this.form.nationalId.trim() &&
      this.form.fullName.trim() &&
      this.form.universityCode.trim() &&
      this.form.academicRank &&
      this.form.email.trim()
    );
  }

  protected submit(): void {
    if (!this.isFormValid() || this.submitting()) return;

    this.submitting.set(true);

    const request: IProfessorRequest = {
      nationalId: this.form.nationalId.trim(),
      fullName: this.form.fullName.trim(),
      universityCode: this.form.universityCode.trim(),
      academicRank: this.form.academicRank,
      email: this.form.email.trim(),
      phoneNumber: this.form.phoneNumber.trim(),
    };

    this.professorService
      .createProfessor(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.professorAdded.emit();
        },
        error: (err) => {
          console.error('Create professor failed:', err);
          this.submitting.set(false);
        },
      });
  }
}
