import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { IresetPassword } from '../../../data/models/auth/IresetPassword';
import { AUTH_ROUTES, ROUTES } from '../../../core/constants/const.route';
import { AppMessageService } from '../../../core/services/app-message';
import { Theme } from '../../../core/services/theme';
import { AuthFacade } from '../services/auth-facade';
import { PasswordResetFlowState } from '../services/password-reset-flow-state';

@Component({
  selector: 'app-reset-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    NgOptimizedImage,
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly appMessage = inject(AppMessageService);
  readonly authFacade = inject(AuthFacade);
  private readonly theme = inject(Theme);
  private readonly resetFlowState = inject(PasswordResetFlowState);

  readonly routes = AUTH_ROUTES;
  readonly email = this.resetFlowState.email;
  readonly resetToken = this.resetFlowState.resetToken;

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly validationError = signal<string | null>(null);

  readonly form = new FormGroup({
    newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  constructor() {
    this.theme.setForceLightMode(true);
  }

  async ngOnInit(): Promise<void> {
    await this.resetFlowState.init();

    if (!this.email()) {
      this.appMessage.addInfoMessage('Please start by entering your email first.');
      void this.router.navigate([`/${AUTH_ROUTES.FORGET_PASSWORD.path}`]);
      return;
    }

    if (!this.resetToken()) {
      this.appMessage.addInfoMessage('Please verify OTP before setting a new password.');
      void this.router.navigate([`/${AUTH_ROUTES.VERIFY_OTP.path}`]);
    }
  }

  ngOnDestroy(): void {
    this.theme.setForceLightMode(false);
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  onSubmit(): void {
    this.validationError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.email().trim();
    const resetToken = this.resetToken().trim();
    const newPassword = this.form.controls.newPassword.value?.trim() ?? '';
    const confirmPassword = this.form.controls.confirmPassword.value?.trim() ?? '';

    if (!email || !resetToken) {
      this.validationError.set('Recovery data is missing. Please restart the flow.');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.validationError.set('Passwords do not match.');
      return;
    }

    const payload: IresetPassword = {
      email,
      resetToken,
      newPassword,
    };

    this.authFacade.resetPassword(payload, async () => {
      await this.resetFlowState.clear();
      void this.router.navigate([`/${ROUTES.LOGIN.path}`]);
    });
  }
}
