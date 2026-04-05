import { inject, Injectable, signal } from '@angular/core';
import { Auth } from '../../../data/services/auth';
import { Router } from '@angular/router';
import { Ilogin } from '../../../data/models/auth/ilogin';
import { Iregister } from '../../../data/models/auth/iregister';
import { IdentityService } from '../../../core/services/identity-service';

@Injectable({
  providedIn: 'root',
})
export class AuthFacade {
  private readonly authService = inject(Auth);
  private readonly router = inject(Router);
  private readonly identityService = inject(IdentityService);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  login(body: Ilogin) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.authService.login(body).subscribe({
      next: (response) => {
        // Pushes state to IdentityService (Reactive)
        this.identityService.setAuth(response.token);

        this.isLoading.set(false);
        this.router.navigate([this.identityService.dashboardPath()]);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('Invalid credentials. Please try again.');
        console.error(error);
      },
    });
  }

  


  logout() {
    this.identityService.clearAuth();
    this.router.navigate(['login']);
  }

}

