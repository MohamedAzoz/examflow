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
import { IdentityService } from '../core/services/identity-service';

@Component({
  selector: 'app-main',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './main.html',
  styleUrl: './main.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Main {
  protected readonly toggle = inject(Toggle);
  private readonly identityService = inject(IdentityService);

  /** Dynamically compute role from IdentityService */
  protected readonly userRole = computed(() => (this.identityService.userRole()?.toLowerCase() || 'student') as 'admin' | 'student');

  protected readonly activeRoute = signal('dashboard');
  protected readonly isMobile = signal(false);

  /** Is the user a student? */
  protected readonly isStudent = computed(() => this.userRole() === 'student');

  /** Derived values from role */
  protected readonly navItems = computed<readonly NavItem[]>(() =>
    this.userRole() === 'admin' ? ADMIN_NAV_ITEMS : STUDENT_NAV_ITEMS,
  );

  protected readonly userName = computed(() => {
    const fullName = this.identityService.userName() || 'User';
    return fullName; 
  });

  protected readonly userRoleLabel = computed(() => 
    this.identityService.userRole() || (this.userRole() === 'admin' ? 'System Administrator' : 'Student')
  );

  protected readonly pageTitle = computed(() => {
    const titles: Record<string, string> = {
      // General
      dashboard: 'Dashboard',

      // Admin Management
      'user-managment': 'User Management',
      'academic-year-managment': 'Manage Academic Years',
      'courses-managment': 'Configure Courses',
      'departments-managment': 'Add Department',
      'assign-courses-managment': 'Assign Courses',
      'reset-passwords': 'Reset Passwords',
      'enroll-students-managment': 'Enroll Students',
      'system-settings-managment': 'System Settings',

      // Student Features
      courses: 'Courses',
      results: 'Results',
      settings: 'Settings',
      exam: 'Exam Session',
    };
    return titles[this.activeRoute()] ?? 'Main Panel';
  });

  protected readonly showNotifications = computed(() => this.userRole() === 'admin');

  protected onNavItemSelected(route: string): void {
    this.activeRoute.set(route);
  }

  protected onOverlayClick(): void {
    this.toggle.closeSidebar();
  }

  @HostListener('window:resize', ['$event'])
  protected onResize(event: Event): void {
    this.isMobile.set((event.target as Window).innerWidth <= 992);
  }
}
