import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  HostListener,
  OnInit,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { Toggle } from '../../core/services/toggle';
import { ADMIN_NAV_ITEMS, STUDENT_NAV_ITEMS } from '../../shared/Config/sideBar.config';
import { NavItem } from '../nav-item';
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './app-shell-component.html',
  styleUrl: './app-shell-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent implements OnInit {
  protected readonly toggle = inject(Toggle);

  /** Current user role — in production, get this from AuthService */
  protected readonly userRole = signal<string>('admin');

  /** Active route */
  protected readonly activeRoute = signal('dashboard');

  /** Mobile breakpoint */
  protected readonly isMobile = signal(false);

  /** Derived: nav items based on role */
  protected readonly navItems = computed<readonly NavItem[]>(() => {
    switch (this.userRole()) {
      case 'admin':
        return ADMIN_NAV_ITEMS;
      case 'student':
        return STUDENT_NAV_ITEMS;
      default:
        return ADMIN_NAV_ITEMS;
    }
  });

  /** Derived: user display name based on role */
  protected readonly userName = computed(() => {
    switch (this.userRole()) {
      case 'admin':
        return 'Admin User';
      case 'student':
        return 'Somaya';
      default:
        return 'User';
    }
  });

  /** Derived: user role label */
  protected readonly userRoleLabel = computed(() => {
    switch (this.userRole()) {
      case 'admin':
        return 'System Administrator';
      case 'student':
        return 'Student';
      default:
        return '';
    }
  });

  /** Derived: page title based on active route */
  protected readonly pageTitle = computed(
    () =>
      ADMIN_NAV_ITEMS.find((item) => item.route === this.activeRoute())?.label ?? ADMIN_NAV_ITEMS,
  );

  /** Derived: show notifications (admin only per design) */
  protected readonly showNotifications = computed(() => this.userRole() === 'admin');

  ngOnInit(): void {
    this.checkMobile();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
  }

  protected onNavItemSelected(route: string): void {
    this.activeRoute.set(route);
    // Here you would also call: this.router.navigate([route]);
  }

  protected onOverlayClick(): void {
    this.toggle.closeSidebar();
  }

  private checkMobile(): void {
    const mobile = window.innerWidth <= 768;
    const wasMobile = this.isMobile();

    this.isMobile.set(mobile);

    // Auto-close when switching from mobile to desktop
    if (wasMobile && !mobile && this.toggle.value()) {
      this.toggle.closeSidebar();
    }
  }
}
