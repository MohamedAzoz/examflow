import { inject, Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { EncryptionService } from '../services/encryption-service';
import {
  PersistedAuthState,
  PersistedExamSessionState,
  PersistedPasswordResetFlowState,
  ThemePreference,
} from './storage.models';

interface EncryptedEntry {
  id: string;
  payload: string;
  updatedAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class AppDatabase extends Dexie {
  private readonly AUTH_STATE_KEY = 'auth:state';
  private readonly PASSWORD_RESET_FLOW_KEY = 'auth:password-reset-flow';
  private readonly THEME_KEY = 'setting:theme';
  private readonly LEGACY_MIGRATION_KEY = 'setting:migration:local-storage:v1';
  private readonly EXAM_SESSION_PREFIX = 'exam-session:';
  private readonly LEGACY_PREFIX = 'legacy:';

  private readonly encryption = inject(EncryptionService);

  authStore!: Table<EncryptedEntry, string>;
  settingsStore!: Table<EncryptedEntry, string>;
  examSessionStore!: Table<EncryptedEntry, string>;

  constructor() {
    super('ExamFlowDB');
    this.version(1).stores({
      authStore: 'id, updatedAt',
      settingsStore: 'id, updatedAt',
    });

    this.version(2).stores({
      authStore: 'id, updatedAt',
      settingsStore: 'id, updatedAt',
      examSessionStore: 'id, updatedAt',
    });

    this.authStore = this.table('authStore');
    this.settingsStore = this.table('settingsStore');
    this.examSessionStore = this.table('examSessionStore');
  }

  async saveAuthState(state: PersistedAuthState): Promise<void> {
    await this.writeEncrypted(this.authStore, this.AUTH_STATE_KEY, state);
  }

  async getAuthState(): Promise<PersistedAuthState | null> {
    return this.readEncrypted<PersistedAuthState>(this.authStore, this.AUTH_STATE_KEY);
  }

  async clearAuthState(): Promise<void> {
    await this.authStore.delete(this.AUTH_STATE_KEY);
  }

  async savePasswordResetFlowState(state: PersistedPasswordResetFlowState): Promise<void> {
    await this.writeEncrypted(this.settingsStore, this.PASSWORD_RESET_FLOW_KEY, {
      ...state,
      updatedAt: Date.now(),
    });
  }

  async getPasswordResetFlowState(): Promise<PersistedPasswordResetFlowState | null> {
    return this.readEncrypted<PersistedPasswordResetFlowState>(
      this.settingsStore,
      this.PASSWORD_RESET_FLOW_KEY,
    );
  }

  async clearPasswordResetFlowState(): Promise<void> {
    await this.settingsStore.delete(this.PASSWORD_RESET_FLOW_KEY);
  }

  async saveThemePreference(theme: ThemePreference): Promise<void> {
    await this.writeEncrypted(this.settingsStore, this.THEME_KEY, theme);
  }

  async getThemePreference(): Promise<ThemePreference | null> {
    return this.readEncrypted<ThemePreference>(this.settingsStore, this.THEME_KEY);
  }

  async clearThemePreference(): Promise<void> {
    await this.settingsStore.delete(this.THEME_KEY);
  }

  async saveExamSessionState(state: PersistedExamSessionState): Promise<void> {
    const sessionKey = this.getExamSessionKey(state.examId);
    await this.writeEncrypted(this.examSessionStore, sessionKey, {
      ...state,
      updatedAt: Date.now(),
    });
  }

  async getExamSessionState(examId: number): Promise<PersistedExamSessionState | null> {
    return this.readEncrypted<PersistedExamSessionState>(
      this.examSessionStore,
      this.getExamSessionKey(examId),
    );
  }

  async clearExamSessionState(examId: number): Promise<void> {
    await this.examSessionStore.delete(this.getExamSessionKey(examId));
  }

  async isLegacyMigrationDone(): Promise<boolean> {
    return (
      (await this.readEncrypted<boolean>(this.settingsStore, this.LEGACY_MIGRATION_KEY)) === true
    );
  }

  async markLegacyMigrationDone(): Promise<void> {
    await this.writeEncrypted(this.settingsStore, this.LEGACY_MIGRATION_KEY, true);
  }

  async setLegacyValue(key: string, value: string): Promise<void> {
    const storageKey = this.getLegacyStorageKey(key);
    await this.writeEncrypted(this.settingsStore, storageKey, value);
  }

  async getLegacyValue(key: string): Promise<string | null> {
    const storageKey = this.getLegacyStorageKey(key);
    return this.readEncrypted<string>(this.settingsStore, storageKey);
  }

  async deleteLegacyValue(key: string): Promise<void> {
    const storageKey = this.getLegacyStorageKey(key);
    await this.settingsStore.delete(storageKey);
  }

  async deleteLegacyByPrefix(prefix: string): Promise<void> {
    const keyPrefix = this.getLegacyStorageKey(prefix);
    await this.settingsStore.where('id').startsWith(keyPrefix).delete();
  }

  async clearAllLegacyValues(): Promise<void> {
    await this.settingsStore.where('id').startsWith(this.LEGACY_PREFIX).delete();
  }

  async hasLegacyValue(key: string): Promise<boolean> {
    const storageKey = this.getLegacyStorageKey(key);
    const value = await this.settingsStore.get(storageKey);
    return !!value;
  }

  private getLegacyStorageKey(key: string): string {
    return `${this.LEGACY_PREFIX}${key}`;
  }

  private getExamSessionKey(examId: number): string {
    return `${this.EXAM_SESSION_PREFIX}${examId}`;
  }

  private async writeEncrypted<T>(
    table: Table<EncryptedEntry, string>,
    id: string,
    value: T,
  ): Promise<void> {
    const payload = await this.encryption.encrypt(value);
    await table.put({
      id,
      payload,
      updatedAt: Date.now(),
    });
  }

  private async readEncrypted<T>(
    table: Table<EncryptedEntry, string>,
    id: string,
  ): Promise<T | null> {
    const entry = await table.get(id);

    if (!entry?.payload) {
      return null;
    }

    try {
      return await this.encryption.decrypt<T>(entry.payload);
    } catch {
      await table.delete(id);
      return null;
    }
  }
}
