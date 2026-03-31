import { inject, Injectable, signal, computed } from '@angular/core';
import { Auth } from '../../../data/services/auth';
import { Router } from '@angular/router';
import { Ilogin } from '../../../data/models/auth/ilogin';
import { Iregister } from '../../../data/models/auth/iregister';
import { LocalStorage } from '../../../core/services/local-storage';
import { JWT } from '../../../core/services/jwt';
import { IJWT } from '../../../data/models/auth/ijwt';
import { IResponseAuth } from '../../../data/models/auth/iresponse-auth';

@Injectable({
  providedIn: 'root',
})
export class AuthFacade {
  private authService = inject(Auth);
  private router = inject(Router);
  private localStorage = inject(LocalStorage);
  private jwt = inject(JWT);

  userToken = signal<string | null>(this.localStorage.get('token'));
  user = signal<IResponseAuth | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  isAuthenticated = computed(() => !!this.userToken());

  login(body: Ilogin) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.authService.login(body).subscribe({
      next: (response) => {
        this.localStorage.set('access_token', response.token);
        const decodedToken = this.jwt.decodeToken(response.token);
        this.localStorage.set('name', (decodedToken as IJWT).unique_name);
        this.localStorage.set('role', (decodedToken as IJWT).role);
        this.localStorage.set('userId', (decodedToken as IJWT).nameid);
        this.localStorage.set('exp', (decodedToken as IJWT).exp.toString());
        this.localStorage.set('iat', (decodedToken as IJWT).iat.toString());
        this.localStorage.set('nbf', (decodedToken as IJWT).nbf.toString());
        this.userToken.set(response.token);
        this.isLoading.set(false);
        // if ((decodedToken as IJWT).role === 'Admin') {
        //   this.router.navigate(['main/admin/user-managment']);
        // } else {
        this.router.navigate(['main/student/dashboard']);
        // }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('Invalid credentials. Please try again.');
        console.error(error);
      },
    });
  }

  register(body: Iregister) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.authService.register(body).subscribe({
      next: (response) => {
        this.localStorage.set('token', response.token);
        this.userToken.set(response.token);
        this.isLoading.set(false);
        this.router.navigate(['home']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('Registration failed. Please try again.');
        console.error(error);
      },
    });
  }

  logout() {
    this.localStorage.remove('token');
    this.userToken.set(null);
    this.router.navigate(['login']);
  }
}
