import { Component, input, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { Theme } from '../../../../../core/services/theme';
import { connectivitySignal } from '../../../services/student-exam-facade';

@Component({
  selector: 'app-exam-header',
  templateUrl: './exam-header.html',
  styleUrl: './exam-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamHeaderComponent {
  private readonly themeService = inject(Theme);

  readonly countdown = input.required<string>();
  readonly studentId = input.required<string>();
  // connected online

  readonly connected = connectivitySignal();
  readonly isDark = this.themeService.isDark;
  readonly desktopThemeLabel = computed(() => (this.isDark() ? 'Light' : 'Dark'));
  readonly themeLabel = computed(() =>
    this.isDark() ? 'Switch to light mode' : 'Switch to dark mode',
  );

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
