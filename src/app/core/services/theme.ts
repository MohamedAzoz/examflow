import { Injectable, effect, inject, signal } from '@angular/core';
import { AppDatabase } from '../AppDbContext/app-database';
import { ThemePreference } from '../AppDbContext/storage.models';

@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly appDb = inject(AppDatabase);

  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private readonly forceLightMode = signal<boolean>(false);
  isDark = signal<boolean>(false);

  constructor() {
    effect(() => {
      const html = document.documentElement;
      const forceLight = this.forceLightMode();
      const shouldUseDark = this.isDark() && !forceLight;

      if (shouldUseDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }

      if (this.initialized && !forceLight) {
        const nextTheme: ThemePreference = this.isDark() ? 'dark' : 'light';
        void this.appDb.saveThemePreference(nextTheme);
      }
    });
  }

  async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.hydrateTheme();
    }

    await this.initPromise;
  }

  private async hydrateTheme(): Promise<void> {
    const savedTheme = await this.appDb.getThemePreference();

    if (savedTheme) {
      this.isDark.set(savedTheme === 'dark');
      this.initialized = true;
      return;
    }

    this.isDark.set(false);
    this.initialized = true;
  }

  toggleTheme() {
    this.isDark.update((d) => !d);
  }

  setForceLightMode(enabled: boolean): void {
    this.forceLightMode.set(enabled);
  }

  async resetToDefaultTheme(): Promise<void> {
    this.initialized = false;
    this.forceLightMode.set(false);
    this.isDark.set(false);
    await this.appDb.clearThemePreference();
    this.initialized = true;
  }
}
