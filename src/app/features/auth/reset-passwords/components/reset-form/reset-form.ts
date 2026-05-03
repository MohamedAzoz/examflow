import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PasswordModule } from 'primeng/password';
import { ResetPasswordsFacade } from '../../services/reset-passwords-facade';

@Component({
  selector: 'app-reset-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasswordModule],
  templateUrl: './reset-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetForm {
  protected readonly facade = inject(ResetPasswordsFacade);
  private readonly fb = inject(FormBuilder);

  protected readonly user = this.facade.selectedUser;
  protected readonly isResetting = this.facade.isResetting;

  protected readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: this.passwordMatchValidator,
    },
  );

  private passwordMatchValidator(g: any) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  protected async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password } = this.form.getRawValue();
    const success = await this.facade.resetPassword(password);
    
    if (success) {
      this.form.reset();
    }
  }

  protected onBack() {
    this.facade.clearSelection();
  }
}
