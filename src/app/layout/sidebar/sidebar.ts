import { Component, inject, input, output, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Toggle } from '../../core/services/toggle';
import { NavItem } from '../nav-item';

@Component({
  selector: 'app-sidebar',
  imports: [NgOptimizedImage],
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

  readonly navItemSelected = output<string>();

  protected onNavClick(route: string): void {
    this.navItemSelected.emit(route);

    // نعيده للوضع الافتراضي عند اختيار عنصر (ليختفي في الموبايل)
    if (this.toggle.value()) {
      this.toggle.closeSidebar();
    }
  }

  protected onCloseClick(): void {
    this.toggle.toggle(); // استخدمنا toggle لتعكس الحالة
  }
}
