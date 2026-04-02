import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Toggle {
  private readonly isSidebarOpen = signal(false);
   readonly isExamMode = signal(false);

  examMode(value: boolean) {
    if (value) {
      this.isSidebarOpen.set(true);
      this.isExamMode.set(true);
    } else {
      this.isSidebarOpen.set(false);
      this.isExamMode.set(false);
    }
  }

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
