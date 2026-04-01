import { Component, inject, input, output, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Toggle } from '../../core/services/toggle';
import { NavItem } from '../nav-item';
import { Router } from '@angular/router';
import { IdentityService } from '../../core/services/identity-service';

@Component({
  selector: 'app-sidebar',
  imports: [NgOptimizedImage],
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
  readonly isStudent = input<boolean>(this.identityService.isStudent());

  readonly navItemSelected = output<string>();

  protected onNavClick(route: string): void {
    this.router.navigate(['/main', route]);
    this.navItemSelected.emit(route);
    if (this.toggle.value()) {
      this.toggle.closeSidebar();
    }
  }

  protected onCloseClick(): void {
    this.toggle.toggle();
  }

  protected onLogout(): void {
    this.identityService.clearAuth();
    this.router.navigate(['/login']);
  }
}
