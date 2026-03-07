import { computed, inject, Injectable } from '@angular/core';
import { AuthFacade } from '../../features/auth/services/auth-facade';
import { LocalStorage } from './local-storage';

@Injectable({
  providedIn: 'root',
})
export class IdentityService {
  private authfacade = inject(AuthFacade);
  private localStorage = inject(LocalStorage);

  user = computed(() => this.localStorage.get('user') || this.authfacade.user());
  token = computed(() => {
    const userFromFacade = this.authfacade.user();
    return userFromFacade?.token || this.localStorage.get('token');
  });

  exp = computed(() => {
    this.authfacade.user();
    return this.localStorage.get('exp');
  });

  isAuthenticated = computed(() => {
    const token = this.token();
    const expiration = Number(this.exp());

    if (!token || !expiration) return false;

    const expTime = new Date(expiration).getTime();
    if (isNaN(expTime)) return false;

    return expTime > Date.now();
  });
}
