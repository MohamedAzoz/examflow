import {
  Component,
  HostListener,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../layout/sidebar/sidebar';
import { Toggle } from '../core/services/toggle';
import { NavItem } from '../layout/nav-item';
import { ADMIN_NAV_ITEMS, STUDENT_NAV_ITEMS } from '../shared/Config/sideBar.config';

@Component({
  selector: 'app-main',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './main.html',
  styleUrl: './main.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Main {
  protected readonly toggle = inject(Toggle);

  /** Set the role — في الواقع هتجيبها من AuthService */
  protected readonly userRole = signal<'admin' | 'student'>('admin');

  protected readonly activeRoute = signal('manage-users');
  protected readonly isMobile = signal(false);

  /** Derived values from role */
  protected readonly navItems = computed<readonly NavItem[]>(() =>
    this.userRole() === 'admin' ? ADMIN_NAV_ITEMS : STUDENT_NAV_ITEMS,
  );

  protected readonly userName = computed(() =>
    this.userRole() === 'admin' ? 'Admin User' : 'Somaya',
  );

  protected readonly userRoleLabel = computed(() =>
    this.userRole() === 'admin' ? 'System Administrator' : 'Student',
  );

  protected readonly pageTitle = computed(() => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      'manage-users': 'User Management',
      'academic-years': 'Manage Academic Years',
      'configure-courses': 'Configure Courses',
      'add-department': 'Add Department',
      'assign-courses': 'Assign Courses',
      'reset-passwords': 'Reset Passwords',
      'enroll-students': 'Enroll Students',
      'system-settings': 'System Settings',
      courses: 'Courses',
      results: 'Results',
      settings: 'Settings',
    };
    return titles[this.activeRoute()] ?? 'User Management';
  });

  protected readonly showNotifications = computed(() => this.userRole() === 'admin');

  protected onNavItemSelected(route: string): void {
    this.activeRoute.set(route);
  }

  protected onOverlayClick(): void {
    this.toggle.closeSidebar(); // هذا كافي لإعادة الـ Sidebar لوضعه الافتراضي (مخفي للموبايل)
  }
  @HostListener('window:resize', ['$event'])
  protected onResize(event: Event): void {
    this.isMobile.set((event.target as Window).innerWidth <= 992);
  }
}
