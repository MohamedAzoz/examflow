import { Injectable, effect, inject, signal } from '@angular/core';
import { AppDatabase } from '../AppDbContext/app-database';
import { ThemePreference } from '../AppDbContext/storage.models';

@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly appDb = inject(AppDatabase);

  private initialized = false;
  private initPromise: Promise<void> | null = null;

  isDark = signal<boolean>(false);

  constructor() {
    effect(() => {
      const html = document.documentElement;

      if (this.isDark()) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }

      if (this.initialized) {
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

    this.isDark.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.initialized = true;
  }

  toggleTheme() {
    this.isDark.update((d) => !d);
  }
}
