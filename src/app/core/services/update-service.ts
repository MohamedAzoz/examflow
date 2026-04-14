import { inject, Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { ConfirmationService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class UpdateService {
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
          closable: true,
          closeOnEscape: true,
          acceptLabel: 'Yes',
          rejectLabel: 'No',
          accept: () => window.location.reload(),
          reject: () => false,
        });
      });
  }

  // (اختياري) للتحقق يدوياً من التحديثات
  checkForUpdate() {
    this.swUpdate.checkForUpdate();
  }
}
