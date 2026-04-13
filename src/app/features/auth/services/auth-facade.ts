import { inject, Injectable, signal } from '@angular/core';
import { Auth } from '../../../data/services/auth';
import { Router } from '@angular/router';
import { Ilogin } from '../../../data/models/auth/ilogin';
import { Iregister } from '../../../data/models/auth/iregister';
import { IdentityService } from '../../../core/services/identity-service';
import { IErrorResponse } from '../../../data/models/auth/IErrorResponse';
import { AppMessageService } from '../../../core/services/app-message';
import { Timer } from '../../../core/services/timer';

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
        this.identityService.setAuth(response.token);
        this.isLoading.set(false);
        this.appMessage.addSuccessMessage('You are logged in successfully.');
        this.router.navigate([this.identityService.dashboardPath()]);
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

  logout() {
    this.timer.stopExam();
    this.identityService.clearAuth();
    this.appMessage.addInfoMessage('You have logged out.');
    this.router.navigate(['login']);
  }
}
