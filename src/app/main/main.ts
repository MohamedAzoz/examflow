import { Student } from './../data/services/student';
import {
  Component,
  HostListener,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SidebarComponent } from '../layout/sidebar/sidebar';
import { Toggle } from '../core/services/toggle';
import { NavItem } from '../layout/nav-item';
import { ADMIN_NAV_ITEMS, STUDENT_NAV_ITEMS } from '../core/Config/sideBar.config';
import { IdentityService } from '../core/services/identity-service';
import { Theme } from '../core/services/theme';
import { filter } from 'rxjs';

@Component({
  selector: 'app-main',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './main.html',
  styleUrl: './main.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Main {
  protected readonly toggle = inject(Toggle);
  protected readonly theme = inject(Theme);
  private readonly identityService = inject(IdentityService);
  private readonly router = inject(Router);

  /** Dynamically compute role from IdentityService */
  protected readonly userRole = computed(
    () => (this.identityService.userRole()?.toLowerCase() || 'student') as 'admin' | 'student',
  );

  protected readonly activeRoute = signal('dashboard');
  protected readonly isMobile = signal(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  );

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

  protected readonly userRoleLabel = computed(
    () =>
      this.identityService.userRole() ||
      (this.userRole() === 'admin' ? 'System Administrator' : 'Student'),
  );

  protected readonly pageTitle = computed(() => {
    const titles: Record<string, string> = {
      // Admin Management
      dashboard: 'Dashboard',
      'user-managment': 'User Management',
      'semester-managment': 'Manage Semesters',
      'courses-managment': 'Configure Courses',
      'departments-managment': 'Department Management',
      'assign-courses-managment': 'Assign Courses',
      'reset-passwords-managment': 'Reset Passwords',
      'enroll-students-managment': 'Enroll Students',
      'system-settings-managment': 'System Settings',

      // Student Features
      stdashboard: 'Student Dashboard',
      courses: 'Courses',
      'past-results': 'My Results',
      settings: 'Settings',
      exam: 'Exam Session',
    };
    return titles[this.activeRoute()] ?? 'Main Panel';
  });

  protected readonly showNotifications = computed(() => this.userRole() === 'admin');

  constructor() {
    this.syncActiveRouteWithUrl(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.syncActiveRouteWithUrl(event.urlAfterRedirects));
  }

  protected onNavItemSelected(route: string): void {
    this.activeRoute.set(route);
  }

  protected onOverlayClick(): void {
    this.toggle.closeSidebar();
  }

  protected toggleTheme(): void {
    this.theme.toggleTheme();
  }
  readonly isDark = this.theme.isDark;
  readonly desktopThemeLabel = computed(() => (this.isDark() ? 'Light' : 'Dark'));
  readonly themeLabel = computed(() =>
    this.isDark() ? 'Switch to light mode' : 'Switch to dark mode',
  );

  @HostListener('window:resize', ['$event'])
  protected onResize(event: UIEvent): void {
    const w = (event.target as Window).innerWidth;
    this.isMobile.set(w < 1024);
  }

  private syncActiveRouteWithUrl(url: string): void {
    const cleanUrl = url.split('?')[0];
    const segments = cleanUrl.split('/').filter(Boolean);
    const roleSegmentIndex = segments.findIndex(
      (segment) => segment === 'admin' || segment === 'student',
    );
    const routeFromUrl = roleSegmentIndex >= 0 ? segments[roleSegmentIndex + 1] : 'dashboard';

    this.activeRoute.set(routeFromUrl || 'dashboard');
  }
}
