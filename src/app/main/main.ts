import {
  Component,
  HostListener,
  DestroyRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, RouterOutlet, NavigationEnd, RouterModule } from '@angular/router';
import { SidebarComponent } from '../layout/sidebar/sidebar';
import { Toggle } from '../core/services/toggle';
import { NavItem } from '../layout/nav-item';
import {
  ADMIN_NAV_ITEMS,
  PROFESSOR_NAV_ITEMS,
  STUDENT_NAV_ITEMS,
} from '../core/Config/sideBar.config';
import { IdentityService } from '../core/services/identity-service';
import { Theme } from '../core/services/theme';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ROLES } from '../core/constants/ROLES';

@Component({
  selector: 'app-main',
  imports: [RouterOutlet, SidebarComponent, RouterModule],
  templateUrl: './main.html',
  styleUrl: './main.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Main {
  protected readonly toggle = inject(Toggle);
  protected readonly theme = inject(Theme);
  private readonly identityService = inject(IdentityService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Dynamically compute role from IdentityService */
  protected readonly userRole = computed<'admin' | 'professor' | 'student'>(() => {
    const role = this.identityService.userRole()?.toLowerCase();

    if (role === 'admin' || role === 'professor' || role === 'student') {
      return role;
    }

    return 'student';
  });

  protected readonly activeRoute = signal('dashboard');
  protected readonly isMobile = signal(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  );

  /** Is the user a student? */
  protected readonly isStudent = computed(() => this.userRole() === ROLES.Student);
  protected readonly isAdmin = computed(() => this.userRole() === ROLES.Admin);
  protected readonly isProfessor = computed(() => this.userRole() === ROLES.Professor);
  protected readonly hasConfirmedEmail = this.identityService.hasConfirmedEmail;

  /** Derived values from role */
  protected readonly navItems = computed<readonly NavItem[]>(() => {
    const role = this.userRole();

    if (role === ROLES.Admin.toLowerCase()) {
      return ADMIN_NAV_ITEMS;
    }

    if (role === ROLES.Professor.toLocaleLowerCase()) {
      return PROFESSOR_NAV_ITEMS;
    }
    if (role === ROLES.Student.toLocaleLowerCase()) {
      return STUDENT_NAV_ITEMS;
    }
    return [] as const;
  });

  protected readonly userName = computed(() => {
    const fullName = this.identityService.userName() || 'User';
    return fullName;
  });

  protected readonly userRoleLabel = computed(() => {
    const role = this.identityService.userRole();
    return role === ROLES.Admin
      ? ROLES.Admin
      : role === ROLES.Professor
        ? ROLES.Professor
        : ROLES.Student;
  });

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

      // Professor Features
      'my-courses': 'My Courses',
      'question-bank': 'Question Bank',
      analysis: 'Analysis',
      'prof-dashboard': 'Professor Dashboard',
      'prof-settings': 'Professor Settings',
      exams: 'Exams Management',
    };
    return titles[this.activeRoute()] ?? 'Main Panel';
  });

  protected readonly showNotifications = computed(() => this.userRole() === ROLES.Admin);

  constructor() {
    this.syncActiveRouteWithUrl(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
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

    if (
      this.userRole() === 'professor' &&
      segments.includes('my-courses') &&
      segments.includes('question-bank')
    ) {
      this.activeRoute.set('question-bank');
      return;
    }

    if (
      this.userRole() === 'professor' &&
      segments.includes('my-courses') &&
      segments.includes('exams')
    ) {
      this.activeRoute.set('exams');
      return;
    }

    const roleSegmentIndex = segments.findIndex(
      (segment) => segment === 'admin' || segment === 'professor' || segment === 'student',
    );

    const defaultRoute =
      this.userRole() === 'admin'
        ? 'dashboard'
        : this.userRole() === 'professor'
          ? 'my-courses'
          : 'stdashboard';
    const routeFromUrl = roleSegmentIndex >= 0 ? segments[roleSegmentIndex + 1] : defaultRoute;

    this.activeRoute.set(routeFromUrl || defaultRoute);
  }
}
