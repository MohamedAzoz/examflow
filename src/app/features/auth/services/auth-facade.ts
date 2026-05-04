import { inject, Injectable, OnInit, signal } from '@angular/core';
import { Auth } from '../../../data/services/auth';
import { Router } from '@angular/router';
import { Ilogin } from '../../../data/models/auth/ilogin';
import { IdentityService } from '../../../core/services/identity-service';
import { IErrorResponse } from '../../../data/models/auth/IErrorResponse';
import { AppMessageService } from '../../../core/services/app-message';
import { Timer } from '../../../core/services/timer';
import { IresetPassword } from '../../../data/models/auth/IresetPassword';
import { IReqVoTp } from '../../../data/models/auth/IReqVoTp';
import { IconfirmEmail } from '../../../data/models/auth/IconfirmEmail';
import { IVoTp } from '../../../data/models/auth/IVoTp';
import { UpdateService } from '../../../core/services/update-service';

@Injectable({
  providedIn: 'root',
})
export class AuthFacade {
  private readonly authService = inject(Auth);
  private readonly router = inject(Router);
  private readonly identityService = inject(IdentityService);
  private readonly appMessage = inject(AppMessageService);
  private readonly timer = inject(Timer);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  login(body: Ilogin) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.authService.login(body).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.appMessage.addSuccessMessage(
          `Welcome ${response.fullName} , You are login successfully.`,
        );
        this.identityService.setAuth(response.token, response.email).then(() => {
          this.router.navigate([this.identityService.dashboardPath()]);
        });
      },
      error: (error: IErrorResponse | unknown) => {
        this.isLoading.set(false);
        const detail = this.appMessage.showHttpError(
          error,
          'Login failed. Please check your credentials.',
        );
        this.errorMessage.set(detail);
      },
    });
  }

  // confirmEmail
  confirmEmail(data: IconfirmEmail, onSuccess?: () => void, onError?: (message: string) => void) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.authService.confirmEmail(data).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.appMessage.addSuccessMessage(
          'Email confirmed successfully. You can now log in with your new email.',
        );
        onSuccess?.();
      },
      error: (error: IErrorResponse | unknown) => {
        this.isLoading.set(false);
        const detail = this.appMessage.showHttpError(
          error,
          'Failed to confirm email. Please check the code and try again.',
        );
        this.errorMessage.set(detail);
        onError?.(detail);
      },
    });
  }

  // forgetPassword
  forgetPassword(email: string, onSuccess?: () => void) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.authService.forgetPassword(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.appMessage.addSuccessMessage(
          'If an account with that email exists, a password reset link has been sent.',
        );
        onSuccess?.();
      },
      error: (error: IErrorResponse | unknown) => {
        this.isLoading.set(false);
        const detail = this.appMessage.showHttpError(
          error,
          'Failed to initiate password reset. Please try again.',
        );
        this.errorMessage.set(detail);
      },
    });
  }

  //requestEmail
  requestEmail(newEmail: string, onSuccess?: () => void) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.authService.requestEmail(newEmail).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.appMessage.addSuccessMessage(
          'A confirmation email has been sent to your new email address.',
        );
        onSuccess?.();
      },
      error: (error: IErrorResponse | unknown) => {
        this.isLoading.set(false);
        const detail = this.appMessage.showHttpError(
          error,
          'Failed to request email change. Please try again.',
        );
        this.errorMessage.set(detail);
      },
    });
  }

  //resetPassword
  resetPassword(body: IresetPassword, onSuccess?: () => void) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.authService.resetPassword(body).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.appMessage.addSuccessMessage('Password reset successful. You can now log in.');
        onSuccess?.();
      },
      error: (error: IErrorResponse | unknown) => {
        this.isLoading.set(false);
        const detail = this.appMessage.showHttpError(
          error,
          'Failed to reset password. Please try again.',
        );
        this.errorMessage.set(detail);
      },
    });
  }
  //verifyOtp
  verifyOtp(data: IReqVoTp, onSuccess?: (resetToken: string) => void) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.authService.verifyOtp(data).subscribe({
      next: (response: IVoTp) => {
        this.isLoading.set(false);
        if (!response?.resetToken?.trim()) {
          const detail = 'OTP verified, but reset token was not returned by the server.';
          this.appMessage.addErrorMessage(detail);
          this.errorMessage.set(detail);
          return;
        }

        this.appMessage.addSuccessMessage(
          'OTP verified successfully. You can now reset your password.',
        );
        onSuccess?.(response.resetToken);
      },
      error: (error: IErrorResponse | unknown) => {
        this.isLoading.set(false);
        const detail = this.appMessage.showHttpError(
          error,
          'Failed to verify OTP. Please check the code and try again.',
        );
        this.errorMessage.set(detail);
      },
    });
  }

  logout() {
    this.timer.stopExam();
    this.identityService.clearAuth();
    this.appMessage.addInfoMessage('You have logged out.');
    this.router.navigate(['login']);
  }
}
