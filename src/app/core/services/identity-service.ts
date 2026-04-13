import { computed, inject, Injectable, signal } from '@angular/core';
import { LocalStorage } from './local-storage';
import { JWT } from './jwt';
import { IJWT } from '../../data/models/auth/ijwt';
import { Cryptography } from './cryptography';

@Injectable({
  providedIn: 'root',
})
export class IdentityService {
  private readonly localStorage = inject(LocalStorage);
  private readonly jwt = inject(JWT);
  private readonly cryptography = inject(Cryptography);

  // State signals
  private readonly _token = signal<string | null>(this.getStoredToken());
  private readonly _role = signal<string | null>(null);
  private readonly _name = signal<string | null>(this.getStoredName());
  private readonly _exp = signal<number | null>(null);

  constructor() {
    this.hydrateFromStoredToken();
  }

  // Read-only public reactive views
  readonly token = this._token.asReadonly();
  readonly userRole = this._role.asReadonly();
  readonly userName = this._name.asReadonly();
  readonly tokenExpiration = this._exp.asReadonly();
  readonly isAuthenticated = computed(() => {
    const token = this._token();
    const expiration = this.tokenExpiration();

    if (!token || !expiration) return false;
    const currentTime = Math.floor(Date.now() / 1000);
    return expiration > currentTime;
  });

  readonly isStudent = computed(() => this._role() === 'Student');

  readonly dashboardPath = computed(() => {
    const role = this.userRole();
    if (role === 'Admin') return '/main/admin';
    if (role === 'Student') return '/main/student';
    return '/login';
  });

  private getStoredToken(): string | null {
    const encryptedToken = this.localStorage.get('ef_at');
    if (!encryptedToken) {
      return null;
    }

    try {
      return this.cryptography.decode(encryptedToken);
    } catch {
      return encryptedToken;
    }
  }

  private getStoredName(): string {
    const encryptedName = this.localStorage.get('ef_n');
    if (!encryptedName) {
      return "unknown";
    }

    try {
      return this.cryptography.decode(encryptedName);
    } catch {
      return encryptedName;
    }
  }

  private hydrateFromStoredToken(): void {
    const token = this._token();
    if (!token) {
      return;
    }
    try {
      const decoded = this.jwt.decodeToken(token) as IJWT;
      this._role.set(decoded.role ?? null);
      this._exp.set(Number(decoded.exp) || null);

      if (!this._name() && decoded.unique_name) {
        this._name.set(decoded.unique_name);
      }
    } catch {
      this.clearAuth();
    }
  }

  /**
   * Updates the authentication state reactively.
   * Called by AuthFacade after successful login/register.
   */
  setAuth(token: string): void {
    const decoded = this.jwt.decodeToken(token) as IJWT;

    // Update LocalStorage (Persistence)
    this.localStorage.set('ef_at', this.cryptography.encode(token));
    // this.localStorage.set('ef_r', this.cryptography.encode(decoded.role));
    this.localStorage.set('ef_n', this.cryptography.encode(decoded.unique_name));
    // this.localStorage.set('ef_e', this.cryptography.encode(decoded.exp.toString()));
    this.localStorage.set('ef_uI', this.cryptography.encode(decoded.nameid));
    this.localStorage.set('ef_iat', this.cryptography.encode(decoded.iat.toString()));
    this.localStorage.set('ef_nbf', this.cryptography.encode(decoded.nbf.toString()));

    // Update Signals (Reactivity)
    this._token.set(token);
    this._role.set(decoded.role);

    this._name.set(decoded.unique_name);
    this._exp.set(Number(decoded.exp));
  }

  /**
   * Clears the authentication state.
   */
  clearAuth(): void {
    // Clear LocalStorage
    this.localStorage.removeAll('ef_');

    // Reset Signals
    this._token.set(null);
    this._role.set(null);
    this._name.set(null);
    this._exp.set(null);
  }
}
