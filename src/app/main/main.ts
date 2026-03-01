import {
  Component,
  HostListener,
  inject,
  signal,
  computed,
  OnInit,
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
export class Main implements OnInit {
  protected readonly toggle = inject(Toggle);

  /** Set the role — في الواقع هتجيبها من AuthService */
  protected readonly userRole = signal<'admin' | 'student'>('admin');

  protected readonly activeRoute = signal('manage-users');
  protected readonly isMobile = signal(false);

  /** Derived values from role */
  protected readonly navItems = computed<readonly NavItem[]>(() =>
    this.userRole() === 'admin' ? ADMIN_NAV_ITEMS : STUDENT_NAV_ITEMS
  );

  protected readonly userName = computed(() =>
    this.userRole() === 'admin' ? 'Admin User' : 'Somaya'
  );

  protected readonly userRoleLabel = computed(() =>
    this.userRole() === 'admin' ? 'System Administrator' : 'Student'
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

  protected readonly showNotifications = computed(
    () => this.userRole() === 'admin'
  );

  ngOnInit(): void {
    this.checkMobile();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
  }

  protected onNavItemSelected(route: string): void {
    this.activeRoute.set(route);
  }

  protected onOverlayClick(): void {
    this.toggle.closeSidebar();
  }

  private checkMobile(): void {
    const mobile = window.innerWidth < 992;
    this.isMobile.set(mobile);

    // لما يتحول لـ desktop، اقفل الـ sidebar (لأنه بيظهر تلقائي)
    if (!mobile && this.toggle.value()) {
      this.toggle.closeSidebar();
    }
  }
}