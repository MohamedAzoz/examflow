import { computed, inject, Injectable, signal } from '@angular/core';
import { JWT } from './jwt';
import { IJWT } from '../../data/models/auth/ijwt';
import { AppDatabase } from '../AppDbContext/app-database';
import { PersistedAuthState } from '../AppDbContext/storage.models';

@Injectable({
  providedIn: 'root',
})
export class IdentityService {
  private readonly appDb = inject(AppDatabase);
  private readonly jwt = inject(JWT);

  private initPromise: Promise<void> | null = null;

  // State signals
  private readonly _token = signal<string | null>(null);
  private readonly _role = signal<string | null>(null);
  private readonly _name = signal<string | null>(null);
  private readonly _exp = signal<number | null>(null);

  async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.hydrate();
    }

    await this.initPromise;
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

  private async hydrate(): Promise<void> {
    const storedState = await this.appDb.getAuthState();

    if (storedState && this.hydrateFromState(storedState)) {
      return;
    }

    if (storedState) {
      await this.appDb.clearAuthState();
    }
  }

  private hydrateFromState(state: PersistedAuthState): boolean {
    try {
      const decoded = this.jwt.decodeToken(state.token) as IJWT;
      const normalizedState = this.normalizeState(state, decoded);
      this.applyAuthState(normalizedState);
      return true;
    } catch {
      return false;
    }
  }

  private normalizeState(state: PersistedAuthState, decoded: IJWT): PersistedAuthState {
    return {
      token: state.token,
      role: state.role ?? decoded.role ?? null,
      userName: state.userName ?? decoded.unique_name ?? null,
      userId: state.userId ?? decoded.nameid ?? null,
      issuedAt: state.issuedAt ?? this.toNumberOrNull(decoded.iat),
      notBefore: state.notBefore ?? this.toNumberOrNull(decoded.nbf),
      expiresAt: state.expiresAt ?? this.toNumberOrNull(decoded.exp),
    };
  }

  private applyAuthState(state: PersistedAuthState): void {
    this._token.set(state.token);
    this._role.set(state.role);
    this._name.set(state.userName);
    this._exp.set(state.expiresAt);
  }

  private toNumberOrNull(value: unknown): number | null {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  /**
   * Updates the authentication state reactively.
   * Called by AuthFacade after successful login/register.
   */
  setAuth(token: string): void {
    const decoded = this.jwt.decodeToken(token) as IJWT;
    const authState: PersistedAuthState = {
      token,
      role: decoded.role ?? null,
      userName: decoded.unique_name ?? null,
      userId: decoded.nameid ?? null,
      issuedAt: this.toNumberOrNull(decoded.iat),
      notBefore: this.toNumberOrNull(decoded.nbf),
      expiresAt: this.toNumberOrNull(decoded.exp),
    };

    this.applyAuthState(authState);
    void this.appDb.saveAuthState(authState);
  }

  /**
   * Clears the authentication state.
   */
  clearAuth(): void {
    void this.appDb.clearAuthState();

    this._token.set(null);
    this._role.set(null);
    this._name.set(null);
    this._exp.set(null);
  }
}
