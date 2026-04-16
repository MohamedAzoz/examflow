import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { IReqVoTp } from '../../../data/models/auth/IReqVoTp';
import { AUTH_ROUTES, ROUTES } from '../../../core/constants/const.route';
import { AppMessageService } from '../../../core/services/app-message';
import { Theme } from '../../../core/services/theme';
import { AuthFacade } from '../services/auth-facade';
import { PasswordResetFlowState } from '../services/password-reset-flow-state';

@Component({
  selector: 'app-verify-otp',
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
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.css',
})
export class VerifyOtp implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly appMessage = inject(AppMessageService);
  readonly authFacade = inject(AuthFacade);
  private readonly theme = inject(Theme);
  private readonly resetFlowState = inject(PasswordResetFlowState);

  readonly routes = AUTH_ROUTES;
  readonly email = this.resetFlowState.email;

  readonly form = new FormGroup({
    code: new FormControl('', [
      Validators.required,
      Validators.minLength(4),
      Validators.maxLength(8),
    ]),
  });

  constructor() {
    this.theme.setForceLightMode(true);
  }

  async ngOnInit(): Promise<void> {
    await this.resetFlowState.init();

    if (!this.email()) {
      this.appMessage.addInfoMessage('Please start by entering your email first.');
      void this.router.navigate([`/${AUTH_ROUTES.FORGET_PASSWORD.path}`]);
    }
  }

  ngOnDestroy(): void {
    this.theme.setForceLightMode(false);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.email().trim();
    const code = this.form.controls.code.value?.trim() ?? '';

    if (!email) {
      this.appMessage.addInfoMessage('Email is missing. Please restart the password reset flow.');
      void this.router.navigate([`/${AUTH_ROUTES.FORGET_PASSWORD.path}`]);
      return;
    }

    const payload: IReqVoTp = {
      email,
      code,
    };

    this.authFacade.verifyOtp(payload, async (resetToken) => {
      if (!resetToken.trim()) {
        this.appMessage.addErrorMessage('Verification failed. Missing reset token from server.');
        return;
      }

      await this.resetFlowState.setResetToken(resetToken);
      void this.router.navigate([`/${AUTH_ROUTES.RESET_PASSWORD.path}`]);
    });
  }
}
