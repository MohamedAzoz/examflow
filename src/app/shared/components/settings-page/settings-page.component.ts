import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IdentityService } from '../../../core/services/identity-service';
import { Auth } from '../../../data/services/auth';
import { AUTH_ROUTES } from '../../../core/constants/const.route';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';
import { IChangePassword } from '../../../data/models/auth/IChangePassword';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    DividerModule
  ],
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.css']
})
export class SettingsPageComponent {
  private readonly identityService = inject(IdentityService);
  private readonly authService = inject(Auth);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  readonly userEmail = this.identityService.userEmail;
  readonly showChangePassword = signal(false);
  readonly isLoading = signal(false);

  changePasswordForm: FormGroup = this.fb.group({
    oldPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  toggleChangePassword() {
    this.showChangePassword.set(!this.showChangePassword());
    if (!this.showChangePassword()) {
      this.changePasswordForm.reset();
    }
  }

  updateEmail() {
    this.router.navigate(['/auth/' + AUTH_ROUTES.REQUEST_EMAIL.path]);
  }

  onSubmitChangePassword() {
    if (this.changePasswordForm.invalid) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Please fix the errors in the form' 
      });
      return;
    }

    this.isLoading.set(true);
    const data: IChangePassword = {
      oldPassword: this.changePasswordForm.value.oldPassword,
      newPassword: this.changePasswordForm.value.newPassword
    };

    this.authService.changePassword(data).subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: 'Password changed successfully' 
        });
        this.isLoading.set(false);
        this.toggleChangePassword();
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: err.error?.message || 'Failed to change password' 
        });
        this.isLoading.set(false);
      }
    });
  }
}
