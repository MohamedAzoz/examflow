import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { Toggle } from '../../core/services/toggle';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student-sidebar',
  templateUrl: './student-sidebar.component.html',
  styleUrl: './student-sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentSidebarComponent {
  protected readonly toggle = inject(Toggle);
  private router = inject(Router);

  userName = signal<string>('Somaya'); // Will be replaced by real auth data
  activeRoute = signal<string>('dashboard');

  navItems = [
    { route: 'dashboard', label: 'Dashboard', icon: 'bi-grid-fill' },
    { route: 'courses', label: 'Courses', icon: 'bi-folder2' },
    { route: 'results', label: 'Results', icon: 'bi-file-earmark-text' },
    { route: 'settings', label: 'Settings', icon: 'bi-gear' },
  ];

  protected onNavClick(route: string): void {
    this.activeRoute.set(route);
    // this.router.navigate(['/student', route]);
    if (this.toggle.value()) {
      this.toggle.closeSidebar();
    }
  }

  protected onCloseClick(): void {
    this.toggle.toggle();
  }
}
