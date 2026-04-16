import { inject, Injectable, signal } from '@angular/core';
import { AppDatabase } from '../../../core/AppDbContext/app-database';

@Injectable({
  providedIn: 'root',
})
export class PasswordResetFlowState {
  private readonly appDb = inject(AppDatabase);

  private initPromise: Promise<void> | null = null;

  private readonly _email = signal<string>('');
  private readonly _resetToken = signal<string>('');

  readonly email = this._email.asReadonly();
  readonly resetToken = this._resetToken.asReadonly();

  async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.hydrate();
    }

    await this.initPromise;
  }

  async setEmail(email: string): Promise<void> {
    this._email.set(email.trim());
    await this.persist();
  }

  async setResetToken(resetToken: string): Promise<void> {
    this._resetToken.set(resetToken.trim());
    await this.persist();
  }

  async clear(): Promise<void> {
    this._email.set('');
    this._resetToken.set('');
    await this.appDb.clearPasswordResetFlowState();
  }

  private async hydrate(): Promise<void> {
    const state = await this.appDb.getPasswordResetFlowState();

    if (!state) {
      return;
    }

    this._email.set(state.email);
    this._resetToken.set(state.resetToken);
  }

  private async persist(): Promise<void> {
    const email = this._email();
    const resetToken = this._resetToken();

    if (!email && !resetToken) {
      await this.appDb.clearPasswordResetFlowState();
      return;
    }

    await this.appDb.savePasswordResetFlowState({
      email,
      resetToken,
      updatedAt: Date.now(),
    });
  }
}
