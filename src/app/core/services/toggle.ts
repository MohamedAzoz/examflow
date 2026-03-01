import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Toggle {
  private readonly isSidebarOpen = signal(false);

  /** Readonly computed for template binding */
  readonly isOpen = computed(() => this.isSidebarOpen());

  open(): void {
    this.isSidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  toggle(): void {
    this.isSidebarOpen.update((val) => !val);
  }

  value(): boolean {
    return this.isSidebarOpen();
  }
}