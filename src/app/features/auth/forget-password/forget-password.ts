import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { AUTH_ROUTES, ROUTES } from '../../../core/constants/const.route';
import { Theme } from '../../../core/services/theme';
import { AuthFacade } from '../services/auth-facade';
import { PasswordResetFlowState } from '../services/password-reset-flow-state';

@Component({
  selector: 'app-forget-password',
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
  templateUrl: './forget-password.html',
  styleUrl: './forget-password.css',
})
export class ForgetPassword implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  readonly authFacade = inject(AuthFacade);
  private readonly theme = inject(Theme);
  private readonly resetFlowState = inject(PasswordResetFlowState);

  readonly routes = ROUTES;

  readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor() {
    this.theme.setForceLightMode(true);
  }

  async ngOnInit(): Promise<void> {
    await this.resetFlowState.init();

    const storedEmail = this.resetFlowState.email();
    if (storedEmail) {
      this.form.patchValue({ email: storedEmail });
    }
  }

  ngOnDestroy(): void {
    this.theme.setForceLightMode(false);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.controls.email.value?.trim() ?? '';

    if (!email) {
      this.form.markAllAsTouched();
      return;
    }

    await this.resetFlowState.setEmail(email);

    this.authFacade.forgetPassword(email, () => {
      void this.router.navigate([`/${AUTH_ROUTES.VERIFY_OTP.path}`]);
    });
  }
}
