import { inject, Injectable } from '@angular/core';
import { IJWT } from '../../data/models/auth/ijwt';
import { JWT } from '../services/jwt';
import { AppDatabase } from './app-database';
import { PersistedAuthState, ThemePreference } from './storage.models';

@Injectable({ providedIn: 'root' })
export class StorageMigrationService {
  private readonly appDb = inject(AppDatabase);
  private readonly jwt = inject(JWT);

  async migrateLegacyLocalStorageOnce(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    if (await this.appDb.isLegacyMigrationDone()) {
      return;
    }

    await this.migrateAuthState();
    await this.migrateThemePreference();
    this.removeLegacyKeys();
    await this.appDb.markLegacyMigrationDone();
  }

  private async migrateAuthState(): Promise<void> {
    const existingAuthState = await this.appDb.getAuthState();
    if (existingAuthState) {
      return;
    }

    const encodedToken = window.localStorage.getItem('ef_at');
    if (!encodedToken) {
      return;
    }

    const token = this.decodeLegacyValue(encodedToken) ?? encodedToken;

    try {
      const decoded = this.jwt.decodeToken(token) as IJWT;
      const authState: PersistedAuthState = {
        token,
        role: decoded.role ?? null,
        userName:
          this.decodeLegacyValue(window.localStorage.getItem('ef_n')) ??
          decoded.unique_name ??
          null,
        userId:
          this.decodeLegacyValue(window.localStorage.getItem('ef_uI')) ?? decoded.nameid ?? null,
        issuedAt:
          this.toNumberOrNull(this.decodeLegacyValue(window.localStorage.getItem('ef_iat'))) ??
          this.toNumberOrNull(decoded.iat),
        notBefore:
          this.toNumberOrNull(this.decodeLegacyValue(window.localStorage.getItem('ef_nbf'))) ??
          this.toNumberOrNull(decoded.nbf),
        expiresAt: this.toNumberOrNull(decoded.exp),
      };

      await this.appDb.saveAuthState(authState);
    } catch {
      // Keep migration resilient: ignore invalid legacy token payload.
    }
  }

  private async migrateThemePreference(): Promise<void> {
    const existingTheme = await this.appDb.getThemePreference();
    if (existingTheme) {
      return;
    }

    const rawTheme = window.localStorage.getItem('theme');
    if (!rawTheme) {
      return;
    }

    if (rawTheme === 'dark' || rawTheme === 'light') {
      await this.appDb.saveThemePreference(rawTheme as ThemePreference);
    }
  }

  private removeLegacyKeys(): void {
    const keys = Object.keys(window.localStorage);
    keys.forEach((key) => {
      if (key.startsWith('ef_') || key === 'theme') {
        window.localStorage.removeItem(key);
      }
    });
  }

  private decodeLegacyValue(value: string | null): string | null {
    if (!value) {
      return null;
    }

    try {
      return atob(value);
    } catch {
      return value;
    }
  }

  private toNumberOrNull(value: unknown): number | null {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }
}
