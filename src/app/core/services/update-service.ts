import { inject, Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { ConfirmationService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class UpdateService {
  init() {
    if (!this.isEnabled || !('requestIdleCallback' in window)) return;

    requestIdleCallback(() => {
      this.checkForUpdate();
    });
  }
  private swUpdate = inject(SwUpdate);
  private confirmationService = inject(ConfirmationService);

  readonly isEnabled = this.swUpdate.isEnabled;

  constructor() {
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        this.confirmationService.confirm({
          message: 'New update available! Do you want to load it now?',
          header: 'App Update',
          icon: 'pi pi-info-circle',
          rejectVisible: false,
          accept: () => window.location.reload(),
        });
      });
  }

  // (اختياري) للتحقق يدوياً من التحديثات
  checkForUpdate() {
    this.swUpdate.checkForUpdate();
  }
}
