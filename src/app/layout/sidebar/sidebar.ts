import {
  Component,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
  HostListener,
  computed,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { Toggle } from '../../core/services/toggle';
import { NavItem } from '../nav-item';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IdentityService } from '../../core/services/identity-service';
import { ROUTES } from '../../core/constants/const.route';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgClass],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  protected readonly toggle = inject(Toggle);
  private readonly router = inject(Router);
  private readonly identityService = inject(IdentityService);

  readonly navItems = input.required<readonly NavItem[]>();
  readonly userName = input<string>(this.identityService.userName() || '');
  readonly userRole = input<string>(this.identityService.userRole() || '');
  readonly activeRoute = input<string>('User Management');
  readonly isAdmin = input<boolean>(this.identityService.isAdmin());
  readonly isStudent = input<boolean>(this.identityService.isStudent());
  readonly isProfessor = input<boolean>(this.identityService.isProfessor());

  readonly navItemSelected = output<string>();

  private readonly viewportWidth = signal<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  );

  protected readonly isMobile = computed<boolean>(() => this.viewportWidth() < 1024);

  @HostListener('window:resize', ['$event'])
  protected onResize(event: UIEvent): void {
    this.viewportWidth.set((event.target as Window).innerWidth);
  }

  protected onNavClick(route: string): void {
    this.navItemSelected.emit(route);
    if (this.toggle.value() && this.isMobile()) {
      this.toggle.closeSidebar();
    }
  }
  protected url(route: string): string {
    if (route === ROUTES.REPORT_ISSUE.path) {
      return '/' + route;
    }
    return '/main/' + this.userRole().toLowerCase() + '/' + route;
  }

  protected onCloseClick(): void {
    this.toggle.closeSidebar();
  }

  protected onLogout(): void {
    this.identityService.clearAuth();
    this.onCloseClick();
    this.router.navigate(['/login']);
  }
}
