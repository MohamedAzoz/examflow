import { computed, inject, Injectable, signal } from '@angular/core';
import { LocalStorage } from './local-storage';
import { JWT } from './jwt';
import { IJWT } from '../../data/models/auth/ijwt';

@Injectable({
  providedIn: 'root',
})
export class IdentityService {
  private readonly localStorage = inject(LocalStorage);
  private readonly jwt = inject(JWT);

  // State signals
  private readonly _token = signal<string | null>(this.localStorage.get('access_token'));
  private readonly _role = signal<string | null>(this.localStorage.get('role'));
  private readonly _name = signal<string | null>(this.localStorage.get('name'));
  private readonly _exp = signal<number | null>(Number(this.localStorage.get('exp')) || null);

  // Read-only public reactive views
  readonly token = this._token.asReadonly();
  readonly userRole = this._role.asReadonly();
  readonly userName = this._name.asReadonly();

  readonly isAuthenticated = computed(() => {
    const token = this._token();
    const expiration = this._exp();

    if (!token || !expiration) return false;

    // Use current time in seconds to match JWT 'exp'
    const currentTime = Math.floor(Date.now() / 1000);
    return expiration > currentTime;
  });

  readonly isStudent = computed(() => this._role() === 'Student');

  readonly dashboardPath = computed(() => {
    const role = this._role();
    if (role === 'Admin') return '/main/admin';
    if (role === 'Student') return '/main/student';
    return '/login';
  });

  /**
   * Updates the authentication state reactively.
   * Called by AuthFacade after successful login/register.
   */
  setAuth(token: string): void {
    const decoded = this.jwt.decodeToken(token) as IJWT;

    // Update LocalStorage (Persistence)
    this.localStorage.set('access_token', token);
    this.localStorage.set('role', decoded.role);
    this.localStorage.set('name', decoded.unique_name);
    this.localStorage.set('exp', decoded.exp.toString());
    this.localStorage.set('userId', decoded.nameid);
    this.localStorage.set('iat', decoded.iat.toString());
    this.localStorage.set('nbf', decoded.nbf.toString());

    // Update Signals (Reactivity)
    this._token.set(token);
    this._role.set(decoded.role);
    this._name.set(decoded.unique_name);
    this._exp.set(decoded.exp);
  }

  /**
   * Clears the authentication state.
   */
  clearAuth(): void {
    // Clear LocalStorage
    this.localStorage.remove('access_token');
    this.localStorage.remove('role');
    this.localStorage.remove('name');
    this.localStorage.remove('exp');
    this.localStorage.remove('userId');
    this.localStorage.remove('iat');
    this.localStorage.remove('nbf');

    // Reset Signals
    this._token.set(null);
    this._role.set(null);
    this._name.set(null);
    this._exp.set(null);
  }
}


