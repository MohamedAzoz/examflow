import {
  Component,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { Toggle } from '../../core/services/toggle';
import { NavItem } from '../nav-item';

@Component({
  selector: 'app-sidebar',
  imports: [NgClass],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  protected readonly toggle = inject(Toggle);

  readonly navItems = input.required<readonly NavItem[]>();
  readonly userName = input<string>('User');
  readonly userRole = input<string>('');
  readonly activeRoute = input<string>('User Management');
  readonly isMobile = input<boolean>(false);

  readonly navItemSelected = output<string>();

  protected onNavClick(route: string): void {
    this.navItemSelected.emit(route);

    if (this.isMobile()) {
      this.toggle.closeSidebar();
    }
  }

  protected onCloseClick(): void {
    this.toggle.closeSidebar();
  }
}