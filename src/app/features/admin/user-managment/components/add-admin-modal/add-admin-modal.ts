import {
  Component,
  inject,
  output,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Admin, IAdmin } from '../../../../../data/services/admin';

@Component({
  selector: 'app-add-admin-modal',
  imports: [FormsModule],
  templateUrl: './add-admin-modal.html',
  styleUrls: ['../../../shard-model.css', './add-admin-modal.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddAdminModalComponent {
  private readonly adminService = inject(Admin);
  private readonly destroyRef = inject(DestroyRef);

  readonly closed = output<void>();
  readonly adminAdded = output<void>();

  protected readonly submitting = signal(false);

  protected form = {
    nationalId: '',
    fullName: '',
    universityCode: '',
    jobTitle: '',
    email: '',
    phoneNumber: '',
  };

  protected isFormValid(): boolean {
    return !!(
      this.form.nationalId.trim() &&
      this.form.fullName.trim() &&
      this.form.universityCode.trim() &&
      this.form.jobTitle &&
      this.form.email.trim()
    );
  }

  protected submit(): void {
    if (!this.isFormValid() || this.submitting()) return;

    this.submitting.set(true);

    const request: IAdmin = {
      nationalId: this.form.nationalId.trim(),
      fullName: this.form.fullName.trim(),
      universityCode: this.form.universityCode.trim(),
      jobTitle: this.form.jobTitle,
      email: this.form.email.trim(),
      phoneNumber: this.form.phoneNumber.trim(),
    };

    this.adminService
      .createAdmin(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.adminAdded.emit();
        },
        error: (err) => {
          console.error('Create admin failed:', err);
          this.submitting.set(false);
        },
      });
  }
}
