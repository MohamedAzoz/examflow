import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Theme {
  isDark = signal<boolean>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const html = document.documentElement;
      if (this.isDark()) {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    });
  }

  private getInitialTheme(): boolean {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';

    // افتراضياً حسب إعدادات الجهاز
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  toggleTheme() {
    this.isDark.update((d) => !d);
  }
}
